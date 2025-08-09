# Testing Guide for Site Path Search

This document provides comprehensive guidance on the testing strategy and implementation for the Site Path Search application.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Unit Tests](#unit-tests)
3. [Storybook Tests](#storybook-tests)
4. [Running Tests](#running-tests)
5. [Test Coverage](#test-coverage)
6. [Writing New Tests](#writing-new-tests)
7. [CI/CD Integration](#cicd-integration)

## Testing Overview

Our testing strategy follows the testing pyramid approach:

- **Unit Tests**: Test individual functions and utilities in isolation
- **Component Tests**: Test Svelte components with Vitest and browser testing
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

## Storybook Tests

### Test Categories

#### 1. Component Stories

- Interactive component documentation
- Component state variations
- Theme switching verification
- Accessibility testing via addon-a11y

#### 2. Form Component Stories

- Input validation testing
- Error state handling
- Loading state verification

#### 3. Visual Testing

- Component rendering consistency
- Layout verification across screen sizes
- Dark/light theme compatibility

### Key Component Testing Patterns

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

# Run all tests (unit only)
npm run test

# Run unit tests in watch mode
npm run test:unit

# Run Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook

# Start Storybook for visual testing
npm run storybook

# Build Storybook for production
npm run build-storybook

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

#### Storybook Configuration

```typescript
// .storybook/main.ts
export default {
	stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|svelte)'],
	addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest']
};
```

## Test Coverage

### Coverage Goals

- **Unit Tests**: >90% line coverage for utilities
- **Component Tests**: All major component states tested
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

#### 2. Storybook Story Structure

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

#### 2. Storybook Stories

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
2. Create Storybook stories for new components
3. Update this documentation as needed
4. Ensure all tests pass before submitting PR
