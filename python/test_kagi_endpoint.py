#!/usr/bin/env python3
"""
Simple test script for the Kagi search API endpoint.
Run this after starting your FastAPI server.
"""

import json
from typing import Any, Dict

import requests

BASE_URL = "http://localhost:8000"


def test_kagi_search_endpoint():
    """Test the /kagi-search endpoint with different parameters."""

    print("🧪 Test 1: Basic search")
    test_request = {
        "target_url": "https://www.bitsaboutmoney.com/archive/anatomy-of-credit-card-rewards-programs/",
        "limit": 5,
        "exclude_domain": True,
    }

    try:
        response = requests.post(f"{BASE_URL}/kagi-search", json=test_request)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Found {len(result['results'])} results")
            print(f"Target URL: {result['target_url']}")
            for i, item in enumerate(result["results"], 1):
                print(f"  {i}. {item['title']}")
                print(f"     URL: {item['url']}")
                print(f"     Snippet: {item['snippet'][:100]}...")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")

    print("\n" + "=" * 80 + "\n")

    print("🧪 Test 2: Different limit")
    test_request_2 = {
        "target_url": "https://www.bitsaboutmoney.com/archive/anatomy-of-credit-card-rewards-programs/",
        "limit": 3,
        "exclude_domain": False,
    }

    try:
        response = requests.post(f"{BASE_URL}/kagi-search", json=test_request_2)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Found {len(result['results'])} results")
            print(f"Target URL: {result['target_url']}")
            for i, item in enumerate(result["results"], 1):
                print(f"  {i}. {item['title']}")
                print(f"     URL: {item['url']}")
                print(f"     Snippet: {item['snippet'][:100]}...")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")

    print("\n" + "=" * 80 + "\n")

    print("🧪 Test 3: Different URL")
    test_request_3 = {
        "target_url": "https://github.com/microsoft/playwright",
        "limit": 4,
        "exclude_domain": True,
    }

    try:
        response = requests.post(f"{BASE_URL}/kagi-search", json=test_request_3)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Found {len(result['results'])} results")
            print(f"Target URL: {result['target_url']}")
            for i, item in enumerate(result["results"], 1):
                print(f"  {i}. {item['title']}")
                print(f"     URL: {item['url']}")
                print(f"     Snippet: {item['snippet'][:100]}...")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")


def test_health_endpoint():
    """Test the health endpoint to make sure the server is running."""
    print("🏥 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Server is healthy!")
            print(f"Status: {result.get('status')}")
            print(f"Service: {result.get('service')}")
        else:
            print(f"❌ Health check failed: {response.text}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")


if __name__ == "__main__":
    print("🚀 Testing Kagi Search API Endpoint")
    print("=" * 80)

    test_health_endpoint()
    print("\n" + "=" * 80 + "\n")

    test_kagi_search_endpoint()

    print("\n✨ Testing complete!")
