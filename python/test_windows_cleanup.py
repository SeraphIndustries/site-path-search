#!/usr/bin/env python3
"""
Minimal test to verify Windows asyncio cleanup fix.
"""

import asyncio
import platform
from website_screenshot_service import WebsiteScreenshotService


async def test_cleanup():
    """Test that the service cleans up properly without warnings."""
    print(f"Testing on {platform.system()}")

    url = "https://www.example.com"

    # Test multiple service instances to trigger the cleanup issue
    for i in range(3):
        print(f"Test {i+1}: Taking screenshot...")
        async with WebsiteScreenshotService() as service:
            screenshot = await service.take_screenshot(url, width=400, height=300)
            print(f"  Screenshot size: {len(screenshot)} bytes")

    print("All tests completed. Check for any 'unclosed transport' warnings above.")


if __name__ == "__main__":
    asyncio.run(test_cleanup())
