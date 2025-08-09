<script module>
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Components/DarkModeToggle',
		component: DarkModeToggle,
		tags: ['autodocs'],
		parameters: {
			docs: {
				description: {
					component:
						'A theme toggle button that switches between light and dark modes. The component automatically detects and persists user preferences, and applies theme changes to elements with the "main-container" class. It provides visual feedback and maintains state across page reloads.'
				}
			}
		},
		argTypes: {}
	});
</script>

<Story name="Default" />
