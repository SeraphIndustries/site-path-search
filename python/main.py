from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from sitepage_link_finder import SiteLinkFinder
from website_screenshot_service import ScreenshotAPI
from typing import List, Optional
import asyncio
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize screenshot API
screenshot_api = ScreenshotAPI(cache_dir="./screenshot_cache", max_cache_size=100)


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


@app.post("/screenshot", response_model=ScreenshotResponse)
async def take_screenshot(request: ScreenshotRequest):
    """
    Take a screenshot of a website and return it as base64.
    """
    try:
        screenshot_bytes = await screenshot_api.get_screenshot(
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
        screenshot_bytes = await screenshot_api.get_screenshot(
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
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/screenshot/thumbnail")
async def take_thumbnail(
    url: str = Query(..., description="URL to screenshot"),
    width: int = Query(200, description="Thumbnail width"),
    height: int = Query(150, description="Thumbnail height"),
    quality: int = Query(85, description="Image quality (1-100)"),
):
    """
    Take a thumbnail screenshot of a website.
    """
    try:
        from website_screenshot_service import WebsiteScreenshotService

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
    """
    Take a full-page screenshot of a website.
    """
    try:
        from website_screenshot_service import WebsiteScreenshotService

        async with WebsiteScreenshotService() as service:
            screenshot_bytes = await service.take_full_page_screenshot(
                url=url, width=width, quality=quality
            )

        return Response(content=screenshot_bytes, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy", "service": "site-path-search-api"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
