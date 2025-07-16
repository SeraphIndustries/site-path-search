#!/usr/bin/env python3
"""
Test script for the browser pool functionality.
"""

import sys
import os

# Add the parent directory to Python path so we can import from packages
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import time
from services.website_screenshot_service import (
    get_browser_pool,
    shutdown_browser_pool,
    ScreenshotAPI,
)


async def test_browser_pool():
    print("Testing browser pool functionality...")

    pool = await get_browser_pool(pool_size=2)
    print(f"Pool initialized: {await pool.health_check()}")

    urls = [
        "https://www.google.com",
        "https://www.github.com",
        "https://www.stackoverflow.com",
        "https://www.reddit.com",
    ]

    async def take_screenshot(url):
        # Use the same pool size as the main pool
        api = ScreenshotAPI(pool_size=2)
        start_time = time.time()

        try:
            screenshot = await api.get_screenshot(url, width=300, height=200)
            duration = time.time() - start_time
            print(f"Screenshot of {url}: {len(screenshot)} bytes in {duration:.2f}s")
            return screenshot
        except Exception as e:
            print(f"Error taking screenshot of {url}: {e}")
            return None

    print("\nTesting concurrent requests...")
    start_time = time.time()

    tasks = [take_screenshot(url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    total_time = time.time() - start_time
    print(f"Completed {len(results)} requests in {total_time:.2f}s")

    print(f"\nPool health after requests: {await pool.health_check()}")

    print("\nTesting pool exhaustion...")
    browsers = []
    try:
        for i in range(5):
            browser = await pool.get_browser()
            if browser:
                browsers.append(browser)
                print(f"Got browser {i+1}")
            else:
                print(f"Could not get browser {i+1} - pool exhausted")
                break

        for browser in browsers:
            await pool.return_browser(browser)
            print("Returned browser to pool")

    except Exception as e:
        print(f"Error during pool exhaustion test: {e}")

    print(f"Final pool health: {await pool.health_check()}")

    await shutdown_browser_pool()
    print("Browser pool shutdown complete")


async def test_screenshot_api():
    print("\nTesting ScreenshotAPI with browser pooling...")

    api = ScreenshotAPI(pool_size=2)

    url = "https://www.example.com"

    for i in range(3):
        start_time = time.time()
        screenshot = await api.get_screenshot(url, width=200, height=150)
        duration = time.time() - start_time
        print(f"Screenshot {i+1}: {len(screenshot)} bytes in {duration:.2f}s")

    print("ScreenshotAPI test complete")


if __name__ == "__main__":
    try:
        # Run tests in a single event loop to avoid resource conflicts
        async def run_all_tests():
            await test_browser_pool()
            await test_screenshot_api()
            print("\nAll tests completed successfully!")

        asyncio.run(run_all_tests())
    except KeyboardInterrupt:
        print("\nTests interrupted by user")
    except Exception as e:
        print(f"Test error: {e}")
        import traceback

        traceback.print_exc()
    finally:
        # Ensure cleanup happens
        try:
            asyncio.run(shutdown_browser_pool())
        except:
            pass
