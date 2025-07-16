"""
This module provides a SiteLinkFinder class to find all links within a given site page.
"""

import requests
from bs4 import BeautifulSoup, Tag
from typing import List, Optional


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

        # Fetch and process the page
        self._fetch_page()
        self._process_links()

    def _fetch_page(self) -> None:
        """Fetch the webpage and create BeautifulSoup object."""
        response = requests.get(self.url)
        response.raise_for_status()
        html_content = response.text
        self._soup = BeautifulSoup(html_content, "html.parser")

    def _find_main_content(self) -> Optional[Tag]:
        """Find the main content area of the page."""
        if not self._soup:
            return None
        for selector in self._main_content_selectors:
            main_content = self._soup.select_one(selector)
            if main_content:
                return main_content
        return self._soup.body

    def _process_links(self) -> None:
        """Process and categorize all links on the page."""
        if not self._soup:
            return
        self._main_content = self._find_main_content()
        self._all_links = self._soup.find_all("a")

        for link in self._all_links:
            if isinstance(link, Tag) and link.has_attr("href"):
                href = link.get("href")

                if href in self._link_blacklist:
                    continue

                if self._main_content and link in self._main_content.descendants:
                    self._main_text_links.append(href)
                else:
                    self._other_links.append(href)

        # Categorize main text links
        for link in self._main_text_links:
            if any(ext in link for ext in self._image_extensions) or any(
                filter in link for filter in self._img_link_filter
            ):
                self._img_links_within_main_text.append(link)
            else:
                self._regular_links_within_main_text.append(link)

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


if __name__ == "__main__":
    url = "https://www.noahpinion.blog/p/tokyo-is-the-new-paris?utm_source=publication-search"

    finder = SiteLinkFinder(url)

    finder.print_detailed_links()
    finder.print_summary()

    print(
        f"\nNumber of regular links in main text: {len(finder.regular_links_within_main_text)}"
    )
    print(
        f"Number of image links in main text: {len(finder.image_links_within_main_text)}"
    )
