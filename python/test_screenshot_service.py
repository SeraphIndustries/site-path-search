#!/usr/bin/env python3
"""
Test script for the website screenshot service to verify Windows asyncio cleanup.
"""

import asyncio
import platform
import sys
from website_screenshot_service import WebsiteScreenshotService, ScreenshotAPI


async def test_screenshot_service():
    """Test the screenshot service with proper cleanup."""
    print("Testing Website Screenshot Service...")
    print(f"Platform: {platform.system()}")
    print(f"Python version: {sys.version}")

    url = "https://www.example.com"

    # Test 1: Basic service with context manager
    print("\n1. Testing basic service with context manager...")
    async with WebsiteScreenshotService() as service:
        screenshot = await service.take_screenshot(url, width=800, height=600)
        print(f"   Screenshot size: {len(screenshot)} bytes")

    # Test 2: Thumbnail
    print("\n2. Testing thumbnail...")
    async with WebsiteScreenshotService() as service:
        thumbnail = await service.take_thumbnail(url, width=200, height=150)
        print(f"   Thumbnail size: {len(thumbnail)} bytes")

    # Test 3: API wrapper
    print("\n3. Testing API wrapper...")
    api = ScreenshotAPI()
    try:
        screenshot = await api.get_screenshot(url, width=300, height=200)
        print(f"   API screenshot size: {len(screenshot)} bytes")
    finally:
        await api.cleanup()

    # Test 4: Multiple screenshots
    print("\n4. Testing multiple screenshots...")
    urls = [
        "https://www.example.com",
        "https://httpbin.org/html",
        "https://httpbin.org/json",
    ]

    for i, test_url in enumerate(urls, 1):
        try:
            async with WebsiteScreenshotService() as service:
                screenshot = await service.take_screenshot(
                    test_url, width=400, height=300
                )
                print(f"   Screenshot {i} ({test_url}): {len(screenshot)} bytes")
        except Exception as e:
            print(f"   Screenshot {i} failed: {e}")

    print("\nAll tests completed successfully!")
    print("If you don't see any 'unclosed transport' warnings, the fix is working.")


if __name__ == "__main__":
    try:
        asyncio.run(test_screenshot_service())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed: {e}")
    finally:
        print("Test script finished.")
