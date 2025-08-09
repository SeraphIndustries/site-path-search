<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Components/DarkModeToggle',
		component: DarkModeToggle,
		tags: ['autodocs'],
		argTypes: {
			isDark: {
				control: { type: 'boolean' }
			}
		},
		args: {
			onToggle: fn()
		}
	});
</script>

<Story name="Light Mode" args={{ isDark: false }} />

<Story name="Dark Mode" args={{ isDark: true }} />

<Story name="Interactive Demo" args={{ isDark: false }}>
	<div class="p-8">
		<DarkModeToggle {...args} />
		<div class="mt-6 rounded border p-4">
			<h3 class="mb-2 font-semibold">Sample Content</h3>
			<p class="text-gray-600">
				This content shows how the toggle affects the overall theme. Click the toggle above to see
				the theme change.
			</p>
			<button class="mt-3 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
				Sample Button
			</button>
		</div>
	</div>
</Story>

<Story name="In Header Context">
	<header class="border-b border-gray-200 bg-white px-6 py-4">
		<div class="flex items-center justify-between">
			<h1 class="text-xl font-semibold text-gray-900">Site Path Search</h1>
			<DarkModeToggle isDark={false} onToggle={fn()} />
		</div>
	</header>
	<main class="p-6">
		<p class="text-gray-600">This shows the dark mode toggle in a typical header layout.</p>
	</main>
</Story>

<Story name="With Tooltips">
	<div class="p-8">
		<DarkModeToggle {...args} />
		<div class="mt-4 rounded bg-gray-100 p-4">
			<h3 class="mb-2 font-semibold">Usage Instructions:</h3>
			<ul class="space-y-1 text-sm text-gray-600">
				<li>• Click the toggle to switch between light and dark themes</li>
				<li>• The icon changes to reflect the current mode</li>
				<li>• Keyboard accessible with Enter and Space keys</li>
				<li>• Changes are typically persisted across sessions</li>
			</ul>
		</div>
	</div>
</Story>

<Story name="Animation States">
	<div class="space-y-8">
		<div>
			<h3 class="mb-2 font-medium">Light to Dark Transition</h3>
			<DarkModeToggle isDark={false} onToggle={fn()} />
		</div>
		<div>
			<h3 class="mb-2 font-medium">Dark to Light Transition</h3>
			<DarkModeToggle isDark={true} onToggle={fn()} />
		</div>
	</div>
	<div class="mt-6 rounded bg-blue-50 p-4">
		<p class="text-sm text-blue-700">
			Click the toggles to see the smooth transition animations between states.
		</p>
	</div>
</Story>

<Story name="Accessibility Test">
	<div class="p-8">
		<DarkModeToggle {...args} />
		<div class="mt-6 rounded bg-green-50 p-4">
			<h3 class="mb-2 font-semibold text-green-800">Accessibility Features:</h3>
			<ul class="space-y-1 text-sm text-green-700">
				<li>• ✓ Keyboard navigation (Tab to focus, Enter/Space to activate)</li>
				<li>• ✓ Screen reader support with proper ARIA labels</li>
				<li>• ✓ Focus indicators for keyboard users</li>
				<li>• ✓ Semantic button element</li>
				<li>• ✓ Clear visual state indicators</li>
			</ul>
		</div>
	</div>
</Story>

<Story name="Responsive Sizes">
	<div class="space-y-6">
		<div>
			<h3 class="mb-2 font-medium">Normal Size</h3>
			<DarkModeToggle isDark={false} onToggle={fn()} />
		</div>
		<div class="origin-left scale-125">
			<h3 class="mb-2 font-medium">125% Scale</h3>
			<DarkModeToggle isDark={false} onToggle={fn()} />
		</div>
		<div class="origin-left scale-150">
			<h3 class="mb-2 font-medium">150% Scale</h3>
			<DarkModeToggle isDark={false} onToggle={fn()} />
		</div>
	</div>
</Story>
