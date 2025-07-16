"""
Example usage of the Website Screenshot Service.
This script demonstrates various ways to use the service.
"""

import sys
import os

# Add the parent directory to Python path so we can import from packages
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import base64
from pathlib import Path
from services.website_screenshot_service import WebsiteScreenshotService, ScreenshotAPI


async def example_basic_screenshot():
    """Example: Basic screenshot functionality."""
    print("📸 Example 1: Basic Screenshot")
    print("-" * 40)

    url = "https://www.noahpinion.blog/p/tokyo-is-the-new-paris"

    async with WebsiteScreenshotService() as service:
        # Take a basic screenshot
        screenshot = await service.take_screenshot(
            url=url, width=800, height=600, quality=90
        )

        # Save to file
        output_path = Path("example_basic.jpg")
        with open(output_path, "wb") as f:
            f.write(screenshot)

        print(f"✅ Screenshot saved: {output_path}")
        print(f"📊 Size: {len(screenshot)} bytes")


async def example_thumbnail():
    """Example: Thumbnail generation."""
    print("\n🖼️  Example 2: Thumbnail Generation")
    print("-" * 40)

    url = "https://www.noahpinion.blog/p/tokyo-is-the-new-paris"

    async with WebsiteScreenshotService() as service:
        # Generate thumbnail
        thumbnail = await service.take_thumbnail(
            url=url, width=200, height=150, quality=85
        )

        # Save thumbnail
        thumbnail_path = Path("example_thumbnail.jpg")
        with open(thumbnail_path, "wb") as f:
            f.write(thumbnail)

        print(f"✅ Thumbnail saved: {thumbnail_path}")
        print(f"📊 Size: {len(thumbnail)} bytes")


async def example_full_page():
    """Example: Full page screenshot."""
    print("\n📄 Example 3: Full Page Screenshot")
    print("-" * 40)

    url = "https://www.noahpinion.blog/p/tokyo-is-the-new-paris"

    async with WebsiteScreenshotService() as service:
        # Take full page screenshot
        full_screenshot = await service.take_full_page_screenshot(
            url=url, width=1200, quality=90
        )

        # Save full page screenshot
        full_path = Path("example_full_page.jpg")
        with open(full_path, "wb") as f:
            f.write(full_screenshot)

        print(f"✅ Full page screenshot saved: {full_path}")
        print(f"📊 Size: {len(full_screenshot)} bytes")


async def example_base64():
    """Example: Base64 encoding for web use."""
    print("\n🔗 Example 4: Base64 Encoding")
    print("-" * 40)

    url = "https://www.noahpinion.blog/p/tokyo-is-the-new-paris"

    async with WebsiteScreenshotService() as service:
        # Get base64 encoded screenshot
        base64_screenshot = await service.take_screenshot_as_base64(
            url=url, width=400, height=300, quality=85
        )

        print(f"✅ Base64 screenshot generated")
        print(f"📊 Length: {len(base64_screenshot)} characters")
        print(f"🔗 Preview: data:image/jpeg;base64,{base64_screenshot[:50]}...")


async def example_caching():
    """Example: Using the caching API."""
    print("\n💾 Example 5: Caching API")
    print("-" * 40)

    url = "https://www.noahpinion.blog/p/tokyo-is-the-new-paris"
    api = ScreenshotAPI(cache_dir="./example_cache", max_cache_size=10)

    # First request (fresh)
    print("🔄 Taking first screenshot (fresh)...")
    screenshot1 = await api.get_screenshot(url, width=300, height=200)
    print(f"📊 First screenshot size: {len(screenshot1)} bytes")

    # Second request (cached)
    print("🔄 Taking second screenshot (cached)...")
    screenshot2 = await api.get_screenshot(url, width=300, height=200)
    print(f"📊 Second screenshot size: {len(screenshot2)} bytes")

    # Verify cache is working
    if screenshot1 == screenshot2:
        print("✅ Cache working correctly - screenshots are identical")
    else:
        print("❌ Cache not working - screenshots are different")


async def example_multiple_urls():
    """Example: Processing multiple URLs."""
    print("\n🌐 Example 6: Multiple URLs")
    print("-" * 40)

    urls = [
        "https://www.noahpinion.blog/p/tokyo-is-the-new-paris",
        "https://httpbin.org/html",
        "https://jsonplaceholder.typicode.com",
    ]

    async with WebsiteScreenshotService() as service:
        for i, url in enumerate(urls, 1):
            try:
                print(f"🔄 Processing URL {i}: {url}")
                screenshot = await service.take_thumbnail(url, width=200, height=150)

                output_path = Path(f"example_url_{i}.jpg")
                with open(output_path, "wb") as f:
                    f.write(screenshot)

                print(f"✅ Screenshot {i} saved: {output_path}")
                print(f"📊 Size: {len(screenshot)} bytes")

            except Exception as e:
                print(f"❌ Failed to screenshot {url}: {e}")


async def example_custom_settings():
    """Example: Custom browser and screenshot settings."""
    print("\n⚙️  Example 7: Custom Settings")
    print("-" * 40)

    url = "https://www.noahpinion.blog/p/tokyo-is-the-new-paris"

    service = WebsiteScreenshotService(headless=True, timeout=45000)  # 45 seconds timeout

    await service.start()

    try:
        screenshot = await service.take_screenshot(
            url=url,
            width=1024,
            height=768,
            quality=95,
            format="jpeg",
            wait_time=3000,  # Wait 3 seconds after page load
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        )

        custom_path = Path("example_custom.jpg")
        with open(custom_path, "wb") as f:
            f.write(screenshot)

        print(f"✅ Custom screenshot saved: {custom_path}")
        print(f"📊 Size: {len(screenshot)} bytes")
        print(f"⚙️  Settings: 1024x768, 95% quality, 3s wait")

    finally:
        await service.stop()


async def example_error_handling():
    """Example: Error handling and fallbacks."""
    print("\n🛡️  Example 8: Error Handling")
    print("-" * 40)

    invalid_url = "https://this-domain-does-not-exist-12345.com"

    async with WebsiteScreenshotService() as service:
        try:
            print(f"🔄 Attempting to screenshot invalid URL: {invalid_url}")
            screenshot = await service.take_screenshot(invalid_url, width=200, height=150)
            print(f"❌ Unexpected success with invalid URL")
        except Exception as e:
            print(f"✅ Correctly handled invalid URL: {type(e).__name__}")

    api = ScreenshotAPI()
    try:
        print(f"🔄 Testing API wrapper with invalid URL...")
        screenshot = await api.get_screenshot(invalid_url, width=200, height=150)
        print(f"✅ API wrapper generated fallback image: {len(screenshot)} bytes")
    except Exception as e:
        print(f"❌ API wrapper failed: {e}")


async def main():
    """Run all examples."""
    print("🚀 Website Screenshot Service Examples")
    print("=" * 50)

    try:
        await example_basic_screenshot()
        # await example_thumbnail()
        # await example_full_page()
        # await example_base64()
        # await example_caching()
        # await example_multiple_urls()
        # await example_custom_settings()
        # await example_error_handling()

        print("\n" + "=" * 50)
        print("🎉 All examples completed successfully!")
        print("\nGenerated files:")

        for file_path in Path(".").glob("example_*.jpg"):
            print(f"  📄 {file_path}")

        print("\nNext steps:")
        print("  • Check the generated image files")
        print("  • Try the FastAPI endpoints: python main.py")
        print("  • Run tests: python test_screenshot_service.py")

    except Exception as e:
        print(f"\n❌ Example failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
