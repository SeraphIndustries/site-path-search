import { expect, test } from '@playwright/test';

test.describe('Performance Tests', () => {
	test('should load within acceptable time limits', async ({ page }) => {
		const startTime = Date.now();
		await page.goto('/');
		const loadTime = Date.now() - startTime;

		// Should load within 3 seconds
		expect(loadTime).toBeLessThan(3000);

		// Check for First Contentful Paint
		const fcpMetric = await page.evaluate(() => {
			return new Promise((resolve) => {
				new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						if (entry.name === 'first-contentful-paint') {
							resolve(entry.startTime);
						}
					}
				}).observe({ entryTypes: ['paint'] });

				// Fallback after 5 seconds
				setTimeout(() => resolve(null), 5000);
			});
		});

		if (fcpMetric) {
			expect(fcpMetric).toBeLessThan(2000); // FCP should be under 2 seconds
		}
	});

	test('should handle large datasets efficiently', async ({ page }) => {
		// Mock large dataset
		const largeDataset = {
			total_links: 1000,
			regular_links: Array.from({ length: 1000 }, (_, i) => `https://link${i + 1}.com`)
		};

		await page.route('**/api/**', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(largeDataset)
			});
		});

		await page.goto('/');
		await page.locator('input[placeholder*="start"]').fill('https://example.com');

		const startTime = Date.now();
		await page.locator('button:has-text("Analyze")').first().click();

		// Wait for node to render
		await expect(page.locator('[data-testid="path-node"]')).toBeVisible({ timeout: 10000 });
		const renderTime = Date.now() - startTime;

		// Should handle large datasets within reasonable time
		expect(renderTime).toBeLessThan(5000);

		// Check that only the expected number of links are initially visible (not all 1000)
		const visibleLinks = page.locator('[data-testid="link-button"]');
		await expect(visibleLinks).toHaveCount(10); // Should show only first 10

		// Performance should remain good when expanding
		const expandStartTime = Date.now();
		await page.locator('text=Show More Links').click();
		const expandTime = Date.now() - expandStartTime;

		expect(expandTime).toBeLessThan(1000); // Should expand quickly
	});

	test('should maintain smooth canvas performance', async ({ page }) => {
		await page.route('**/api/**', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					total_links: 5,
					regular_links: ['https://link1.com', 'https://link2.com']
				})
			});
		});

		await page.goto('/');
		await page.locator('input[placeholder*="start"]').fill('https://example.com');
		await page.locator('button:has-text("Analyze")').first().click();

		await expect(page.locator('[data-testid="path-canvas"]')).toBeVisible({ timeout: 10000 });

		const canvas = page.locator('[data-testid="path-canvas"]');

		// Test multiple rapid interactions
		for (let i = 0; i < 10; i++) {
			await canvas.hover();
			await page.mouse.wheel(0, -50); // Zoom in
			await page.mouse.wheel(0, 50); // Zoom out
		}

		// Canvas should remain responsive
		await expect(canvas).toBeVisible();

		// Test dragging performance
		await canvas.hover();
		await page.mouse.down();

		for (let i = 0; i < 20; i++) {
			await page.mouse.move(i * 10, i * 5);
		}

		await page.mouse.up();

		// Should complete without hanging
		await expect(canvas).toBeVisible();
	});

	test('should handle memory efficiently with multiple nodes', async ({ page }) => {
		let requestCount = 0;
		await page.route('**/api/**', (route) => {
			requestCount++;
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					total_links: 3,
					regular_links: [`https://link${requestCount}.com`, `https://nested${requestCount}.com`]
				})
			});
		});

		await page.goto('/');
		await page.locator('input[placeholder*="start"]').fill('https://example.com');
		await page.locator('button:has-text("Analyze")').first().click();

		// Create multiple nodes rapidly
		for (let i = 0; i < 10; i++) {
			await expect(page.locator('[data-testid="path-node"]')).toHaveCount(i + 1);

			// Click on first available link to create new node
			const linkButton = page.locator('[data-testid="link-button"]').first();
			if (await linkButton.isVisible()) {
				await linkButton.click();
				// Small delay to allow node creation
				await page.waitForTimeout(100);
			}
		}

		// Check memory usage (this is a simplified check)
		const heapSize = await page.evaluate(() => {
			// @ts-ignore
			return performance.memory ? performance.memory.usedJSHeapSize : 0;
		});

		// Memory usage should be reasonable (under 50MB for this test)
		if (heapSize > 0) {
			expect(heapSize).toBeLessThan(50 * 1024 * 1024);
		}
	});

	test('should handle network delays gracefully', async ({ page }) => {
		// Simulate slow network
		await page.route('**/api/**', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					total_links: 3,
					regular_links: ['https://link1.com']
				})
			});
		});

		await page.goto('/');
		await page.locator('input[placeholder*="start"]').fill('https://example.com');

		const analyzeButton = page.locator('button:has-text("Analyze")').first();
		await analyzeButton.click();

		// Should show loading state immediately
		await expect(page.locator('[data-loading="true"], .loading')).toBeVisible();

		// Button should be disabled during loading
		await expect(analyzeButton).toBeDisabled();

		// Should eventually complete
		await expect(page.locator('[data-testid="path-node"]')).toBeVisible({ timeout: 15000 });

		// Button should be enabled again
		await expect(analyzeButton).toBeEnabled();
	});

	test('should maintain performance with rapid user interactions', async ({ page }) => {
		await page.route('**/api/**', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					total_links: 10,
					regular_links: Array.from({ length: 10 }, (_, i) => `https://link${i + 1}.com`)
				})
			});
		});

		await page.goto('/');
		await page.locator('input[placeholder*="start"]').fill('https://example.com');
		await page.locator('button:has-text("Analyze")').first().click();

		await expect(page.locator('[data-testid="path-node"]')).toBeVisible({ timeout: 10000 });

		// Rapid interactions
		const node = page.locator('[data-testid="path-node"]').first();
		const expandButton = page.locator('[data-testid="expand-button"]').first();

		// Rapid expand/collapse
		for (let i = 0; i < 10; i++) {
			await expandButton.click();
			await page.waitForTimeout(50);
		}

		// Rapid mode switching
		const manualButton = page.locator('button:has-text("Manual")');
		const autonomousButton = page.locator('button:has-text("Autonomous")');

		for (let i = 0; i < 5; i++) {
			await autonomousButton.click();
			await manualButton.click();
		}

		// Application should remain responsive
		await expect(node).toBeVisible();
		await expect(expandButton).toBeVisible();
	});

	test('should handle browser resource constraints', async ({ page }) => {
		// Simulate resource constraints by limiting memory
		await page.evaluateOnNewDocument(() => {
			// Mock memory limitations
			Object.defineProperty(navigator, 'deviceMemory', {
				writable: false,
				value: 1 // Simulate 1GB device
			});
		});

		await page.goto('/');

		// Application should still load and function
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('input[placeholder*="start"]')).toBeVisible();

		// Test basic functionality under constraints
		await page.route('**/api/**', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					total_links: 3,
					regular_links: ['https://link1.com']
				})
			});
		});

		await page.locator('input[placeholder*="start"]').fill('https://example.com');
		await page.locator('button:has-text("Analyze")').first().click();

		await expect(page.locator('[data-testid="path-node"]')).toBeVisible({ timeout: 15000 });
	});
});
