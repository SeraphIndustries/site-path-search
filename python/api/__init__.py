"""
API package for the site-path-search application.
Contains the main FastAPI application and related endpoints.
"""

from api.main import app, get_links, take_screenshot, health_check

__all__ = ["app", "get_links", "take_screenshot", "health_check"]
