"""
Website Screenshot Service using Playwright
Provides high-quality screenshots of websites with various customization options.
"""

import asyncio
import base64
import io
import logging
import platform
import sys
from pathlib import Path
from typing import Optional, Dict, Any, Union, List
from urllib.parse import urlparse
import time
from collections import deque
import threading

if platform.system() == "Windows":
    if sys.version_info >= (3, 8):
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    else:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

try:
    from playwright.async_api import async_playwright, Browser, Page
except ImportError:
    print("Playwright not installed. Installing required dependencies...")
    import subprocess
    import sys

    subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])
    subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
    from playwright.async_api import async_playwright, Browser, Page

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BrowserPool:
    """
    A pool of pre-created browser instances for efficient screenshot taking.
    """

    def __init__(self, pool_size: int = 3, headless: bool = True, timeout: int = 30000):
        """
        Initialize the browser pool.

        Args:
            pool_size (int): Number of browser instances to maintain in the pool
            headless (bool): Whether to run browsers in headless mode
            timeout (int): Timeout for page operations in milliseconds
        """
        self.pool_size = pool_size
        self.headless = headless
        self.timeout = timeout
        self.browsers: deque = deque()
        self.playwright = None
        self._lock = asyncio.Lock()
        self._initialized = False
        self._shutdown = False

    async def initialize(self):
        """Initialize the browser pool with pre-created browser instances."""
        if self._initialized:
            return

        async with self._lock:
            if self._initialized:
                return

            try:
                logger.info(
                    f"Initializing browser pool with {self.pool_size} instances..."
                )
                self.playwright = await async_playwright().start()

                # Create browser instances
                for i in range(self.pool_size):
                    try:
                        browser = await self.playwright.chromium.launch(
                            headless=self.headless,
                            args=[
                                "--no-sandbox",
                                "--disable-setuid-sandbox",
                                "--disable-dev-shm-usage",
                                "--disable-accelerated-2d-canvas",
                                "--no-first-run",
                                "--no-zygote",
                                "--disable-gpu",
                                "--disable-web-security",
                                "--disable-features=VizDisplayCompositor",
                            ],
                        )
                        self.browsers.append(browser)
                        logger.info(f"Created browser instance {i+1}/{self.pool_size}")
                    except Exception as e:
                        logger.error(f"Failed to create browser instance {i+1}: {e}")
                        # Try Firefox as fallback
                        try:
                            browser = await self.playwright.firefox.launch(
                                headless=self.headless
                            )
                            self.browsers.append(browser)
                            logger.info(
                                f"Created Firefox browser instance {i+1}/{self.pool_size}"
                            )
                        except Exception as e2:
                            logger.error(
                                f"Failed to create Firefox browser instance {i+1}: {e2}"
                            )

                self._initialized = True
                logger.info(
                    f"Browser pool initialized with {len(self.browsers)} instances"
                )

            except Exception as e:
                logger.error(f"Failed to initialize browser pool: {e}")
                raise

    async def get_browser(self) -> Optional[Browser]:
        """Get a browser instance from the pool."""
        if not self._initialized:
            await self.initialize()

        if self._shutdown:
            return None

        async with self._lock:
            if self.browsers:
                browser = self.browsers.popleft()
                logger.info(
                    f"Retrieved browser from pool. {len(self.browsers)} remaining"
                )
                return browser
            else:
                logger.warning("No browsers available in pool")
                return None

    async def return_browser(self, browser: Browser):
        """Return a browser instance to the pool."""
        if self._shutdown:
            try:
                await browser.close()
            except:
                pass
            return

        async with self._lock:
            if len(self.browsers) < self.pool_size:
                self.browsers.append(browser)
                logger.info(f"Returned browser to pool. {len(self.browsers)} total")
            else:
                # Pool is full, close the browser
                try:
                    await browser.close()
                    logger.info("Pool full, closed browser")
                except Exception as e:
                    logger.warning(f"Failed to close browser: {e}")

    async def shutdown(self):
        """Shutdown the browser pool and close all browsers."""
        if self._shutdown:
            return

        self._shutdown = True

        try:
            async with self._lock:
                logger.info("Shutting down browser pool...")

                # Close all browsers in the pool
                browsers_to_close = []
                while self.browsers:
                    try:
                        browser = self.browsers.popleft()
                        browsers_to_close.append(browser)
                    except Exception as e:
                        logger.warning(f"Error removing browser from pool: {e}")

                # Close browsers outside the lock to avoid deadlocks
                for browser in browsers_to_close:
                    try:
                        await browser.close()
                    except Exception as e:
                        logger.warning(f"Failed to close browser during shutdown: {e}")

                # Stop playwright
                if self.playwright:
                    try:
                        await self.playwright.stop()
                    except Exception as e:
                        logger.warning(f"Failed to stop playwright during shutdown: {e}")

                logger.info("Browser pool shutdown complete")
        except Exception as e:
            logger.error(f"Error during browser pool shutdown: {e}")
            # Try to stop playwright even if there was an error
            if self.playwright:
                try:
                    await self.playwright.stop()
                except:
                    pass

    async def health_check(self) -> Dict[str, Any]:
        """Check the health of the browser pool."""
        return {
            "initialized": self._initialized,
            "shutdown": self._shutdown,
            "pool_size": self.pool_size,
            "available_browsers": len(self.browsers),
            "total_browsers": len(self.browsers),
        }


