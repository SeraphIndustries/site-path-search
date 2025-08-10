import asyncio
import platform
import sys

# Windows-specific asyncio configuration - must be done before any other imports
if platform.system() == "Windows":
    if sys.version_info >= (3, 8):
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    else:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import base64
import json
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from services.kagi_search_service import (
    KagiSearchRequest,
    KagiSearchResult,
    KagiSearchService,
)
from services.sitepage_link_finder import PathFinder, SiteLinkFinder
from services.website_screenshot_service import ScreenshotAPI

# Initialize screenshot API with browser pooling
screenshot_cache_dir = "./cache/screenshot_cache"
screenshot_max_cache_size = 100
screenshot_pool_size = 3  # Number of browser instances to maintain in pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    from pathlib import Path

    from services.website_screenshot_service import (
        get_browser_pool,
        shutdown_browser_pool,
    )

    Path(screenshot_cache_dir).mkdir(exist_ok=True)

    await get_browser_pool(screenshot_pool_size)

    yield

    await shutdown_browser_pool()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LinkSummary(BaseModel):
    total_links: int
    main_text_links: int
    image_links_within_main_text: int
    regular_links_within_main_text: int
    other_links: int
    regular_links: List[str]


class ScreenshotRequest(BaseModel):
    url: str
    width: Optional[int] = 200
    height: Optional[int] = 150
    full_page: Optional[bool] = False
    quality: Optional[int] = 90
    format: Optional[str] = "jpeg"
    use_cache: Optional[bool] = True


class ScreenshotResponse(BaseModel):
    url: str
    image_base64: str
    width: int
    height: int
    format: str
    size_bytes: int


