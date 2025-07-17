"""
This module provides a SiteLinkFinder class to find all links within a given site page.
"""

import requests
from bs4 import BeautifulSoup, Tag
from typing import List, Optional, Dict, Set
from urllib.parse import urljoin, urlparse
import re


class SiteLinkFinder:
    """
    A class to find and categorize links within a website page.
    """

    def __init__(self, url: str):
        """
        Initialize the SiteLinkFinder with a URL.

        Args:
            url (str): The URL of the page to analyze
        """
        self.url = url
        self._link_blacklist = [
            "\\",
            "/",
            "#",
            "mailto:",
            "tel:",
            "javascript:",
            "data:",
            "whatsapp:",
            "sms:",
            "tel:",
            "javascript:",
            "javascript:void(0)",
            "javascript:void(0);",
        ]

        self._main_content_selectors = [
            "article",
            '[role="main"]',
            ".post-content",
            ".entry-content",
            ".content",
            "main",
            ".article-body",
        ]

        self._image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        self._img_link_filter = [
            "/images/",
            "/media/",
            "/img/",
            "/picture/",
            "/photo/",
            "/photos/",
            "unsplash",
        ]

        # Initialize properties
        self._soup = None
        self._main_content = None
        self._all_links = []
        self._main_text_links = []
        self._other_links = []
        self._img_links_within_main_text = []
        self._regular_links_within_main_text = []
        self._valid_links = []

        # Fetch and process the page
        self._fetch_page()
        self._process_links()

    def _fetch_page(self) -> None:
        """Fetch the webpage and create BeautifulSoup object."""
        try:
            response = requests.get(self.url, timeout=10)
            response.raise_for_status()
            html_content = response.text
            self._soup = BeautifulSoup(html_content, "html.parser")
        except Exception as e:
            raise Exception(f"Failed to fetch page {self.url}: {str(e)}")

    def _find_main_content(self) -> Optional[Tag]:
        """Find the main content area of the page."""
        if not self._soup:
            return None
        for selector in self._main_content_selectors:
            main_content = self._soup.select_one(selector)
            if main_content:
                return main_content
        return self._soup.body

    def _is_valid_url(self, url: str) -> bool:
        """Check if a URL is valid and should be included."""
        if not url or url.strip() == "":
            return False

        if url in self._link_blacklist:
            return False

        if url.startswith("#") or url == "/":
            return False

        if re.match(r"^/[^/]+/?$", url):
            return False

        if re.match(r"^\.\w+$", url):
            return False

        return True

    def _normalize_url(self, url: str) -> str:
        """Normalize a URL to its absolute form."""
        if url.startswith("http"):
            return url
        return urljoin(self.url, url)

    def _process_links(self) -> None:
        """Process and categorize all links on the page."""
        if not self._soup:
            return
        self._main_content = self._find_main_content()
        self._all_links = self._soup.find_all("a")

        for link in self._all_links:
            if isinstance(link, Tag) and link.has_attr("href"):
                href = link.get("href")

                if not href or not self._is_valid_url(str(href)):
                    continue

                # Normalize the URL
                normalized_url = self._normalize_url(str(href))

                if self._main_content and link in self._main_content.descendants:
                    self._main_text_links.append(normalized_url)
                else:
                    self._other_links.append(normalized_url)

        # Categorize main text links
        for link in self._main_text_links:
            if any(ext in link for ext in self._image_extensions) or any(
                filter in link for filter in self._img_link_filter
            ):
                self._img_links_within_main_text.append(link)
            else:
                self._regular_links_within_main_text.append(link)

        # Store all valid links
        self._valid_links = self._main_text_links + self._other_links

    @property
    def all_links(self) -> List[str]:
        """Get all links found on the page (excluding blacklisted ones)."""
        return self._all_links

    @property
    def main_text_links(self) -> List[str]:
        """Get all links found within the main content area."""
        return self._main_text_links

    @property
    def other_links(self) -> List[str]:
        """Get links found outside the main content area (navigation, footer, etc.)."""
        return self._other_links

    @property
    def image_links_within_main_text(self) -> List[str]:
        """Get image links found within the main content area."""
        return self._img_links_within_main_text

    @property
    def regular_links_within_main_text(self) -> List[str]:
        """Get regular (non-image) links found within the main content area."""
        return self._regular_links_within_main_text

    @property
    def valid_links(self) -> List[str]:
        """Get all valid links (filtered and normalized)."""
        return self._valid_links

    def get_summary(self) -> dict:
        """Get a summary of all link counts."""
        return {
            "total_links": len(self._all_links),
            "main_text_links": len(self._main_text_links),
            "image_links_within_main_text": len(self._img_links_within_main_text),
            "regular_links_within_main_text": len(self._regular_links_within_main_text),
            "other_links": len(self._other_links),
        }

    def print_summary(self) -> None:
        """Print a formatted summary of all links."""
        summary = self.get_summary()
        print("\nSummary:")
        print(f"Main text links: {summary['main_text_links']}")
        print(
            f"\tImage links within main text: {summary['image_links_within_main_text']}"
        )
        print(
            f"\tRegular links within main text: {summary['regular_links_within_main_text']}"
        )
        print(f"Other links: {summary['other_links']}")
        print(f"Total links: {summary['total_links']}")

    def print_detailed_links(self) -> None:
        """Print all links in a detailed format."""
        print("=== LINKS WITHIN MAIN TEXT ===")

        print("==== Image Links Within Main Text ====")
        for link in self._img_links_within_main_text:
            print(link)

        print("\n=== OTHER LINKS (NAVIGATION, FOOTER, ETC.) ===")
        for link in self._other_links:
            print(link)

        print("==== Regular Links Within Main Text ====")
        for link in self._regular_links_within_main_text:
            print(link)


