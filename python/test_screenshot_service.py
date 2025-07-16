"""
Test script for the website screenshot service.
"""

import asyncio
import base64
from pathlib import Path
from website_screenshot_service import WebsiteScreenshotService, ScreenshotAPI


async def test_basic_screenshot():
    """Test basic screenshot functionality."""
    print("Testing basic screenshot...")

    url = "https://www.example.com"

    async with WebsiteScreenshotService() as service:
        screenshot = await service.take_screenshot(url, width=800, height=600)
        print(f"Basic screenshot size: {len(screenshot)} bytes")

        output_path = Path("test_screenshot.jpg")
        await service.take_screenshot_to_file(url, output_path, width=800, height=600)
        print(f"Screenshot saved to: {output_path}")

        thumbnail = await service.take_thumbnail(url, width=200, height=150)
        print(f"Thumbnail size: {len(thumbnail)} bytes")

        thumbnail_path = Path("test_thumbnail.jpg")
        with open(thumbnail_path, "wb") as f:
            f.write(thumbnail)
        print(f"Thumbnail saved to: {thumbnail_path}")


async def test_full_page_screenshot():
    """Test full page screenshot functionality."""
    print("\nTesting full page screenshot...")

    url = "https://www.example.com"

    async with WebsiteScreenshotService() as service:
        full_screenshot = await service.take_full_page_screenshot(url, width=1200)
        print(f"Full page screenshot size: {len(full_screenshot)} bytes")

        full_path = Path("test_full_page.jpg")
        with open(full_path, "wb") as f:
            f.write(full_screenshot)
        print(f"Full page screenshot saved to: {full_path}")


async def test_screenshot_api():
    """Test the ScreenshotAPI wrapper with caching."""
    print("\nTesting ScreenshotAPI with caching...")

    url = "https://www.example.com"
    api = ScreenshotAPI(cache_dir="./test_cache", max_cache_size=10)

    print("Taking first screenshot...")
    screenshot1 = await api.get_screenshot(url, width=300, height=200)
    print(f"First screenshot size: {len(screenshot1)} bytes")

    print("Taking second screenshot (should use cache)...")
    screenshot2 = await api.get_screenshot(url, width=300, height=200)
    print(f"Second screenshot size: {len(screenshot2)} bytes")

    if screenshot1 == screenshot2:
        print("✓ Cache working correctly - screenshots are identical")
    else:
        print("✗ Cache not working - screenshots are different")

    print("Taking screenshot with different dimensions...")
    screenshot3 = await api.get_screenshot(url, width=400, height=300)
    print(f"Different dimensions screenshot size: {len(screenshot3)} bytes")

    if screenshot1 != screenshot3:
        print("✓ Different dimensions correctly bypassed cache")
    else:
        print("✗ Cache incorrectly used for different dimensions")


async def test_base64_screenshot():
    """Test base64 screenshot functionality."""
    print("\nTesting base64 screenshot...")

    url = "https://www.example.com"

    async with WebsiteScreenshotService() as service:
        base64_screenshot = await service.take_screenshot_as_base64(
            url, width=400, height=300
        )
        print(f"Base64 screenshot length: {len(base64_screenshot)} characters")

        screenshot_bytes = base64.b64decode(base64_screenshot)
        base64_path = Path("test_base64.jpg")
        with open(base64_path, "wb") as f:
            f.write(screenshot_bytes)
        print(f"Base64 screenshot saved to: {base64_path}")


async def test_error_handling():
    """Test error handling with invalid URLs."""
    print("\nTesting error handling...")

    invalid_url = "https://this-domain-does-not-exist-12345.com"

    async with WebsiteScreenshotService() as service:
        try:
            screenshot = await service.take_screenshot(invalid_url, width=200, height=150)
            print(f"Unexpected success with invalid URL: {len(screenshot)} bytes")
        except Exception as e:
            print(f"✓ Correctly handled invalid URL: {e}")


async def test_multiple_urls():
    """Test taking screenshots of multiple URLs."""
    print("\nTesting multiple URLs...")

    urls = [
        "https://www.example.com",
        "https://httpbin.org/html",
        "https://jsonplaceholder.typicode.com",
    ]

    async with WebsiteScreenshotService() as service:
        for i, url in enumerate(urls):
            try:
                screenshot = await service.take_thumbnail(url, width=200, height=150)
                output_path = Path(f"test_url_{i}.jpg")
                with open(output_path, "wb") as f:
                    f.write(screenshot)
                print(f"✓ Screenshot {i+1}: {url} -> {output_path}")
            except Exception as e:
                print(f"✗ Failed to screenshot {url}: {e}")


async def main():
    """Run all tests."""
    print("Starting Website Screenshot Service Tests")
    print("=" * 50)

    try:
        await test_basic_screenshot()
        await test_full_page_screenshot()
        await test_screenshot_api()
        await test_base64_screenshot()
        await test_error_handling()
        await test_multiple_urls()

        print("\n" + "=" * 50)
        print("All tests completed!")

    except Exception as e:
        print(f"\nTest failed with error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
