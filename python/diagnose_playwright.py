#!/usr/bin/env python3
"""
Diagnostic script for Playwright installation and Windows compatibility.
"""

import sys
import platform
import asyncio
import subprocess
from pathlib import Path


def check_python_version():
    print("🐍 Python Version Check")
    print("-" * 30)
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")

    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required")
        return False
    else:
        print("✅ Python version is compatible")
        return True


def check_platform():
    print("\n💻 Platform Information")
    print("-" * 30)
    print(f"Platform: {platform.system()}")
    print(f"Architecture: {platform.machine()}")
    print(f"Python executable: {sys.executable}")

    if platform.system() == "Windows":
        print("✅ Windows detected - will apply Windows-specific fixes")
    else:
        print("ℹ️  Non-Windows platform detected")

    return True


def check_playwright_installation():
    print("\n📦 Playwright Installation Check")
    print("-" * 30)

    try:
        import playwright

        print("✅ Playwright package is installed")
    except ImportError:
        print("❌ Playwright package not installed")
        return False

    try:
        result = subprocess.run(
            [sys.executable, "-m", "playwright", "--version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            print(f"✅ Playwright CLI: {result.stdout.strip()}")
        else:
            print(f"❌ Playwright CLI error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Playwright CLI check failed: {e}")
        return False

    return True


def check_browser_installation():
    print("\n🌐 Browser Installation Check")
    print("-" * 30)

    browsers = ["chromium", "firefox", "webkit"]
    installed_browsers = []

    for browser in browsers:
        try:
            result = subprocess.run(
                [sys.executable, "-m", "playwright", "install", "--dry-run", browser],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if "is already installed" in result.stdout:
                print(f"✅ {browser.capitalize()} is installed")
                installed_browsers.append(browser)
            else:
                print(f"❌ {browser.capitalize()} is not installed")
        except Exception as e:
            print(f"❌ Failed to check {browser}: {e}")

    if not installed_browsers:
        print("\n⚠️  No browsers installed. Installing Chromium...")
        try:
            subprocess.run(
                [sys.executable, "-m", "playwright", "install", "chromium"],
                check=True,
                timeout=60,
            )
            print("✅ Chromium installed successfully")
            installed_browsers.append("chromium")
        except Exception as e:
            print(f"❌ Failed to install Chromium: {e}")
            return False

    return len(installed_browsers) > 0


def test_asyncio_policy():
    print("\n🔄 Asyncio Event Loop Policy Test")
    print("-" * 30)

    if platform.system() == "Windows":
        try:
            # Test Windows-specific event loop policy
            if sys.version_info >= (3, 8):
                asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                print("✅ WindowsProactorEventLoopPolicy set")
            else:
                asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
                print("✅ WindowsSelectorEventLoopPolicy set")
        except Exception as e:
            print(f"❌ Failed to set event loop policy: {e}")
            return False
    else:
        print("ℹ️  Non-Windows platform - using default event loop policy")

    return True


async def test_playwright_basic():
    print("\n🧪 Basic Playwright Test")
    print("-" * 30)

    try:
        from playwright.async_api import async_playwright

        playwright = await async_playwright().start()
        print("✅ Playwright started successfully")

        # Try to launch browser
        browser = await playwright.chromium.launch(headless=True)
        print("✅ Chromium browser launched successfully")

        # Create a page
        page = await browser.new_page()
        print("✅ Page created successfully")

        # Navigate to a simple page
        await page.goto("data:text/html,<h1>Test</h1>")
        print("✅ Navigation successful")

        # Take a screenshot
        screenshot = await page.screenshot()
        print(f"✅ Screenshot taken: {len(screenshot)} bytes")

        # Cleanup
        await page.close()
        await browser.close()
        await playwright.stop()
        print("✅ Cleanup successful")

        return True

    except Exception as e:
        print(f"❌ Playwright test failed: {e}")
        return False


def main():
    print("🔍 Playwright Diagnostic Tool")
    print("=" * 40)

    checks = [
        ("Python Version", check_python_version),
        ("Platform", check_platform),
        ("Playwright Installation", check_playwright_installation),
        ("Browser Installation", check_browser_installation),
        ("Asyncio Policy", test_asyncio_policy),
    ]

    passed = 0
    total = len(checks)

    for name, check in checks:
        try:
            if check():
                passed += 1
        except Exception as e:
            print(f"❌ {name} check crashed: {e}")

    print(f"\n📊 Basic Checks: {passed}/{total} passed")

    if passed == total:
        print("\n🧪 Running Playwright functionality test...")
        try:
            result = asyncio.run(test_playwright_basic())
            if result:
                print("🎉 All tests passed! Playwright should work correctly.")
                return 0
            else:
                print("⚠️  Basic checks passed but Playwright test failed.")
                return 1
        except Exception as e:
            print(f"❌ Playwright test crashed: {e}")
            return 1
    else:
        print("❌ Some basic checks failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
