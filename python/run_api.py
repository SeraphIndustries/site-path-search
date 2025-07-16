#!/usr/bin/env python3
"""
Main entry point for running the site-path-search API.
This script runs the FastAPI application from the api package.
"""

import sys
import os

# Add the current directory to Python path so we can import from packages
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.main import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