# Global browser pool instance
_browser_pool: Optional[BrowserPool] = None
_pool_lock = asyncio.Lock()


async def get_browser_pool(pool_size: int = 3) -> BrowserPool:
    """Get or create the global browser pool instance."""
    global _browser_pool

    async with _pool_lock:
        if _browser_pool is None:
            _browser_pool = BrowserPool(pool_size=pool_size)
            await _browser_pool.initialize()
        elif _browser_pool.pool_size != pool_size:
            # If pool size changed, shutdown old pool and create new one
            logger.info(
                f"Pool size changed from {_browser_pool.pool_size} to {pool_size}, recreating pool"
            )
            await _browser_pool.shutdown()
            _browser_pool = BrowserPool(pool_size=pool_size)
            await _browser_pool.initialize()
        return _browser_pool


async def shutdown_browser_pool():
    """Shutdown the global browser pool."""
    global _browser_pool

    async with _pool_lock:
        if _browser_pool:
            await _browser_pool.shutdown()
            _browser_pool = None


class WebsiteScreenshotService:
    """
    A service for taking high-quality screenshots of websites using Playwright.
    """

    def __init__(self, headless: bool = True, timeout: int = 30000):
        """
        Initialize the screenshot service.

        Args:
            headless (bool): Whether to run browser in headless mode
            timeout (int): Timeout for page operations in milliseconds
        """
        self.headless = headless
        self.timeout = timeout
        self.browser: Optional[Browser] = None
        self.playwright = None

    async def __aenter__(self):
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()

    async def start(self):
        if self.browser is None:
            try:
                self.playwright = await async_playwright().start()
                self.browser = await self.playwright.chromium.launch(
                    headless=self.headless,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                        "--no-first-run",
                        "--no-zygote",
                        "--disable-gpu",
                        "--disable-web-security",
                        "--disable-features=VizDisplayCompositor",
                    ],
                )
                logger.info("Browser started successfully")
            except Exception as e:
                logger.error(f"Failed to start browser: {e}")
                # Try alternative browser launch
                if self.playwright:
                    try:
                        self.browser = await self.playwright.firefox.launch(
                            headless=self.headless
                        )
                        logger.info("Firefox browser started as fallback")
                    except Exception as e2:
                        logger.error(f"Failed to start Firefox browser: {e2}")
                        raise Exception(f"Could not start any browser: {e}")
                else:
                    raise Exception(f"Could not start playwright: {e}")

    async def stop(self):
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
        logger.info("Browser stopped")

    async def take_screenshot(
        self,
        url: str,
        width: int = 1200,
        height: int = 800,
        full_page: bool = False,
        quality: int = 90,
        format: str = "jpeg",
        wait_for: Optional[str] = None,
        wait_time: int = 2000,
        user_agent: Optional[str] = None,
        viewport: Optional[Dict[str, int]] = None,
        **kwargs,
    ) -> bytes:
        """
        Take a screenshot of a website.

        Args:
            url (str): The URL to screenshot
            width (int): Viewport width
            height (int): Viewport height
            full_page (bool): Whether to capture the full page
            quality (int): Image quality (1-100)
            format (str): Image format ('jpeg', 'png', 'webp')
            wait_for (str): CSS selector to wait for before taking screenshot
            wait_time (int): Time to wait after page load (ms)
            user_agent (str): Custom user agent string
            viewport (dict): Custom viewport settings
            **kwargs: Additional page options

        Returns:
            bytes: Screenshot image data
        """
        if not self.browser:
            await self.start()

        page = await self.browser.new_page()  # type: ignore

        try:
            if viewport:
                await page.set_viewport_size(viewport)  # type: ignore
            else:
                await page.set_viewport_size({"width": width, "height": height})  # type: ignore

            if user_agent:
                await page.set_extra_http_headers({"User-Agent": user_agent})

            else:
                await page.set_extra_http_headers(
                    {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    }
                )

            logger.info(f"Navigating to {url}")
            await page.goto(url, timeout=self.timeout, wait_until="networkidle")

            if wait_for:
                logger.info(f"Waiting for element: {wait_for}")
                await page.wait_for_selector(wait_for, timeout=self.timeout)

            if wait_time > 0:
                await page.wait_for_timeout(wait_time)

            logger.info("Taking screenshot...")
            screenshot_options = {
                "full_page": full_page,
                "quality": quality,
                "type": format,
            }

            screenshot_bytes = await page.screenshot(**screenshot_options)
            logger.info(f"Screenshot taken successfully ({len(screenshot_bytes)} bytes)")

            return screenshot_bytes

        except Exception as e:
            logger.error(f"Error taking screenshot of {url}: {str(e)}")
            try:
                return self._generate_placeholder_sync(url, width, height)
            except Exception as placeholder_error:
                logger.error(f"Failed to generate placeholder: {placeholder_error}")
                raise e
        finally:
            try:
                await page.close()
            except Exception as close_error:
                logger.warning(f"Failed to close page: {close_error}")

    async def take_screenshot_as_base64(self, url: str, **kwargs) -> str:
        """
        Take a screenshot and return it as a base64 string.

        Args:
            url (str): The URL to screenshot
            **kwargs: Arguments passed to take_screenshot

        Returns:
            str: Base64 encoded screenshot
        """
        screenshot_bytes = await self.take_screenshot(url, **kwargs)
        return base64.b64encode(screenshot_bytes).decode("utf-8")

    async def take_screenshot_to_file(
        self, url: str, output_path: Union[str, Path], **kwargs
    ) -> Path:
        """
        Take a screenshot and save it to a file.

        Args:
            url (str): The URL to screenshot
            output_path (str|Path): Path to save the screenshot
            **kwargs: Arguments passed to take_screenshot

        Returns:
            Path: Path to the saved screenshot
        """
        screenshot_bytes = await self.take_screenshot(url, **kwargs)

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "wb") as f:
            f.write(screenshot_bytes)

        logger.info(f"Screenshot saved to {output_path}")
        return output_path

    async def take_thumbnail(
        self, url: str, width: int = 200, height: int = 150, **kwargs
    ) -> bytes:
        """
        Take a small thumbnail screenshot.

        Args:
            url (str): The URL to screenshot
            width (int): Thumbnail width
            height (int): Thumbnail height
            **kwargs: Additional arguments passed to take_screenshot

        Returns:
            bytes: Thumbnail image data
        """
        return await self.take_screenshot(
            url, width=width, height=height, full_page=False, **kwargs
        )

    async def take_full_page_screenshot(
        self, url: str, width: int = 1200, **kwargs
    ) -> bytes:
        """
        Take a full page screenshot.

        Args:
            url (str): The URL to screenshot
            width (int): Viewport width
            **kwargs: Additional arguments passed to take_screenshot

        Returns:
            bytes: Full page screenshot image data
        """
        return await self.take_screenshot(url, width=width, full_page=True, **kwargs)

    def _generate_placeholder_sync(self, url: str, width: int, height: int) -> bytes:
        try:
            from PIL import Image, ImageDraw, ImageFont
            import io

            img = Image.new("RGB", (width, height), color="#f0f0f0")
            draw = ImageDraw.Draw(img)

            try:
                domain = urlparse(url).netloc
            except:
                domain = "Unknown"

            text = f"Preview\n{domain}"
            try:
                font = ImageFont.load_default()
            except:
                font = None

            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]

            x = (width - text_width) // 2
            y = (height - text_height) // 2

            draw.text((x, y), text, fill="#666666", font=font)

            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format="JPEG", quality=85)
            return img_byte_arr.getvalue()
        except Exception as e:
            logger.error(f"Failed to generate placeholder: {e}")
            # Return a minimal placeholder
            return b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9"


