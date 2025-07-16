#!/usr/bin/env python3
"""
Script to fix Windows-specific Playwright issues.
"""

import subprocess
import sys
import platform


def fix_windows_playwright():
    """Fix common Windows Playwright issues."""
    print("🔧 Fixing Windows Playwright Issues")
    print("=" * 40)

    if platform.system() != "Windows":
        print("ℹ️  This script is for Windows only")
        return True

    print("🔄 Reinstalling Playwright...")
    try:
        # Uninstall playwright
        subprocess.run(
            [sys.executable, "-m", "pip", "uninstall", "playwright", "-y"], check=True
        )
        print("✅ Playwright uninstalled")

        # Reinstall playwright
        subprocess.run([sys.executable, "-m", "pip", "install", "playwright"], check=True)
        print("✅ Playwright reinstalled")

        # Install browsers
        subprocess.run([sys.executable, "-m", "playwright", "install"], check=True)
        print("✅ Browsers installed")

        # Install chromium specifically
        subprocess.run(
            [sys.executable, "-m", "playwright", "install", "chromium"], check=True
        )
        print("✅ Chromium installed")

        return True

    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to fix Playwright: {e}")
        return False


if __name__ == "__main__":
    success = fix_windows_playwright()
    if success:
        print("\n🎉 Playwright should now work correctly!")
        print("Try running the diagnostic script: python diagnose_playwright.py")
    else:
        print("\n❌ Failed to fix Playwright issues")
        sys.exit(1)