class PathFinder:
    """
    A class to find paths between two URLs using autonomous link traversal.
    """

    def __init__(self, start_url: str, end_url: str, max_depth: int = 3):
        """
        Initialize the PathFinder with start and end URLs.

        Args:
            start_url (str): The starting URL
            end_url (str): The target URL to find
            max_depth (int): Maximum depth to search (default: 3)
        """
        self.start_url = start_url
        self.end_url = end_url
        self.max_depth = max_depth
        self.visited_urls: Set[str] = set()
        self.path_tree: Dict[str, Dict] = {}
        self.found_path: Optional[List[str]] = None

    def find_path(self) -> Optional[List[str]]:
        """
        Find a path from start_url to end_url.

        Returns:
            Optional[List[str]]: List of URLs forming the path, or None if not found
        """
        self.visited_urls.clear()
        self.path_tree.clear()
        self.found_path = None

        # Start the search from the start URL
        self._search_from_url(self.start_url, [], 0)

        return self.found_path

    def _search_from_url(
        self, current_url: str, current_path: List[str], depth: int
    ) -> None:
        """
        Recursively search from a given URL.

        Args:
            current_url (str): The current URL to search from
            current_path (List[str]): The current path taken to reach this URL
            depth (int): Current depth in the search
        """
        # Stop if we've reached max depth or already found a path
        if depth >= self.max_depth or self.found_path is not None:
            return

        # Stop if we've already visited this URL
        if current_url in self.visited_urls:
            return

        # Mark as visited
        self.visited_urls.add(current_url)

        # Add to current path
        new_path = current_path + [current_url]

        # Check if we've found the target
        if current_url == self.end_url:
            self.found_path = new_path
            return

        try:
            # Get links from current page
            finder = SiteLinkFinder(current_url)
            valid_links = finder.valid_links

            # Prioritize main text links over other links
            main_text_links = finder.regular_links_within_main_text
            other_links = [link for link in valid_links if link not in main_text_links]

            # Search main text links first, then other links
            for link in main_text_links + other_links:
                if self.found_path is not None:
                    break
                if link not in self.visited_urls:
                    self._search_from_url(link, new_path, depth + 1)

        except Exception as e:
            # Skip this URL if there's an error
            print(f"Error processing {current_url}: {str(e)}")
            return


if __name__ == "__main__":
    url = (
        "https://www.bitsaboutmoney.com/archive/anatomy-of-credit-card-rewards-programs/"
    )
    print("Testing improved SiteLinkFinder...")
    finder = SiteLinkFinder(url)

    print("\nRegular links within main text:")
    for link in finder.regular_links_within_main_text:
        print(f"  {link}")

    print(f"\nTotal valid links: {len(finder.valid_links)}")

    print("\nTesting PathFinder...")
    start_url = (
        "https://www.bitsaboutmoney.com/archive/anatomy-of-credit-card-rewards-programs/"
    )
    end_url = "https://www.bitsaboutmoney.com/archive/debit-cards-are-hidden-financial-infrastructure/"

    path_finder = PathFinder(start_url, end_url, max_depth=2)
    path = path_finder.find_path()

    if path:
        print(f"Path found: {' -> '.join(path)}")
    else:
        print("No path found")
