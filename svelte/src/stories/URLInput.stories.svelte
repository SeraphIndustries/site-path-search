<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import URLInput from '$lib/components/URLInput.svelte';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Components/URLInput',
		component: URLInput,
		tags: ['autodocs'],
		argTypes: {
			placeholder: {
				control: { type: 'text' }
			},
			value: {
				control: { type: 'text' }
			}
		},
		args: {
			onSubmit: fn(),
			onChange: fn()
		}
	});
</script>

<Story
	name="Default"
	args={{
		placeholder: 'Enter URL here...',
		value: ''
	}}
/>

<Story
	name="Start URL Input"
	args={{
		placeholder: 'Enter start URL (e.g., https://example.com)',
		value: ''
	}}
/>

<Story
	name="End URL Input"
	args={{
		placeholder: 'Enter end URL (e.g., https://target.com)',
		value: ''
	}}
/>

<Story
	name="With Pre-filled Value"
	args={{
		placeholder: 'Enter URL here...',
		value: 'https://example.com'
	}}
/>

<Story
	name="With Long URL"
	args={{
		placeholder: 'Enter URL here...',
		value:
			'https://very-long-subdomain.example-with-many-parts.com/very/long/path/with/many/segments/and/parameters?param1=value1&param2=value2&param3=value3'
	}}
/>

<Story
	name="Different Placeholder Styles"
	args={{
		placeholder: '🔗 Enter your starting URL here to begin link analysis...',
		value: ''
	}}
/>

<Story name="Validation States">
	<div class="space-y-4">
		<div>
			<label class="mb-1 block text-sm font-medium text-gray-700">Valid URL</label>
			<URLInput
				placeholder="Enter URL here..."
				value="https://example.com"
				onSubmit={fn()}
				onChange={fn()}
			/>
		</div>
		<div>
			<label class="mb-1 block text-sm font-medium text-gray-700">Empty (Invalid)</label>
			<URLInput placeholder="Enter URL here..." value="" onSubmit={fn()} onChange={fn()} />
		</div>
		<div>
			<label class="mb-1 block text-sm font-medium text-gray-700">Invalid Format</label>
			<URLInput
				placeholder="Enter URL here..."
				value="not-a-valid-url"
				onSubmit={fn()}
				onChange={fn()}
			/>
		</div>
	</div>
</Story>

<Story
	name="Interactive Demo"
	args={{
		placeholder: 'Type a URL and press Enter or Tab',
		value: ''
	}}
>
	<URLInput {...args} />
	<div class="mt-4 rounded bg-gray-100 p-4">
		<h3 class="mb-2 font-semibold">Try these interactions:</h3>
		<ul class="space-y-1 text-sm text-gray-600">
			<li>• Type a URL and press Enter to submit</li>
			<li>• Use Tab to navigate between fields</li>
			<li>• Watch the onChange events in the Actions panel</li>
			<li>• Try valid URLs like https://example.com</li>
			<li>• Try invalid formats to see validation</li>
		</ul>
	</div>
</Story>

<Story name="Form Integration Example">
	<form class="space-y-4">
		<div>
			<label class="mb-1 block text-sm font-medium text-gray-700"> Start URL </label>
			<URLInput placeholder="https://start.example.com" value="" onSubmit={fn()} onChange={fn()} />
		</div>
		<div>
			<label class="mb-1 block text-sm font-medium text-gray-700"> Target URL </label>
			<URLInput placeholder="https://target.example.com" value="" onSubmit={fn()} onChange={fn()} />
		</div>
		<button type="submit" class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
			Find Path
		</button>
	</form>
</Story>

<Story name="Accessibility Focus">
	<div class="space-y-4">
		<URLInput placeholder="Focus me with Tab" value="" onSubmit={fn()} onChange={fn()} />
		<URLInput placeholder="Then Tab to me" value="" onSubmit={fn()} onChange={fn()} />
		<button class="rounded bg-blue-500 px-4 py-2 text-white"> And finally to this button </button>
	</div>
	<div class="mt-4 rounded bg-green-50 p-4">
		<h3 class="mb-2 font-semibold text-green-800">Accessibility Features:</h3>
		<ul class="space-y-1 text-sm text-green-700">
			<li>• Proper keyboard navigation with Tab</li>
			<li>• Screen reader support</li>
			<li>• Focus indicators</li>
			<li>• Semantic HTML structure</li>
		</ul>
	</div>
</Story>
