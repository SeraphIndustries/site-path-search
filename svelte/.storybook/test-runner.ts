import type { TestRunnerConfig } from '@storybook/test-runner';
import { checkA11y, injectAxe } from 'axe-playwright';

const config: TestRunnerConfig = {
	// Add accessibility testing to all stories
	async preVisit(page) {
		await injectAxe(page);
	},

	async postVisit(page) {
		await checkA11y(page, '#storybook-root', {
			detailedReport: true,
			detailedReportOptions: {
				html: true
			}
		});
	},

	// Add visual regression testing
	async postRender(page, context) {
		const { id, title, name } = context;

		// Skip visual tests for certain stories that are inherently dynamic
		const skipVisualTests = ['loading', 'interactive', 'demo', 'playground', 'animation'];

		const shouldSkipVisual = skipVisualTests.some(
			(keyword) => name.toLowerCase().includes(keyword) || title.toLowerCase().includes(keyword)
		);

		if (!shouldSkipVisual) {
			await page.screenshot({
				path: `test-results/visual-${id}.png`,
				fullPage: true
			});
		}
	},

	// Custom test logic for specific story types
	async postTest(page, context) {
		const { name } = context;

		// Test keyboard navigation for accessibility stories
		if (name.toLowerCase().includes('accessibility')) {
			await page.keyboard.press('Tab');
			await page.keyboard.press('Enter');
			await page.keyboard.press('Escape');
		}

		// Test hover states for interactive components
		if (name.toLowerCase().includes('interactive')) {
			const interactiveElements = page.locator('button, a, [role="button"]');
			const count = await interactiveElements.count();

			for (let i = 0; i < Math.min(count, 3); i++) {
				await interactiveElements.nth(i).hover();
				await page.waitForTimeout(100);
			}
		}
	}
};

export default config;
