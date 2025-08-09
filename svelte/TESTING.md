# Testing Guide for Site Path Search

This document provides comprehensive guidance on the testing strategy and implementation for the Site Path Search application.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Unit Tests](#unit-tests)
3. [E2E Tests](#e2e-tests)
4. [Storybook Tests](#storybook-tests)
5. [Running Tests](#running-tests)
6. [Test Coverage](#test-coverage)
7. [Writing New Tests](#writing-new-tests)
8. [CI/CD Integration](#cicd-integration)

## Testing Overview

Our testing strategy follows the testing pyramid approach:

- **Unit Tests**: Test individual functions and utilities in isolation
- **Component Tests**: Test Svelte components with Vitest and browser testing
- **E2E Tests**: Test complete user workflows with Playwright
- **Visual Tests**: Test UI consistency with Storybook
- **Accessibility Tests**: Ensure WCAG compliance
- **Performance Tests**: Verify app performance under various conditions

## Unit Tests

### Coverage

Unit tests are implemented for all TypeScript utility modules:

- `canvasOperations.test.ts` - Canvas state management and interactions
- `collisionDetection.test.ts` - Node positioning collision detection
- `connectionUtils.test.ts` - Connection calculations and path logic
- `nodeAnalysis.test.ts` - URL analysis and node creation
- `nodeDragging.test.ts` - Node dragging functionality
- `nodeInteraction.test.ts` - Node UI interaction states
- `nodePositioning.test.ts` - Optimal node positioning algorithms
- `pathStateManager.test.ts` - Path state management

### Key Testing Patterns

#### 1. State Management Testing

```typescript
describe('pathStateManager', () => {
	let pathState: PathState;

	beforeEach(() => {
		pathState = createInitialPathState();
	});

	it('should update node position correctly', () => {
		// Test state mutations
	});
});
```

#### 2. Algorithm Testing

```typescript
describe('collision detection', () => {
	it('should detect overlapping rectangles', () => {
		const result = checkRectangleCollision(0, 0, 100, 100, 50, 50, 100, 100);
		expect(result).toBe(true);
	});
});
```

#### 3. Async Operation Testing

```typescript
describe('node analysis', () => {
	it('should handle API failures gracefully', async () => {
		vi.mocked(LinkAnalysisService.analyzeLinks).mockRejectedValue(new Error('Network error'));
		const result = await analyzeStartUrl(pathState);
		expect(result.success).toBe(false);
	});
});
```

## E2E Tests

### Test Categories

#### 1. Core Functionality Tests (`path-finding.test.ts`)

- URL input validation
- Node creation and linking
- Canvas interactions (zoom, pan, drag)
- Mode switching (manual/autonomous)
- Path clearing and reset

#### 2. Accessibility Tests (`accessibility.test.ts`)

- WCAG compliance checking
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Color contrast validation

#### 3. Performance Tests (`performance.test.ts`)

- Load time measurements
- Large dataset handling
- Canvas performance under stress
- Memory usage monitoring
- Network delay handling

### Key E2E Testing Patterns

#### 1. API Mocking

```typescript
await page.route('**/api/**', (route) => {
	route.fulfill({
		status: 200,
		contentType: 'application/json',
		body: JSON.stringify(mockData)
	});
});
```

#### 2. User Workflow Testing

```typescript
test('should create connected nodes', async ({ page }) => {
	await page.locator('input[placeholder*="start"]').fill('https://example.com');
	await page.locator('button:has-text("Analyze")').click();
	await expect(page.locator('[data-testid="path-node"]')).toBeVisible();

	await page.locator('[data-testid="link-button"]').first().click();
	await expect(page.locator('[data-testid="path-node"]')).toHaveCount(2);
});
```

#### 3. Accessibility Testing

```typescript
test('should be keyboard navigable', async ({ page }) => {
	await page.keyboard.press('Tab');
	await expect(page.locator('input')).toBeFocused();
});
```

## Storybook Tests

### Story Coverage

We provide comprehensive Storybook stories for all major components:

- `PathNode.stories.svelte` - Node component states and interactions
- `PathCanvas.stories.svelte` - Canvas with various data states
- `URLInput.stories.svelte` - Input component variations
- `DarkModeToggle.stories.svelte` - Theme toggle functionality
- `LinkFinder.stories.svelte` - Link analysis component

### Story Categories

#### 1. Basic States

- Default appearance
- Loading states
- Error states
- Empty states

#### 2. Interactive Demos

- User interaction flows
- Responsive behavior
- Animation states

#### 3. Accessibility Focused

- Keyboard navigation
- Screen reader compatibility
- Focus management

#### 4. Edge Cases

- Long URLs
- Many links
- Large datasets

### Storybook Testing Features

#### 1. Visual Regression Testing

```typescript
// Automatic screenshot comparison
await page.screenshot({
	path: `test-results/visual-${id}.png`,
	fullPage: true
});
```

#### 2. Accessibility Testing

```typescript
// Automated a11y checks on all stories
await checkA11y(page, '#storybook-root');
```

#### 3. Interaction Testing

```typescript
// Test user interactions in stories
await page.locator('button').click();
await expect(page.locator('.result')).toBeVisible();
```

## Running Tests

### Available Commands

```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit -- --watch

# Run all tests (unit + e2e)
npm run test

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (visible browser)
npm run test:e2e -- --headed

# Run specific E2E test file
npm run test:e2e -- path-finding.test.ts

# Start Storybook for visual testing
npm run storybook

# Build Storybook for production
npm run build-storybook

# Run Storybook test runner
npm run test-storybook
```

### Test Configuration

#### Vitest Configuration

```typescript
// vite.config.ts
test: {
	projects: [
		{
			name: 'client',
			environment: 'browser',
			browser: { enabled: true, provider: 'playwright' }
		},
		{
			name: 'server',
			environment: 'node'
		}
	];
}
```

#### Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
	testDir: './e2e',
	timeout: 30000,
	use: {
		baseURL: 'http://localhost:4173',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	}
});
```

## Test Coverage

### Coverage Goals

- **Unit Tests**: >90% line coverage for utilities
- **Component Tests**: All major component states tested
- **E2E Tests**: All critical user paths covered
- **Accessibility**: WCAG 2.1 AA compliance

### Coverage Reports

```bash
# Generate coverage report
npm run test:unit -- --coverage

# View coverage in browser
npm run test:unit -- --coverage --ui
```

## Writing New Tests

### Best Practices

#### 1. Unit Test Structure

```typescript
describe('FeatureName', () => {
	let state: StateType;

	beforeEach(() => {
		state = createInitialState();
	});

	describe('specific functionality', () => {
		it('should handle expected case', () => {
			// Arrange
			const input = setupInput();

			// Act
			const result = functionUnderTest(input);

			// Assert
			expect(result).toBe(expectedValue);
		});

		it('should handle edge case', () => {
			// Test boundary conditions
		});

		it('should handle error case', () => {
			// Test error handling
		});
	});
});
```

#### 2. E2E Test Structure

```typescript
test.describe('Feature Name', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		// Setup common state
	});

	test('should complete main user flow', async ({ page }) => {
		// Test happy path
	});

	test('should handle error conditions', async ({ page }) => {
		// Test error scenarios
	});
});
```

#### 3. Storybook Story Structure

```svelte
<script module>
	const { Story } = defineMeta({
		title: 'Category/ComponentName',
		component: Component,
		tags: ['autodocs']
	});
</script>

<!-- Basic states -->
<Story
	name="Default"
	args={{
		/* default props */
	}}
/>

<!-- Edge cases -->
<Story
	name="Error State"
	args={{
		/* error props */
	}}
/>

<!-- Interactive demos -->
<Story
	name="Playground"
	args={{
		/* interactive props */
	}}
>
	<Component {...args} />
	<div class="documentation">
		<!-- Usage instructions -->
	</div>
</Story>
```

### Testing Guidelines

#### 1. Unit Tests

- Test one thing at a time
- Use descriptive test names
- Mock external dependencies
- Test both success and failure cases
- Verify state changes accurately

#### 2. E2E Tests

- Test real user workflows
- Use data-testid attributes for stable selectors
- Mock API responses for consistent testing
- Include accessibility checks
- Test on different viewport sizes

#### 3. Storybook Stories

- Cover all component states
- Include interactive examples
- Provide usage documentation
- Test edge cases visually
- Ensure accessibility compliance

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Build Storybook
        run: npm run build-storybook

      - name: Run Storybook tests
        run: npm run test-storybook
```

### Quality Gates

- All tests must pass
- Coverage must meet minimum thresholds
- No accessibility violations
- No TypeScript errors
- No linting errors

### Deployment Testing

- Smoke tests on staging environment
- Performance regression testing
- Cross-browser compatibility checks
- Mobile responsiveness verification

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Storybook Documentation](https://storybook.js.org/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Contributing

When adding new features:

1. Write unit tests for new utilities
2. Add E2E tests for new user workflows
3. Create Storybook stories for new components
4. Update this documentation as needed
5. Ensure all tests pass before submitting PR
