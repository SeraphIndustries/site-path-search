#!/usr/bin/env python3
"""
Setup script for the Website Screenshot Service.
This script helps install dependencies and configure the service.
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(command, description):
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(
            command, shell=True, check=True, capture_output=True, text=True
        )
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False


def check_python_version():
    print("🐍 Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ required, found {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True


def install_dependencies():
    print("\n📦 Installing Python dependencies...")

    requirements_file = Path("requirements.txt")
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        return False

    if not run_command(
        f"{sys.executable} -m pip install -r requirements.txt",
        "Installing Python packages",
    ):
        return False

    return True


def install_playwright():
    print("\n🌐 Installing Playwright...")

    if not run_command(
        f"{sys.executable} -m playwright install", "Installing Playwright browsers"
    ):
        return False

    if not run_command(
        f"{sys.executable} -m playwright install chromium",
        "Installing Chromium browser",
    ):
        return False

    return True


def create_directories():
    print("\n📁 Creating directories...")

    directories = ["screenshot_cache", "logs"]

    for directory in directories:
        path = Path(directory)
        if not path.exists():
            path.mkdir(parents=True, exist_ok=True)
            print(f"✅ Created directory: {directory}")
        else:
            print(f"ℹ️  Directory already exists: {directory}")

    return True


def test_installation():
    print("\n🧪 Testing installation...")

    try:
        import asyncio
        from website_screenshot_service import WebsiteScreenshotService

        async def test_screenshot():
            try:
                async with WebsiteScreenshotService() as service:
                    screenshot = await service.take_thumbnail(
                        "https://httpbin.org/html", width=100, height=100
                    )
                    return len(screenshot) > 0
            except Exception as e:
                print(f"❌ Screenshot test failed: {e}")
                return False

        result = asyncio.run(test_screenshot())
        if result:
            print("✅ Screenshot service test passed")
            return True
        else:
            print("❌ Screenshot service test failed")
            return False

    except ImportError as e:
        print(f"❌ Import test failed: {e}")
        return False


def print_next_steps():
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("=" * 50)
    print("\nNext steps:")
    print("1. Start the FastAPI server:")
    print("   python main.py")
    print("\n2. Or run the test suite:")
    print("   python test_screenshot_service.py")
    print("\n3. Access the API documentation:")
    print("   http://localhost:8000/docs")
    print("\n4. Test a screenshot endpoint:")
    print("   http://localhost:8000/screenshot?url=https://www.example.com")
    print("\n5. Check the health endpoint:")
    print("   http://localhost:8000/health")
    print("\nFor more information, see README_SCREENSHOT_SERVICE.md")


def main():
    print("🚀 Website Screenshot Service Setup")
    print("=" * 40)

    if not check_python_version():
        sys.exit(1)

    if not install_dependencies():
        print("\n❌ Failed to install dependencies")
        sys.exit(1)

    if not install_playwright():
        print("\n❌ Failed to install Playwright")
        sys.exit(1)

    if not create_directories():
        print("\n❌ Failed to create directories")
        sys.exit(1)

    if not test_installation():
        print("\n❌ Installation test failed")
        print("You may need to manually troubleshoot the installation")
        sys.exit(1)

    print_next_steps()


if __name__ == "__main__":
    main()
