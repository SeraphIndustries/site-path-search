"""
Website Screenshot Service using Playwright
Provides high-quality screenshots of websites with various customization options.
"""

import asyncio
import base64
import io
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Union
from urllib.parse import urlparse
import time

try:
    from playwright.async_api import async_playwright, Browser, Page
except ImportError:
    print("Playwright not installed. Installing required dependencies...")
    import subprocess
    import sys

    subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])
    subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
    from playwright.async_api import async_playwright, Browser, Page

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
        """Async context manager entry."""
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.stop()

    async def start(self):
        """Start the browser instance."""
        if self.browser is None:
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
                ],
            )
            logger.info("Browser started successfully")

    async def stop(self):
        """Stop the browser instance."""
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
            raise
        finally:
            await page.close()

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
        Take a full-page screenshot.

        Args:
            url (str): The URL to screenshot
            width (int): Viewport width
            **kwargs: Additional arguments passed to take_screenshot

        Returns:
            bytes: Full page screenshot data
        """
        return await self.take_screenshot(url, width=width, full_page=True, **kwargs)


class ScreenshotAPI:
    """
    API wrapper for the screenshot service with caching and rate limiting.
    """

    def __init__(self, cache_dir: Optional[str] = None, max_cache_size: int = 100):
        """
        Initialize the screenshot API.

        Args:
            cache_dir (str): Directory to cache screenshots
            max_cache_size (int): Maximum number of cached screenshots
        """
        self.cache_dir = Path(cache_dir) if cache_dir else Path("./screenshot_cache")
        self.max_cache_size = max_cache_size
        self.cache_dir.mkdir(exist_ok=True)
        self.service = None

    async def get_screenshot(
        self,
        url: str,
        width: int = 200,
        height: int = 150,
        use_cache: bool = True,
        **kwargs,
    ) -> bytes:
        """
        Get a screenshot, using cache if available.

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

        if not self.service:
            self.service = WebsiteScreenshotService()
            await self.service.start()

        try:
            screenshot = await self.service.take_screenshot(
                url, width=width, height=height, **kwargs
            )

            if use_cache:
                self._cache_screenshot(url, width, height, screenshot)

            return screenshot

        except Exception as e:
            logger.error(f"Failed to get screenshot for {url}: {e}")
            return self._generate_placeholder(url, width, height)

    def _get_cache_key(self, url: str, width: int, height: int) -> str:
        """Generate a cache key for the URL and dimensions."""
        import hashlib

        key_data = f"{url}_{width}_{height}".encode("utf-8")
        return hashlib.md5(key_data).hexdigest()

    def _get_cached_screenshot(
        self, url: str, width: int, height: int
    ) -> Optional[bytes]:
        """Get a cached screenshot if available."""
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
        """Cache a screenshot."""
        cache_key = self._get_cache_key(url, width, height)
        cache_file = self.cache_dir / f"{cache_key}.jpg"

        try:
            with open(cache_file, "wb") as f:
                f.write(screenshot)

            self._cleanup_cache()
        except Exception as e:
            logger.warning(f"Failed to cache screenshot: {e}")

    def _cleanup_cache(self):
        """Clean up old cache files."""
        cache_files = list(self.cache_dir.glob("*.jpg"))
        if len(cache_files) > self.max_cache_size:
            cache_files.sort(key=lambda x: x.stat().st_mtime)
            for old_file in cache_files[: -self.max_cache_size]:
                try:
                    old_file.unlink()
                except Exception as e:
                    logger.warning(f"Failed to remove old cache file {old_file}: {e}")

    def _generate_placeholder(self, url: str, width: int, height: int) -> bytes:
        """Generate a placeholder image when screenshot fails."""
        from PIL import Image, ImageDraw, ImageFont
        import io

        img = Image.new("RGB", (width, height), color="#f0f0f0")
        draw = ImageDraw.Draw(img)

        try:
            domain = urlparse(url).netloc
        except:
            domain = "Unknown"

        # Add text
        text = f"Preview\n{domain}"
        try:
            # Try to use a default font
            font = ImageFont.load_default()
        except:
            font = None

        # Calculate text position
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        x = (width - text_width) // 2
        y = (height - text_height) // 2

        draw.text((x, y), text, fill="#666666", font=font)

        # Convert to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="JPEG", quality=85)
        return img_byte_arr.getvalue()


# Convenience functions for easy use
async def take_screenshot(url: str, **kwargs) -> bytes:
    """Take a screenshot of a URL."""
    async with WebsiteScreenshotService() as service:
        return await service.take_screenshot(url, **kwargs)


async def take_thumbnail(url: str, **kwargs) -> bytes:
    """Take a thumbnail screenshot of a URL."""
    async with WebsiteScreenshotService() as service:
        return await service.take_thumbnail(url, **kwargs)


if __name__ == "__main__":
    # Example usage
    async def main():
        url = "https://www.example.com"

        # Basic screenshot
        async with WebsiteScreenshotService() as service:
            screenshot = await service.take_screenshot(url)
            print(f"Screenshot size: {len(screenshot)} bytes")

        # Thumbnail
        async with WebsiteScreenshotService() as service:
            thumbnail = await service.take_thumbnail(url, width=200, height=150)
            print(f"Thumbnail size: {len(thumbnail)} bytes")

        # Using the API wrapper
        api = ScreenshotAPI()
        screenshot = await api.get_screenshot(url, width=300, height=200)
        print(f"API screenshot size: {len(screenshot)} bytes")

    asyncio.run(main())
