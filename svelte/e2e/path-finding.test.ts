import { expect, test } from '@playwright/test';

test.describe('Path Finding Application', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('should display the main application interface', async ({ page }) => {
		// Check for main heading
		await expect(page.locator('h1')).toBeVisible();

		// Check for URL input fields
		await expect(page.locator('input[placeholder*="start"]')).toBeVisible();
		await expect(page.locator('input[placeholder*="end"]')).toBeVisible();

		// Check for mode toggle (manual/autonomous)
		await expect(page.locator('text=Manual')).toBeVisible();
		await expect(page.locator('text=Autonomous')).toBeVisible();
	});

	test('should handle URL input validation', async ({ page }) => {
		const startUrlInput = page.locator('input[placeholder*="start"]');
		const analyzeButton = page.locator('button:has-text("Analyze")').first();

		// Test empty URL
		await analyzeButton.click();
		await expect(page.locator('text=No start URL provided')).toBeVisible();

		// Test invalid URL format
		await startUrlInput.fill('invalid-url');
		await analyzeButton.click();
		// Should show some error indication

		// Test valid URL format
		await startUrlInput.fill('https://example.com');
		await analyzeButton.click();
		// Should start loading state
		await expect(page.locator('.loading, [data-loading="true"]')).toBeVisible();
	});

	test('should toggle between manual and autonomous modes', async ({ page }) => {
		const manualButton = page.locator('button:has-text("Manual")');
		const autonomousButton = page.locator('button:has-text("Autonomous")');

		// Default should be manual mode
		await expect(manualButton).toHaveClass(/active|selected/);

		// Switch to autonomous mode
		await autonomousButton.click();
		await expect(autonomousButton).toHaveClass(/active|selected/);
		await expect(manualButton).not.toHaveClass(/active|selected/);

		// Switch back to manual mode
		await manualButton.click();
		await expect(manualButton).toHaveClass(/active|selected/);
		await expect(autonomousButton).not.toHaveClass(/active|selected/);
	});

	test('should handle canvas interactions', async ({ page }) => {
		// Fill in start URL to get canvas with content
		await page.locator('input[placeholder*="start"]').fill('https://example.com');
		await page.locator('button:has-text("Analyze")').first().click();

		// Wait for canvas to be ready
		await page.waitForSelector('[data-testid="path-canvas"]', { timeout: 10000 });

		const canvas = page.locator('[data-testid="path-canvas"]');
		await expect(canvas).toBeVisible();

		// Test canvas drag functionality
		await canvas.hover();
		await page.mouse.down();
		await page.mouse.move(100, 100);
		await page.mouse.up();

		// Test zoom functionality
		await canvas.hover();
		await page.mouse.wheel(0, -100); // Zoom in
		await page.mouse.wheel(0, 100); // Zoom out
	});

	test('should display nodes and connections correctly', async ({ page }) => {
		// Mock the API response to ensure consistent testing
		await page.route('**/api/**', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					total_links: 5,
					main_text_links: 3,
					regular_links: ['https://link1.com', 'https://link2.com']
					// ... other mock data
				})
			});
		});

		await page.locator('input[placeholder*="start"]').fill('https://example.com');
		await page.locator('button:has-text("Analyze")').first().click();

		// Wait for node to appear
		await expect(page.locator('[data-testid="path-node"]')).toBeVisible({ timeout: 10000 });

		// Check node content
		await expect(page.locator('text=example.com')).toBeVisible();
		await expect(page.locator('text=START')).toBeVisible();

		// Check for links in the node
		await expect(page.locator('[data-testid="link-button"]')).toHaveCount(2);
	});

	test('should handle node expansion and collapse', async ({ page }) => {
		// Setup with mocked data
		await page.route('**/api/**', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					total_links: 10,
					main_text_links: 8,
					regular_links: Array.from({ length: 15 }, (_, i) => `https://link${i + 1}.com`)
				})
			});
		});

		await page.locator('input[placeholder*="start"]').fill('https://example.com');
		await page.locator('button:has-text("Analyze")').first().click();

		await expect(page.locator('[data-testid="path-node"]')).toBeVisible({ timeout: 10000 });

		// Find expand/collapse button
		const expandButton = page.locator('[data-testid="expand-button"]');
		await expect(expandButton).toBeVisible();

		// Test collapse
		await expandButton.click();
		await expect(page.locator('[data-testid="node-content"]')).not.toBeVisible();

		// Test expand
		await expandButton.click();
		await expect(page.locator('[data-testid="node-content"]')).toBeVisible();
	});

	test('should handle "Show More Links" functionality', async ({ page }) => {
		// Mock data with many links
		await page.route('**/api/**', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					total_links: 25,
					regular_links: Array.from({ length: 25 }, (_, i) => `https://link${i + 1}.com`)
				})
			});
		});

		await page.locator('input[placeholder*="start"]').fill('https://example.com');
		await page.locator('button:has-text("Analyze")').first().click();

		await expect(page.locator('[data-testid="path-node"]')).toBeVisible({ timeout: 10000 });

		// Should initially show limited links
		await expect(page.locator('[data-testid="link-button"]')).toHaveCount(10);

		// Click "Show More Links"
		await page.locator('text=Show More Links').click();

		// Should show all links
		await expect(page.locator('[data-testid="link-button"]')).toHaveCount(25);
	});

	test('should handle link clicking to create new nodes', async ({ page }) => {
		// Mock initial response
		await page.route('**/api/**', (route) => {
			if (route.request().url().includes('example.com')) {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						total_links: 3,
						regular_links: ['https://link1.com', 'https://link2.com']
					})
				});
			} else if (route.request().url().includes('link1.com')) {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						total_links: 2,
						regular_links: ['https://nested1.com']
					})
				});
			}
		});

		await page.locator('input[placeholder*="start"]').fill('https://example.com');
		await page.locator('button:has-text("Analyze")').first().click();

		await expect(page.locator('[data-testid="path-node"]')).toBeVisible({ timeout: 10000 });

		// Click on a link to create new node
		await page.locator('[data-testid="link-button"]:has-text("link1.com")').click();

		// Should create a second node
		await expect(page.locator('[data-testid="path-node"]')).toHaveCount(2);

		// Should show connection between nodes
		await expect(page.locator('[data-testid="connection-line"]')).toBeVisible();
	});

	test('should handle node dragging', async ({ page }) => {
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

		const node = page.locator('[data-testid="path-node"]').first();
		await expect(node).toBeVisible({ timeout: 10000 });

		// Get initial position
		const initialBox = await node.boundingBox();

		// Drag the node
		await node.hover();
		await page.mouse.down();
		await page.mouse.move(initialBox!.x + 200, initialBox!.y + 100);
		await page.mouse.up();

		// Check that position has changed
		const finalBox = await node.boundingBox();
		expect(finalBox!.x).not.toEqual(initialBox!.x);
		expect(finalBox!.y).not.toEqual(initialBox!.y);
	});

	test('should handle error states gracefully', async ({ page }) => {
		// Mock API error
		await page.route('**/api/**', (route) => {
			route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Server error' })
			});
		});

		await page.locator('input[placeholder*="start"]').fill('https://example.com');
		await page.locator('button:has-text("Analyze")').first().click();

		// Should display error message
		await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
		await expect(page.locator('text=Server error')).toBeVisible();
	});

	test('should handle clear path functionality', async ({ page }) => {
		// Setup with nodes
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

		await expect(page.locator('[data-testid="path-node"]')).toBeVisible({ timeout: 10000 });

		// Clear the path
		await page.locator('button:has-text("Clear")').click();

		// Should remove all nodes
		await expect(page.locator('[data-testid="path-node"]')).toHaveCount(0);

		// Should clear input fields
		await expect(page.locator('input[placeholder*="start"]')).toHaveValue('');
		await expect(page.locator('input[placeholder*="end"]')).toHaveValue('');
	});

	test('should handle keyboard navigation', async ({ page }) => {
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

		await expect(page.locator('[data-testid="path-canvas"]')).toBeVisible({ timeout: 10000 });

		const canvas = page.locator('[data-testid="path-canvas"]');
		await canvas.focus();

		// Test arrow key navigation
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowLeft');
		await page.keyboard.press('ArrowUp');

		// Test zoom keyboard shortcuts
		await page.keyboard.press('Control+='); // Zoom in
		await page.keyboard.press('Control+-'); // Zoom out
	});

	test('should handle autonomous mode progression', async ({ page }) => {
		// Mock multiple API responses for autonomous flow
		let requestCount = 0;
		await page.route('**/api/**', (route) => {
			requestCount++;
			if (requestCount === 1) {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						total_links: 3,
						regular_links: ['https://intermediate.com', 'https://target.com']
					})
				});
			} else {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						total_links: 2,
						regular_links: ['https://target.com']
					})
				});
			}
		});

		// Switch to autonomous mode
		await page.locator('button:has-text("Autonomous")').click();

		// Set start and end URLs
		await page.locator('input[placeholder*="start"]').fill('https://example.com');
		await page.locator('input[placeholder*="end"]').fill('https://target.com');

		// Start autonomous search
		await page.locator('button:has-text("Find Path")').click();

		// Should show progress indicators
		await expect(page.locator('[data-testid="autonomous-progress"]')).toBeVisible();
		await expect(page.locator('text=Searching')).toBeVisible();

		// Wait for completion
		await expect(page.locator('text=Path found')).toBeVisible({ timeout: 30000 });

		// Should highlight the found path
		await expect(page.locator('[data-testid="path-highlight"]')).toBeVisible();
	});
});
