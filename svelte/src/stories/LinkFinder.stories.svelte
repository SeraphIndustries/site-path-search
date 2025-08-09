<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LinkFinder from '$lib/components/LinkFinder.svelte';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Components/LinkFinder',
		component: LinkFinder,
		tags: ['autodocs'],
		args: {
			// Mock the LinkAnalysisService if needed
		}
	});
</script>

<Story name="Default" />

<Story name="With Example URLs">
	<LinkFinder />
	<div class="mt-4 rounded bg-blue-50 p-4">
		<h3 class="mb-2 font-semibold text-blue-800">Try these example URLs:</h3>
		<ul class="space-y-1 text-sm text-blue-700">
			<li>• https://example.com</li>
			<li>• https://github.com</li>
			<li>• https://stackoverflow.com</li>
			<li>• https://docs.github.com</li>
		</ul>
	</div>
</Story>

<Story name="Usage Instructions">
	<LinkFinder />
	<div class="mt-4 rounded bg-gray-100 p-4">
		<h3 class="mb-2 font-semibold">How to use Link Finder:</h3>
		<ol class="space-y-2 text-sm text-gray-600">
			<li>1. Enter a start URL in the first input field</li>
			<li>2. Click "Analyze Start" to fetch and analyze the links</li>
			<li>3. Optionally enter an end URL to set a target</li>
			<li>4. Review the link analysis results</li>
			<li>5. Use the arrow indicator to proceed with path finding</li>
		</ol>
	</div>
</Story>

<Story name="Error Handling Demo">
	<LinkFinder />
	<div class="mt-4 rounded bg-yellow-50 p-4">
		<h3 class="mb-2 font-semibold text-yellow-800">Test error handling:</h3>
		<ul class="space-y-1 text-sm text-yellow-700">
			<li>• Try an invalid URL format</li>
			<li>• Try a non-existent domain</li>
			<li>• Leave the URL field empty and click analyze</li>
		</ul>
	</div>
</Story>
