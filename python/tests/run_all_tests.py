#!/usr/bin/env python3
"""
Aggregated test runner for all test scripts in the site-path-search project.
This script runs all existing test scripts and provides comprehensive reporting.
"""

import sys
import os
import subprocess
import time
import requests
import asyncio
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

# Add the parent directory to Python path so we can import from packages
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests import (
    test_screenshot_service,
    test_browser_pool,
    test_pool_simple,
    test_windows_cleanup,
    example_usage,
    test_api_connection,
)


class TestStatus(Enum):

    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


@dataclass
class TestResult:

    name: str
    status: TestStatus
    duration: float
    output: str
    error: Optional[str] = None
    requires_servers: bool = False


class TestRunner:

    def __init__(self):
        self.results: List[TestResult] = []
        self.start_time = time.time()

        self.tests = [
            {
                "name": "Screenshot Service Test",
                "module": test_screenshot_service,
                "function": "test_screenshot_service",
                "requires_servers": False,
                "description": "Tests the website screenshot service with proper cleanup",
            },
            {
                "name": "Browser Pool Test",
                "module": test_browser_pool,
                "function": "test_browser_pool",
                "requires_servers": False,
                "description": "Tests browser pool functionality and concurrent requests",
            },
            {
                "name": "Simple Pool Test",
                "module": test_pool_simple,
                "function": "test_simple_pool",
                "requires_servers": False,
                "description": "Simple browser pool functionality test",
            },
            {
                "name": "Windows Cleanup Test",
                "module": test_windows_cleanup,
                "function": "test_cleanup",
                "requires_servers": False,
                "description": "Tests Windows asyncio cleanup fix",
            },
            {
                "name": "API Connection Test",
                "module": test_api_connection,
                "function": "main",
                "requires_servers": True,
                "description": "Tests API endpoints (requires backend and frontend running)",
            },
            {
                "name": "Example Usage Test",
                "module": example_usage,
                "function": "main",
                "requires_servers": False,
                "description": "Runs example usage demonstrations",
            },
        ]

    def check_servers_running(self) -> Tuple[bool, bool]:
        backend_running = False
        frontend_running = False

        try:
            # Check backend (FastAPI)
            response = requests.get("http://localhost:8000/health", timeout=2)
            backend_running = response.status_code == 200
        except:
            pass

        try:
            # Check frontend (Svelte dev server)
            response = requests.get("http://localhost:5173", timeout=2)
            frontend_running = response.status_code == 200
        except:
            pass

        return backend_running, frontend_running

    def print_header(self):
        print("🚀 Site Path Search - Aggregated Test Runner")
        print("=" * 60)
        print(f"📅 Started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🐍 Python: {sys.version.split()[0]}")
        print(f"📁 Working directory: {os.getcwd()}")
        print()

    def print_progress(self, current: int, total: int, test_name: str):
        progress = (current / total) * 100
        bar_length = 30
        filled_length = int(bar_length * current // total)
        bar = "█" * filled_length + "░" * (bar_length - filled_length)

        print(
            f"\r🔄 Progress: [{bar}] {progress:.1f}% ({current}/{total}) - {test_name}",
            end="",
            flush=True,
        )

    def print_test_result(self, result: TestResult):
        status_icons = {
            TestStatus.PASSED: "✅",
            TestStatus.FAILED: "❌",
            TestStatus.SKIPPED: "⏭️",
            TestStatus.ERROR: "💥",
            TestStatus.RUNNING: "🔄",
            TestStatus.PENDING: "⏳",
        }

        icon = status_icons.get(result.status, "❓")
        duration_str = f"({result.duration:.2f}s)" if result.duration > 0 else ""

        print(f"\n{icon} {result.name} {duration_str}")

        if result.status == TestStatus.SKIPPED:
            print(f"   ⏭️  Skipped: {result.error}")
        elif result.status == TestStatus.FAILED:
            print(f"   ❌ Failed: {result.error}")
        elif result.status == TestStatus.ERROR:
            print(f"   💥 Error: {result.error}")
        elif result.status == TestStatus.PASSED:
            print(f"   ✅ Passed")

    async def run_async_test(self, test_info: Dict) -> TestResult:
        name = test_info["name"]
        module = test_info["module"]
        function_name = test_info["function"]
        requires_servers = test_info["requires_servers"]

        start_time = time.time()
        output = ""
        error = None

        try:
            import io
            import contextlib

            f = io.StringIO()
            with contextlib.redirect_stdout(f):
                if function_name == "main":
                    if hasattr(module, function_name):
                        if asyncio.iscoroutinefunction(getattr(module, function_name)):
                            await getattr(module, function_name)()
                        else:
                            getattr(module, function_name)()
                    else:
                        raise AttributeError(
                            f"Function {function_name} not found in module"
                        )
                else:
                    if hasattr(module, function_name):
                        func = getattr(module, function_name)
                        if asyncio.iscoroutinefunction(func):
                            await func()
                        else:
                            func()
                    else:
                        raise AttributeError(
                            f"Function {function_name} not found in module"
                        )

            output = f.getvalue()
            duration = time.time() - start_time

            return TestResult(
                name=name,
                status=TestStatus.PASSED,
                duration=duration,
                output=output,
                requires_servers=requires_servers,
            )

        except Exception as e:
            duration = time.time() - start_time
            error = str(e)

            return TestResult(
                name=name,
                status=TestStatus.FAILED,
                duration=duration,
                output=output,
                error=error,
                requires_servers=requires_servers,
            )

    def run_sync_test(self, test_info: Dict) -> TestResult:
        name = test_info["name"]
        module = test_info["module"]
        function_name = test_info["function"]
        requires_servers = test_info["requires_servers"]

        start_time = time.time()
        output = ""
        error = None

        try:
            # Capture stdout to get test output
            import io
            import contextlib

            f = io.StringIO()
            with contextlib.redirect_stdout(f):
                if function_name == "main":
                    # For main functions, we need to run them directly
                    if hasattr(module, function_name):
                        getattr(module, function_name)()
                    else:
                        raise AttributeError(
                            f"Function {function_name} not found in module"
                        )
                else:
                    # For sync functions, call them directly
                    if hasattr(module, function_name):
                        getattr(module, function_name)()
                    else:
                        raise AttributeError(
                            f"Function {function_name} not found in module"
                        )

            output = f.getvalue()
            duration = time.time() - start_time

            return TestResult(
                name=name,
                status=TestStatus.PASSED,
                duration=duration,
                output=output,
                requires_servers=requires_servers,
            )

        except Exception as e:
            duration = time.time() - start_time
            error = str(e)

            return TestResult(
                name=name,
                status=TestStatus.FAILED,
                duration=duration,
                output=output,
                error=error,
                requires_servers=requires_servers,
            )

    async def run_tests(self, skip_server_dependent: bool = False) -> List[TestResult]:
        """Run all tests."""
        self.print_header()

        # Check server status
        backend_running, frontend_running = self.check_servers_running()

        if backend_running or frontend_running:
            print(f"🌐 Server Status:")
            print(
                f"   Backend (localhost:8000): {'✅ Running' if backend_running else '❌ Not running'}"
            )
            print(
                f"   Frontend (localhost:5173): {'✅ Running' if frontend_running else '❌ Not running'}"
            )
        else:
            print("🌐 Server Status: ❌ No servers detected")

        if skip_server_dependent:
            print("⚠️  Server-dependent tests will be skipped")

        print(f"\n📋 Found {len(self.tests)} tests to run")
        print()

        for i, test_info in enumerate(self.tests, 1):
            # Check if we should skip server-dependent tests
            if test_info["requires_servers"] and skip_server_dependent:
                result = TestResult(
                    name=test_info["name"],
                    status=TestStatus.SKIPPED,
                    duration=0,
                    output="",
                    error="Skipped due to --skip-server-dependent flag",
                    requires_servers=True,
                )
                self.results.append(result)
                self.print_progress(i, len(self.tests), test_info["name"])
                self.print_test_result(result)
                continue

            # Check if servers are required but not running
            if test_info["requires_servers"] and not (
                backend_running and frontend_running
            ):
                result = TestResult(
                    name=test_info["name"],
                    status=TestStatus.SKIPPED,
                    duration=0,
                    output="",
                    error="Backend and frontend servers not running",
                    requires_servers=True,
                )
                self.results.append(result)
                self.print_progress(i, len(self.tests), test_info["name"])
                self.print_test_result(result)
                continue

            self.print_progress(i, len(self.tests), test_info["name"])

            # Run the test
            try:
                if test_info["function"] in [
                    "test_screenshot_service",
                    "test_browser_pool",
                    "test_simple_pool",
                    "test_cleanup",
                ]:
                    # These are async functions
                    result = await self.run_async_test(test_info)
                else:
                    # These are sync functions (main functions)
                    result = self.run_sync_test(test_info)

                self.results.append(result)
                self.print_test_result(result)

            except Exception as e:
                result = TestResult(
                    name=test_info["name"],
                    status=TestStatus.ERROR,
                    duration=time.time() - time.time(),
                    output="",
                    error=f"Test runner error: {str(e)}",
                    requires_servers=test_info["requires_servers"],
                )
                self.results.append(result)
                self.print_test_result(result)

        return self.results

    def print_summary(self):
        """Print test summary."""
        total_time = time.time() - self.start_time

        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)

        # Count results by status
        status_counts = {}
        for status in TestStatus:
            status_counts[status] = len([r for r in self.results if r.status == status])

        print(f"⏱️  Total time: {total_time:.2f}s")
        print(f"📋 Total tests: {len(self.results)}")
        print(f"✅ Passed: {status_counts[TestStatus.PASSED]}")
        print(f"❌ Failed: {status_counts[TestStatus.FAILED]}")
        print(f"⏭️  Skipped: {status_counts[TestStatus.SKIPPED]}")
        print(f"💥 Errors: {status_counts[TestStatus.ERROR]}")

        # Show failed tests
        failed_tests = [
            r for r in self.results if r.status in [TestStatus.FAILED, TestStatus.ERROR]
        ]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for result in failed_tests:
                print(f"   • {result.name}: {result.error}")

        # Show skipped tests
        skipped_tests = [r for r in self.results if r.status == TestStatus.SKIPPED]
        if skipped_tests:
            print(f"\n⏭️  Skipped Tests:")
            for result in skipped_tests:
                print(f"   • {result.name}: {result.error}")

        # Overall result
        if status_counts[TestStatus.FAILED] == 0 and status_counts[TestStatus.ERROR] == 0:
            print(f"\n🎉 All tests passed!")
            return 0
        else:
            print(f"\n⚠️  Some tests failed. Check the output above for details.")
            return 1


async def main():
    """Main function."""
    import argparse

    parser = argparse.ArgumentParser(description="Run all tests for site-path-search")
    parser.add_argument(
        "--skip-server-dependent",
        action="store_true",
        help="Skip tests that require backend and frontend servers to be running",
    )
    parser.add_argument(
        "--verbose", action="store_true", help="Show detailed output from each test"
    )

    args = parser.parse_args()

    runner = TestRunner()

    try:
        await runner.run_tests(skip_server_dependent=args.skip_server_dependent)
        exit_code = runner.print_summary()
        sys.exit(exit_code)

    except KeyboardInterrupt:
        print("\n\n⏹️  Test run interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test runner error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
