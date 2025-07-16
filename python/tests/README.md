# Tests Directory

This directory contains all test scripts for the site-path-search project.

## Quick Start

### Run All Tests
```bash
# From the python directory
python tests/run_all_tests.py

# Or with options
python tests/run_all_tests.py --skip-server-dependent
python tests/run_all_tests.py --verbose
```

### Run Individual Tests
```bash
# Screenshot service tests
python tests/test_screenshot_service.py
python tests/test_browser_pool.py
python tests/test_pool_simple.py
python tests/test_windows_cleanup.py

# API connection test (requires servers running)
python tests/test_api_connection.py

# Example usage
python tests/example_usage.py
```

## Test Scripts

### `run_all_tests.py` - Aggregated Test Runner
The main test runner that executes all tests with comprehensive reporting.

**Features:**
- ✅ Progress tracking with visual progress bar
- 📊 Detailed results for each test
- 🌐 Automatic server status detection
- ⏭️ Smart skipping of server-dependent tests
- 📋 Summary report with pass/fail counts
- 🎯 Exit codes for CI/CD integration

**Options:**
- `--skip-server-dependent`: Skip tests that require backend/frontend servers
- `--verbose`: Show detailed output from each test

### Individual Test Scripts

#### `test_screenshot_service.py`
Tests the website screenshot service with proper cleanup.
- Tests basic screenshot functionality
- Tests thumbnail generation
- Tests API wrapper
- Tests multiple screenshots
- Verifies Windows asyncio cleanup

#### `test_browser_pool.py`
Tests browser pool functionality and concurrent requests.
- Tests pool initialization and health checks
- Tests concurrent screenshot requests
- Tests pool exhaustion scenarios
- Tests ScreenshotAPI with browser pooling

#### `test_pool_simple.py`
Simple browser pool functionality test.
- Tests basic pool operations
- Tests single and multiple screenshots
- Tests pool health monitoring

#### `test_windows_cleanup.py`
Minimal test to verify Windows asyncio cleanup fix.
- Tests multiple service instances
- Verifies no "unclosed transport" warnings

#### `test_api_connection.py`
Tests API endpoints (requires backend and frontend servers running).
- Tests health endpoint
- Tests links endpoint
- Tests screenshot endpoints
- Tests CORS headers
- Tests proxy endpoints

#### `example_usage.py`
Runs example usage demonstrations.
- Basic screenshot functionality
- Thumbnail generation
- Full page screenshots
- Base64 encoding
- Caching API usage
- Multiple URL processing
- Custom settings
- Error handling

## Server Dependencies

Some tests require the backend and frontend servers to be running:

**Backend Server (FastAPI):**
```bash
# From python directory
python run_api.py
# Server runs on http://localhost:8000
```

**Frontend Server (Svelte):**
```bash
# From svelte directory
npm run dev
# Server runs on http://localhost:5173
```

The aggregated test runner automatically detects if servers are running and skips server-dependent tests if they're not available.

## Test Results

The aggregated test runner provides:

1. **Progress Tracking**: Visual progress bar showing current test and completion percentage
2. **Individual Results**: Status, duration, and error messages for each test
3. **Summary Report**: Total counts of passed, failed, skipped, and error tests
4. **Exit Codes**:
   - `0`: All tests passed
   - `1`: Some tests failed or had errors

## Example Output

```
🚀 Site Path Search - Aggregated Test Runner
============================================================
📅 Started at: 2024-01-15 14:30:25
🐍 Python: 3.11.0
📁 Working directory: /path/to/site-path-search/python

🌐 Server Status: ❌ No servers detected

📋 Found 6 tests to run

🔄 Progress: [██████████████████████████████] 100.0% (6/6) - Example Usage Test

✅ Screenshot Service Test (2.34s)
   ✅ Passed

✅ Browser Pool Test (4.12s)
   ✅ Passed

✅ Simple Pool Test (1.89s)
   ✅ Passed

✅ Windows Cleanup Test (0.67s)
   ✅ Passed

⏭️ API Connection Test (0.00s)
   ⏭️ Skipped: Backend and frontend servers not running

✅ Example Usage Test (8.45s)
   ✅ Passed

============================================================
📊 TEST SUMMARY
============================================================
⏱️  Total time: 17.47s
📋 Total tests: 6
✅ Passed: 5
❌ Failed: 0
⏭️ Skipped: 1
💥 Errors: 0

⏭️ Skipped Tests:
   • API Connection Test: Backend and frontend servers not running

🎉 All tests passed!
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure you're running from the `python` directory
2. **Server Connection Errors**: Start the backend and frontend servers before running server-dependent tests
3. **Browser Issues**: Ensure Playwright is properly installed (`playwright install`)
4. **Windows Cleanup Warnings**: These are normal and don't indicate test failure

### Getting Help

- Check the main project README for setup instructions
- Run `python utils/diagnose_playwright.py` for Playwright diagnostics
- Run `python utils/fix_windows_playwright.py` for Windows-specific fixes
