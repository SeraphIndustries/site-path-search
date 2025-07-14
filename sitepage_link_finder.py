"""
This script finds all links within a given site page and saves them to a file.
"""

import requests
from bs4 import BeautifulSoup, Tag

url = (
    "https://www.noahpinion.blog/p/tokyo-is-the-new-paris?utm_source=publication-search"
)

response = requests.get(url)
response.raise_for_status()
html_content = response.text

soup = BeautifulSoup(html_content, "html.parser")

link_blacklist = [
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

main_content_selectors = [
    "article",
    '[role="main"]',
    ".post-content",
    ".entry-content",
    ".content",
    "main",
    ".article-body",
]

main_content = None
for selector in main_content_selectors:
    main_content = soup.select_one(selector)
    if main_content:
        break

if not main_content:
    main_content = soup.body

all_links = soup.find_all("a")
main_text_links = []
other_links = []

for link in all_links:
    if isinstance(link, Tag) and link.has_attr("href"):
        href = link.get("href")

        if href in link_blacklist:
            continue

        if main_content and link in main_content.descendants:
            main_text_links.append(href)
        else:
            other_links.append(href)

image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
img_link_filter = [
    "/images/",
    "/media/",
    "/img/",
    "/picture/",
    "/photo/",
    "/photos/",
    "unsplash",
]

img_links_within_main_text = []
regular_links_within_main_text = []

print("=== LINKS WITHIN MAIN TEXT ===")
for link in main_text_links:
    if any(ext in link for ext in image_extensions) or any(
        filter in link for filter in img_link_filter
    ):
        img_links_within_main_text.append(link)
    else:
        regular_links_within_main_text.append(link)

print("==== Image Links Within Main Text ====")
for link in img_links_within_main_text:
    print(link)

print("\n=== OTHER LINKS (NAVIGATION, FOOTER, ETC.) ===")
for link in other_links:
    print(link)

print("==== Regular Links Within Main Text ====")
for link in regular_links_within_main_text:
    print(link)


print(f"\nSummary:")
print(f"Main text links: {len(main_text_links)}")
print(f"\tImage links within main text: {len(img_links_within_main_text)}")
print(f"\tRegular links within main text: {len(regular_links_within_main_text)}")
print(f"Other links: {len(other_links)}")
print(f"Total links: {len(all_links)}")
