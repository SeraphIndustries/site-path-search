from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sitepage_link_finder import SiteLinkFinder

app = FastAPI()


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


@app.get("/links", response_model=LinkSummary)
async def get_links(url: str):
    try:
        finder = SiteLinkFinder(url)
        summary = finder.get_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
