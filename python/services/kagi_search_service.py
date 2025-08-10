"""
This module provides a KagiSearchService class to search for articles containing specific links.
"""

import json
import os
from typing import Dict, List, Optional
from urllib.parse import urlparse

# Load environment variables first
from dotenv import load_dotenv

load_dotenv()

# Then import Kagi client
from kagiapi import KagiClient


class KagiSearchService:
    """
    A service to search for articles containing specific links using Kagi API.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the KagiSearchService.

        Args:
            api_key (str, optional): Kagi API key. If not provided, will try to load from environment.
        """

        if api_key is None:
            api_key = os.getenv("KAGI_API_KEY")

        if not api_key:
            raise ValueError(
                "Kagi API key is required. Set KAGI_API_KEY environment variable or pass api_key parameter."
            )

        self.client = KagiClient(api_key=api_key)

    def search_for_link_mentions(
        self, target_url: str, limit: int = 10, exclude_domain: bool = True
    ) -> List[Dict]:
        """
        Search for articles that mention or link to a specific URL.

        Args:
            target_url (str): The URL to search for mentions of
            limit (int): Maximum number of results to return (default: 10)
            exclude_domain (bool): Whether to exclude results from the same domain as target_url (default: True)

        Returns:
            List[Dict]: List of search results, each containing title, url, snippet, etc.
        """
        # Extract domain from target URL for filtering
        target_domain = urlparse(target_url).netloc.lower()

        # Create search query - search for the URL or domain
        search_query = f'"{target_url}" OR "{target_domain}"'

        try:
            # Perform the search
            response = self.client.search(
                search_query, limit=limit * 2
            )  # Get more results for filtering

            # Parse the JSON response
            if isinstance(response, str):
                results_data = json.loads(response)
            else:
                results_data = response

            # Extract results from the response structure
            # The Kagi API response structure may vary, so we need to handle it carefully
            if isinstance(results_data, dict):
                results = results_data.get("data", [])
            elif isinstance(results_data, list):
                results = results_data
            else:
                results = []

            # Filter results to exclude the exact same URL and optionally same domain
            filtered_results = []

            for result in results:
                if isinstance(result, dict):
                    result_url = result.get("url", "")
                    result_domain = urlparse(result_url).netloc.lower()

                    # Skip if it's the exact same URL
                    if result_url == target_url:
                        continue

                    # Skip if it's from the same domain (optional)
                    if exclude_domain:
                        if self.is_same_domain(result_url, target_url):
                            continue

                    filtered_results.append(result)

                    # Stop if we've reached the limit
                    if len(filtered_results) >= limit:
                        break

            return filtered_results

        except Exception as e:
            raise Exception(f"Kagi search failed: {str(e)}")

    def search_for_link_in_articles(
        self, target_url: str, limit: int = 10, exclude_domain: bool = True
    ) -> List[Dict]:
        """
        Search specifically for articles that contain the target link.

        Args:
            target_url (str): The URL to search for in articles
            limit (int): Maximum number of results to return (default: 10)
            exclude_domain (bool): Whether to exclude results from the same domain (default: True)

        Returns:
            List[Dict]: List of search results for articles containing the link
        """
        # Create a more specific search query for articles
        search_query = f'link:"{target_url}" OR "{target_url}"'

        try:
            # Perform the search
            response = self.client.search(search_query, limit=limit * 2)

            # Parse the JSON response
            if isinstance(response, str):
                results_data = json.loads(response)
            else:
                results_data = response

            # Extract results from the response structure
            if isinstance(results_data, dict):
                results = results_data.get("data", [])
            elif isinstance(results_data, list):
                results = results_data
            else:
                results = []

            # Filter results
            filtered_results = []

            for result in results:
                if isinstance(result, dict):
                    result_url = result.get("url", "")
                    result_domain = urlparse(result_url).netloc.lower()
                    target_domain = urlparse(target_url).netloc.lower()

                    # Skip if it's the exact same URL
                    if result_url == target_url:
                        continue

                    # Skip if it's from the same domain (optional)
                    if exclude_domain and result_domain == target_domain:
                        continue

                    filtered_results.append(result)

                    # Stop if we've reached the limit
                    if len(filtered_results) >= limit:
                        break

            return filtered_results

        except Exception as e:
            raise Exception(f"Kagi search failed: {str(e)}")

    def get_domain_from_url(self, url: str) -> str:
        """
        Extract domain from a URL.

        Args:
            url (str): The URL to extract domain from

        Returns:
            str: The domain (e.g., 'example.com')
        """
        return urlparse(url).netloc.lower()

    def is_same_domain(self, url1: str, url2: str) -> bool:
        """
        Check if two URLs are from the same domain.

        Args:
            url1 (str): First URL
            url2 (str): Second URL

        Returns:
            bool: True if URLs are from the same domain
        """
        return self.get_domain_from_url(url1) == self.get_domain_from_url(url2)


if __name__ == "__main__":
    # Test the service in isolation
    print("Testing KagiSearchService...")

    try:
        # Initialize the service
        service = KagiSearchService()

        # Test URL to search for
        test_url = "https://www.bitsaboutmoney.com/archive/anatomy-of-credit-card-rewards-programs/"

        print(f"\nSearching for articles mentioning: {test_url}")
        print("=" * 80)

        # Search for link mentions
        results = service.search_for_link_mentions(test_url, limit=5)

        print(f"Found {len(results)} results:")
        for i, result in enumerate(results, 1):
            print(f"\n{i}. {result.get('title', 'No title')}")
            print(f"   URL: {result.get('url', 'No URL')}")
            print(f"   Snippet: {result.get('snippet', 'No snippet')[:150]}...")

        print("\n" + "=" * 80)

        # Test domain extraction
        print(f"\nDomain extraction test:")
        print(f"URL: {test_url}")
        print(f"Domain: {service.get_domain_from_url(test_url)}")

        # Test same domain check
        other_url = "https://www.bitsaboutmoney.com/archive/debit-cards-are-hidden-financial-infrastructure/"
        print(f"\nSame domain check:")
        print(f"URL1: {test_url}")
        print(f"URL2: {other_url}")
        print(f"Same domain: {service.is_same_domain(test_url, other_url)}")

    except Exception as e:
        print(f"Error: {e}")
        print("\nMake sure you have set the KAGI_API_KEY environment variable.")
        print("You can create a .env file with: KAGI_API_KEY=your_api_key_here")