class ScreenshotAPI:
    """
    API wrapper for the screenshot service with caching and browser pooling.
    """

    def __init__(
        self,
        cache_dir: Optional[str] = None,
        max_cache_size: int = 100,
        pool_size: int = 3,
    ):
        """
        Initialize the screenshot API.

        Args:
            cache_dir (str): Directory to cache screenshots
            max_cache_size (int): Maximum number of cached screenshots
            pool_size (int): Number of browser instances in the pool
        """
        self.cache_dir = Path(cache_dir) if cache_dir else Path("./screenshot_cache")
        self.max_cache_size = max_cache_size
        self.pool_size = pool_size
        self.cache_dir.mkdir(exist_ok=True)

    async def get_screenshot(
        self,
        url: str,
        width: int = 200,
        height: int = 150,
        use_cache: bool = True,
        **kwargs,
    ) -> bytes:
        """
        Get a screenshot, using cache if available and browser pool for efficiency.

        Args:
            url (str): The URL to screenshot
            width (int): Screenshot width
            height (int): Screenshot height
            use_cache (bool): Whether to use caching
            **kwargs: Additional arguments for screenshot

        Returns:
            bytes: Screenshot image data
        """
        if use_cache:
            cached = self._get_cached_screenshot(url, width, height)
            if cached:
                logger.info(f"Using cached screenshot for {url}")
                return cached

        # Get browser from pool
        browser = None
        pool = None
        try:
            pool = await get_browser_pool(self.pool_size)
            browser = await pool.get_browser()

            if not browser:
                logger.warning(
                    "No browser available from pool, falling back to new instance"
                )
                # Fallback to creating a new service instance
                service = WebsiteScreenshotService()
                await service.start()
                screenshot = await service.take_screenshot(
                    url, width=width, height=height, **kwargs
                )
                await service.stop()
            else:
                # Use browser from pool
                logger.debug(f"Using browser from pool for {url}")
                screenshot = await self._take_screenshot_with_browser(
                    browser, url, width, height, **kwargs
                )
                # Return browser to pool
                await pool.return_browser(browser)
                browser = None  # Prevent cleanup in finally block

            if use_cache:
                self._cache_screenshot(url, width, height, screenshot)

            return screenshot

        except Exception as e:
            logger.error(f"Failed to get screenshot for {url}: {e}")
            return self._generate_placeholder(url, width, height)
        finally:
            # Cleanup browser if it wasn't returned to pool
            if browser and pool:
                try:
                    await pool.return_browser(browser)
                except Exception as e:
                    logger.warning(f"Failed to return browser to pool: {e}")
                    try:
                        await browser.close()
                    except Exception as close_error:
                        logger.warning(f"Failed to close browser: {close_error}")
            elif browser:
                try:
                    await browser.close()
                except Exception as e:
                    logger.warning(f"Failed to close browser: {e}")

    async def _take_screenshot_with_browser(
        self, browser: Browser, url: str, width: int, height: int, **kwargs
    ) -> bytes:
        """Take a screenshot using a provided browser instance."""
        page = await browser.new_page()

        try:
            await page.set_viewport_size({"width": width, "height": height})
            await page.set_extra_http_headers(
                {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            )

            logger.info(f"Navigating to {url}")
            await page.goto(url, timeout=30000, wait_until="networkidle")

            wait_time = kwargs.get("wait_time", 2000)
            if wait_time > 0:
                await page.wait_for_timeout(wait_time)

            logger.info("Taking screenshot...")
            screenshot_options = {
                "full_page": kwargs.get("full_page", False),
                "quality": kwargs.get("quality", 90),
                "type": kwargs.get("format", "jpeg"),
            }

            screenshot_bytes = await page.screenshot(**screenshot_options)
            logger.info(f"Screenshot taken successfully ({len(screenshot_bytes)} bytes)")

            return screenshot_bytes

        except Exception as e:
            logger.error(f"Error taking screenshot of {url}: {str(e)}")
            return self._generate_placeholder(url, width, height)
        finally:
            try:
                await page.close()
            except Exception as close_error:
                logger.warning(f"Failed to close page: {close_error}")

    async def cleanup(self):
        """Cleanup method - now handles browser pool shutdown."""
        await shutdown_browser_pool()

    def _get_cache_key(self, url: str, width: int, height: int) -> str:
        import hashlib

        key_data = f"{url}_{width}_{height}".encode("utf-8")
        return hashlib.md5(key_data).hexdigest()

    def _get_cached_screenshot(
        self, url: str, width: int, height: int
    ) -> Optional[bytes]:
        cache_key = self._get_cache_key(url, width, height)
        cache_file = self.cache_dir / f"{cache_key}.jpg"

        if cache_file.exists():
            try:
                with open(cache_file, "rb") as f:
                    return f.read()
            except Exception as e:
                logger.warning(f"Failed to read cached screenshot: {e}")

        return None

    def _cache_screenshot(self, url: str, width: int, height: int, screenshot: bytes):
        cache_key = self._get_cache_key(url, width, height)
        cache_file = self.cache_dir / f"{cache_key}.jpg"

        try:
            with open(cache_file, "wb") as f:
                f.write(screenshot)

            self._cleanup_cache()
        except Exception as e:
            logger.warning(f"Failed to cache screenshot: {e}")

    def _cleanup_cache(self):
        cache_files = list(self.cache_dir.glob("*.jpg"))
        if len(cache_files) > self.max_cache_size:
            cache_files.sort(key=lambda x: x.stat().st_mtime)
            for old_file in cache_files[: -self.max_cache_size]:
                try:
                    old_file.unlink()
                except Exception as e:
                    logger.warning(f"Failed to remove old cache file {old_file}: {e}")

    def _generate_placeholder(self, url: str, width: int, height: int) -> bytes:
        from PIL import Image, ImageDraw, ImageFont
        import io

        img = Image.new("RGB", (width, height), color="#f0f0f0")
        draw = ImageDraw.Draw(img)

        try:
            domain = urlparse(url).netloc
        except:
            domain = "Unknown"

        text = f"Preview\n{domain}"
        try:
            font = ImageFont.load_default()
        except:
            font = None

        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        x = (width - text_width) // 2
        y = (height - text_height) // 2

        draw.text((x, y), text, fill="#666666", font=font)

        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="JPEG", quality=85)
        return img_byte_arr.getvalue()


# Convenience functions for easy use
async def take_screenshot(url: str, **kwargs) -> bytes:
    async with WebsiteScreenshotService() as service:
        return await service.take_screenshot(url, **kwargs)


async def take_thumbnail(url: str, **kwargs) -> bytes:
    async with WebsiteScreenshotService() as service:
        return await service.take_thumbnail(url, **kwargs)


if __name__ == "__main__":
    # Example usage
    async def main():
        url = "https://www.example.com"

        async with WebsiteScreenshotService() as service:
            screenshot = await service.take_screenshot(url)
            print(f"Screenshot size: {len(screenshot)} bytes")

        async with WebsiteScreenshotService() as service:
            thumbnail = await service.take_thumbnail(url, width=200, height=150)
            print(f"Thumbnail size: {len(thumbnail)} bytes")

        api = ScreenshotAPI()
        screenshot = await api.get_screenshot(url, width=300, height=200)
        print(f"API screenshot size: {len(screenshot)} bytes")

        # Cleanup browser pool
        await api.cleanup()

    # Run the example
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    except Exception as e:
        print(f"Error: {e}")
