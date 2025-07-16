#!/usr/bin/env python3
"""
Simple test for browser pool functionality.
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


async def test_simple_pool():
    """Simple test of browser pool functionality."""
    print("Testing browser pool...")

    # Initialize pool
    pool = await get_browser_pool(pool_size=2)
    print(f"Pool health: {await pool.health_check()}")

    # Test single screenshot
    api = ScreenshotAPI(pool_size=2)

    url = "https://www.example.com"
    print(f"Taking screenshot of {url}...")

    start_time = time.time()
    screenshot = await api.get_screenshot(url, width=200, height=150)
    duration = time.time() - start_time

    print(f"Screenshot: {len(screenshot)} bytes in {duration:.2f}s")
    print(f"Pool health after screenshot: {await pool.health_check()}")

    # Test multiple screenshots
    urls = ["https://www.google.com", "https://www.github.com"]

    print(f"\nTaking {len(urls)} screenshots...")
    start_time = time.time()

    for i, url in enumerate(urls):
        screenshot = await api.get_screenshot(url, width=200, height=150)
        print(f"Screenshot {i+1}: {len(screenshot)} bytes")

    total_time = time.time() - start_time
    print(f"Total time: {total_time:.2f}s")
    print(f"Final pool health: {await pool.health_check()}")

    # Cleanup
    await shutdown_browser_pool()
    print("Test completed successfully!")


if __name__ == "__main__":
    try:
        asyncio.run(test_simple_pool())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test error: {e}")
        import traceback

        traceback.print_exc()
