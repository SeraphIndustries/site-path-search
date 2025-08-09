import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
	test('should not have any automatically detectable accessibility issues', async ({ page }) => {
		await page.goto('/');

		const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should be navigable with keyboard only', async ({ page }) => {
		await page.goto('/');

		// Tab through all interactive elements
		await page.keyboard.press('Tab'); // First input
		await expect(page.locator('input[placeholder*="start"]')).toBeFocused();

		await page.keyboard.press('Tab'); // Analyze button
		await expect(page.locator('button:has-text("Analyze")').first()).toBeFocused();

		await page.keyboard.press('Tab'); // Second input
		await expect(page.locator('input[placeholder*="end"]')).toBeFocused();

		await page.keyboard.press('Tab'); // Mode buttons
		await expect(
			page.locator('button:has-text("Manual"), button:has-text("Autonomous")').first()
		).toBeFocused();
	});

	test('should have proper ARIA labels and roles', async ({ page }) => {
		await page.goto('/');

		// Check for proper heading structure
		const h1 = page.locator('h1');
		await expect(h1).toBeVisible();

		// Check for proper form labels
		const startInput = page.locator('input[placeholder*="start"]');
		await expect(startInput).toHaveAttribute('aria-label');

		const endInput = page.locator('input[placeholder*="end"]');
		await expect(endInput).toHaveAttribute('aria-label');

		// Check for proper button labels
		const analyzeButtons = page.locator('button:has-text("Analyze")');
		for (const button of await analyzeButtons.all()) {
			await expect(button).toHaveAttribute('aria-label');
		}
	});

	test('should announce dynamic content changes to screen readers', async ({ page }) => {
		await page.goto('/');

		// Mock successful API response
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

		// Check for aria-live regions that announce changes
		await expect(page.locator('[aria-live="polite"], [aria-live="assertive"]')).toBeVisible();

		// Check that loading states are announced
		await expect(page.locator('[role="status"]')).toBeVisible();
	});

	test('should have sufficient color contrast', async ({ page }) => {
		await page.goto('/');

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

		const colorContrastViolations = accessibilityScanResults.violations.filter(
			(violation) => violation.id === 'color-contrast'
		);

		expect(colorContrastViolations).toEqual([]);
	});

	test('should handle focus management properly', async ({ page }) => {
		await page.goto('/');

		// Mock API response
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

		// Wait for node to appear
		await expect(page.locator('[data-testid="path-node"]')).toBeVisible({ timeout: 10000 });

		// Focus should be manageable within nodes
		const node = page.locator('[data-testid="path-node"]').first();
		await node.focus();

		// Should be able to tab through interactive elements within the node
		await page.keyboard.press('Tab');
		await expect(page.locator('[data-testid="expand-button"]')).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.locator('[data-testid="link-button"]').first()).toBeFocused();
	});

	test('should provide meaningful error messages', async ({ page }) => {
		await page.goto('/');

		// Mock API error
		await page.route('**/api/**', (route) => {
			route.fulfill({
				status: 404,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'URL not found' })
			});
		});

		await page.locator('input[placeholder*="start"]').fill('https://nonexistent.com');
		await page.locator('button:has-text("Analyze")').first().click();

		// Error should be announced and visible
		const errorMessage = page.locator('[role="alert"], [aria-live="assertive"]');
		await expect(errorMessage).toBeVisible({ timeout: 10000 });
		await expect(errorMessage).toContainText('URL not found');
	});

	test('should support reduced motion preferences', async ({ page }) => {
		// Simulate reduced motion preference
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');

		// Mock API response
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

		// Animations should be disabled or minimal
		// This would need to be verified based on your CSS implementation
		const animatedElements = page.locator('[class*="animate"], [class*="transition"]');

		// Check that animations respect the preference
		for (const element of await animatedElements.all()) {
			const animationDuration = await element.evaluate(
				(el) => getComputedStyle(el).animationDuration
			);
			// Should be 0s or very short for reduced motion
			expect(animationDuration).toMatch(/^(0s|0\.01s)$/);
		}
	});

	test('should work with screen reader simulation', async ({ page }) => {
		await page.goto('/');

		// Navigate using only keyboard and check screen reader accessible content
		await page.keyboard.press('Tab');

		const focusedElement = page.locator(':focus');

		// Check that focused elements have proper accessible names
		const accessibleName =
			(await focusedElement.getAttribute('aria-label')) ||
			(await focusedElement.getAttribute('aria-labelledby')) ||
			(await focusedElement.textContent());

		expect(accessibleName).toBeTruthy();
		expect(accessibleName?.trim().length).toBeGreaterThan(0);
	});
});
