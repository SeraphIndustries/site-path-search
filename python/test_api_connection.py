#!/usr/bin/env python3
"""
Test script to verify API endpoints are working correctly.
This helps diagnose connection issues between frontend and backend.
"""

import requests
import json
import sys
from urllib.parse import urljoin

# Configuration
API_BASE_URL = "http://localhost:8000"
TEST_URL = "https://www.noahpinion.blog/p/tokyo-is-the-new-paris"


def test_health_endpoint():
    """Test the health endpoint."""
    print("🏥 Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False


def test_links_endpoint():
    """Test the links analysis endpoint."""
    print("\n🔗 Testing links endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/links?url={TEST_URL}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Links endpoint working")
            print(f"   Total links: {data.get('total_links', 'N/A')}")
            print(f"   Main text links: {data.get('main_text_links', 'N/A')}")
            return True
        else:
            print(f"❌ Links endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Links endpoint error: {e}")
        return False


def test_screenshot_endpoint():
    """Test the screenshot endpoint."""
    print("\n📸 Testing screenshot endpoint...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/screenshot?url={TEST_URL}&width=200&height=150&quality=85",
            timeout=30,
        )
        if response.status_code == 200:
            content_type = response.headers.get("content-type", "")
            content_length = len(response.content)
            # Save the image that's returned
            with open("test_screenshot.jpg", "wb") as f:
                f.write(response.content)
            print("   Screenshot saved as test_screenshot.jpg")
            print("✅ Screenshot endpoint working")
            print(f"   Content-Type: {content_type}")
            print(f"   Content-Length: {content_length} bytes")
            return True
        else:
            print(f"❌ Screenshot endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Screenshot endpoint error: {e}")
        return False


def test_screenshot_thumbnail():
    """Test the thumbnail endpoint."""
    print("\n🖼️  Testing thumbnail endpoint...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/screenshot/thumbnail?url={TEST_URL}&width=200&height=150",
            timeout=30,
        )
        if response.status_code == 200:
            content_type = response.headers.get("content-type", "")
            content_length = len(response.content)
            print("✅ Thumbnail endpoint working")
            print(f"   Content-Type: {content_type}")
            print(f"   Content-Length: {content_length} bytes")
            return True
        else:
            print(f"❌ Thumbnail endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Thumbnail endpoint error: {e}")
        return False


def test_cors_headers():
    """Test CORS headers."""
    print("\n🌐 Testing CORS headers...")
    try:
        response = requests.options(f"{API_BASE_URL}/health", timeout=5)
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get(
                "Access-Control-Allow-Origin"
            ),
            "Access-Control-Allow-Methods": response.headers.get(
                "Access-Control-Allow-Methods"
            ),
            "Access-Control-Allow-Headers": response.headers.get(
                "Access-Control-Allow-Headers"
            ),
        }
        print("✅ CORS headers present:")
        for header, value in cors_headers.items():
            print(f"   {header}: {value}")
        return True
    except Exception as e:
        print(f"❌ CORS test error: {e}")
        return False


def test_proxy_endpoints():
    """Test endpoints through the proxy (as frontend would see them)."""
    print("\n🔄 Testing proxy endpoints...")
    proxy_base = "http://localhost:5173/api"  # Svelte dev server proxy

    try:
        # Test health through proxy
        response = requests.get(f"{proxy_base}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Proxy health endpoint working")
        else:
            print(f"❌ Proxy health endpoint failed: {response.status_code}")
            return False

        # Test screenshot through proxy
        response = requests.get(
            f"{proxy_base}/screenshot?url={TEST_URL}&width=100&height=100", timeout=30
        )
        if response.status_code == 200:
            print("✅ Proxy screenshot endpoint working")
            return True
        else:
            print(f"❌ Proxy screenshot endpoint failed: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Proxy test error: {e}")
        print("   Note: This test requires both servers to be running")
        return False


def main():
    """Run all tests."""
    print("🚀 API Connection Test")
    print("=" * 40)

    tests = [
        test_health_endpoint,
        test_links_endpoint,
        test_screenshot_endpoint,
        test_screenshot_thumbnail,
        test_cors_headers,
        test_proxy_endpoints,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")

    print("\n" + "=" * 40)
    print(f"📊 Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! API is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
