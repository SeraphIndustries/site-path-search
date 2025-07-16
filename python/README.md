# Site Path Search - Python Backend

This directory contains the Python backend for the site-path-search application.

## Project Structure

```
python/
├── api/                    # FastAPI application and endpoints
│   ├── __init__.py
│   └── main.py            # Main FastAPI app with all endpoints
├── services/              # Core business logic services
│   ├── __init__.py
│   ├── sitepage_link_finder.py    # Link analysis service
│   └── website_screenshot_service.py  # Screenshot service with browser pooling
├── tests/                 # All test files
│   ├── __init__.py
│   ├── example_usage.py
│   ├── test_api_connection.py
│   ├── test_browser_pool.py
│   ├── test_pool_simple.py
│   ├── test_screenshot_service.py
│   └── test_windows_cleanup.py
├── utils/                 # Utility scripts and helpers
│   ├── __init__.py
│   ├── diagnose_playwright.py
│   ├── fix_windows_playwright.py
│   └── kagi_test.py
├── scripts/               # Setup and maintenance scripts
│   ├── __init__.py
│   └── setup_screenshot_service.py
├── cache/                 # Cache directories
│   ├── example_cache/
│   ├── screenshot_cache/
│   ├── test_cache/
│   └── test_screenshot.jpg
├── logs/                  # Log files
├── requirements.txt       # Python dependencies
├── run_api.py            # Main entry point to run the API
└── README.md             # This file
```

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the API:**
   ```bash
   python run_api.py
   ```

3. **Access the API:**
   - API documentation: http://localhost:8000/docs
   - Health check: http://localhost:8000/health
   - Links endpoint: http://localhost:8000/links?url=<website_url>
   - Screenshot endpoint: http://localhost:8000/screenshot?url=<website_url>

## API Endpoints

- `GET /links` - Analyze links on a website
- `POST /screenshot` - Take a screenshot (returns base64)
- `GET /screenshot` - Take a screenshot (returns image)
- `GET /screenshot/thumbnail` - Take a thumbnail screenshot
- `GET /screenshot/full-page` - Take a full page screenshot
- `GET /health` - Health check

## Services

### SiteLinkFinder
Analyzes websites to find and categorize links within the main content area.

### ScreenshotAPI
Provides high-quality website screenshots with browser pooling for efficiency.

## Development

### Running Tests
```bash
cd tests
python test_api_connection.py
python test_screenshot_service.py
```

### Utility Scripts
```bash
cd utils
python diagnose_playwright.py  # Diagnose Playwright installation
python fix_windows_playwright.py  # Fix Windows-specific issues
```

### Setup Scripts
```bash
cd scripts
python setup_screenshot_service.py  # Setup screenshot service
```

## Cache Management

Screenshots are cached in `cache/screenshot_cache/` to improve performance. The cache is automatically managed with a maximum size limit.

## Logs

Application logs are stored in the `logs/` directory.