@app.get("/links", response_model=LinkSummary)
async def get_links(url: str):
    try:
        finder = SiteLinkFinder(url)
        summary = finder.get_summary()
        summary["regular_links"] = finder.regular_links_within_main_text
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/kagi-search", response_model=KagiSearchResult)
async def kagi_search(request: KagiSearchRequest):
    """
    Search for articles that mention or link to a specific URL using Kagi search.

    Args:
        target_url: The URL to search for
        limit: Maximum number of results (default: 10)
        exclude_domain: Whether to exclude same-domain results (default: True)
        search_type: Type of search - 'mentions' for general mentions, 'articles' for specific link inclusion

    Returns:
        List of search results with article information
    """
    try:
        kagi_service = KagiSearchService()

        results = kagi_service.search(request)

        return results

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/screenshot", response_model=ScreenshotResponse)
async def take_screenshot(request: ScreenshotRequest):
    """
    Take a screenshot of a website and return it as base64.
    """
    try:
        api = ScreenshotAPI(
            cache_dir=screenshot_cache_dir,
            max_cache_size=screenshot_max_cache_size,
            pool_size=screenshot_pool_size,
        )

        screenshot_bytes = await api.get_screenshot(
            url=request.url,
            width=request.width or 200,
            height=request.height or 150,
            full_page=request.full_page or False,
            quality=request.quality or 90,
            format=request.format or "jpeg",
            use_cache=request.use_cache or True,
        )

        image_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

        return ScreenshotResponse(
            url=request.url,
            image_base64=image_base64,
            width=request.width or 200,
            height=request.height or 150,
            format=request.format or "jpeg",
            size_bytes=len(screenshot_bytes),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/screenshot")
async def take_screenshot_get(
    url: str = Query(..., description="URL to screenshot"),
    width: int = Query(200, description="Screenshot width"),
    height: int = Query(150, description="Screenshot height"),
    full_page: bool = Query(False, description="Take full page screenshot"),
    quality: int = Query(90, description="Image quality (1-100)"),
    format: str = Query("jpeg", description="Image format (jpeg, png, webp)"),
    use_cache: bool = Query(True, description="Use cached screenshot if available"),
):
    """
    Take a screenshot of a website and return it as an image response.
    """
    try:
        api = ScreenshotAPI(
            cache_dir=screenshot_cache_dir,
            max_cache_size=screenshot_max_cache_size,
            pool_size=screenshot_pool_size,
        )

        screenshot_bytes = await api.get_screenshot(
            url=url,
            width=width,
            height=height,
            full_page=full_page,
            quality=quality,
            format=format,
            use_cache=use_cache,
        )

        content_type = f"image/{format}"
        return Response(content=screenshot_bytes, media_type=content_type)
    except Exception as e:
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Screenshot failed for {url}: {str(e)}")

        error_detail = f"Screenshot failed: {str(e)}"
        if "NotImplementedError" in str(e):
            error_detail = (
                "Screenshot service unavailable - browser initialization failed"
            )
        elif "timeout" in str(e).lower():
            error_detail = "Screenshot timed out - website may be slow or unavailable"

        raise HTTPException(status_code=400, detail=error_detail)


@app.get("/screenshot/thumbnail")
async def take_thumbnail(
    url: str = Query(..., description="URL to screenshot"),
    width: int = Query(200, description="Thumbnail width"),
    height: int = Query(150, description="Thumbnail height"),
    quality: int = Query(85, description="Image quality (1-100)"),
):
    try:
        from services.website_screenshot_service import WebsiteScreenshotService

        async with WebsiteScreenshotService() as service:
            screenshot_bytes = await service.take_thumbnail(
                url=url, width=width, height=height, quality=quality
            )

        return Response(content=screenshot_bytes, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/screenshot/full-page")
async def take_full_page_screenshot(
    url: str = Query(..., description="URL to screenshot"),
    width: int = Query(1200, description="Viewport width"),
    quality: int = Query(90, description="Image quality (1-100)"),
):
    try:
        from services.website_screenshot_service import WebsiteScreenshotService

        async with WebsiteScreenshotService() as service:
            screenshot_bytes = await service.take_full_page_screenshot(
                url=url, width=width, quality=quality
            )

        return Response(content=screenshot_bytes, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/autonomous-path")
async def autonomous_path(
    start_url: str = Query(..., description="Start URL"),
    end_url: str = Query(..., description="End URL"),
    max_depth: int = Query(3, description="Maximum search depth"),
):
    """
    Stream autonomous path finding progress from start_url to end_url.
    """

    def event_stream():
        path_finder = PathFinder(start_url, end_url, max_depth=max_depth)
        # We'll use a custom version of find_path that yields progress
        visited = set()
        found = False
        path = []

        def _search(current_url, current_path, depth):
            nonlocal found, path
            if depth >= max_depth or found:
                return
            if current_url in visited:
                return
            visited.add(current_url)
            new_path = current_path + [current_url]
            # Send progress event
            yield json.dumps(
                {"event": "visit", "url": current_url, "path": new_path, "depth": depth}
            ) + "\n"
            if current_url == end_url:
                found = True
                path = new_path
                yield json.dumps({"event": "found", "path": path}) + "\n"
                return
            try:
                finder = SiteLinkFinder(current_url)
                valid_links = finder.valid_links
                main_text_links = finder.regular_links_within_main_text
                other_links = [
                    link for link in valid_links if link not in main_text_links
                ]
                for link in main_text_links + other_links:
                    if found:
                        break
                    if link not in visited:
                        yield from _search(link, new_path, depth + 1)
            except Exception as e:
                yield json.dumps(
                    {
                        "event": "error",
                        "url": current_url,
                        "error": str(e),
                        "path": new_path,
                        "depth": depth,
                    }
                ) + "\n"
                return

        # Start the search
        yield from _search(start_url, [], 0)
        if not found:
            yield json.dumps({"event": "not_found", "path": []}) + "\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/health")
async def health_check():
    from services.website_screenshot_service import get_browser_pool

    try:
        pool = await get_browser_pool(screenshot_pool_size)
        pool_health = await pool.health_check()

        return {
            "status": "healthy",
            "service": "site-path-search-api",
            "browser_pool": pool_health,
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": "site-path-search-api",
            "error": str(e),
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
