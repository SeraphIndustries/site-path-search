<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PathNode from '$lib/components/PathNode.svelte';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Components/PathNode',
		component: PathNode,
		tags: ['autodocs'],
		argTypes: {
			nodeColor: {
				control: { type: 'select' },
				options: ['blue', 'green', 'purple', 'indigo', 'orange']
			},
			isSelected: {
				control: { type: 'boolean' }
			}
		},
		args: {
			onSelect: fn(),
			onLinkClick: fn(),
			onPositionUpdate: fn()
		}
	});

	const mockLinkSummary = {
		total_links: 15,
		main_text_links: 10,
		image_links_within_main_text: 3,
		regular_links_within_main_text: 7,
		other_links: 5,
		regular_links: [
			'https://docs.example.com',
			'https://api.example.com',
			'https://blog.example.com',
			'https://support.example.com',
			'https://community.example.com',
			'https://developers.example.com',
			'https://status.example.com',
			'https://careers.example.com',
			'https://about.example.com',
			'https://privacy.example.com'
		]
	};

	const mockNode = {
		id: 'node-123',
		url: 'https://example.com',
		linkSummary: mockLinkSummary,
		error: '',
		isLoading: false,
		level: 0,
		position: { x: 100, y: 100 },
		isStartNode: false,
		isEndNode: false
	};

	const mockStartNode = {
		...mockNode,
		id: 'start-node',
		url: 'https://start.example.com',
		level: -1,
		isStartNode: true
	};

	const mockEndNode = {
		...mockNode,
		id: 'end-node',
		url: 'https://end.example.com',
		level: -1,
		isEndNode: true
	};

	const mockLoadingNode = {
		...mockNode,
		id: 'loading-node',
		linkSummary: null,
		isLoading: true
	};

	const mockErrorNode = {
		...mockNode,
		id: 'error-node',
		linkSummary: null,
		isLoading: false,
		error: 'Failed to fetch data from this URL'
	};

	const mockManyLinksNode = {
		...mockNode,
		id: 'many-links-node',
		linkSummary: {
			...mockLinkSummary,
			total_links: 50,
			regular_links: Array.from({ length: 50 }, (_, i) => `https://link${i + 1}.example.com`)
		}
	};
</script>

<!-- Basic node states -->
<Story name="Default" args={{ node: mockNode, nodeColor: 'blue' }} />

<Story name="Start Node" args={{ node: mockStartNode, nodeColor: 'green' }} />

<Story name="End Node" args={{ node: mockEndNode, nodeColor: 'purple' }} />

<Story name="Selected" args={{ node: mockNode, nodeColor: 'blue', isSelected: true }} />

<Story name="Loading" args={{ node: mockLoadingNode, nodeColor: 'blue' }} />

<Story name="Error State" args={{ node: mockErrorNode, nodeColor: 'blue' }} />

<!-- Different colors -->
<Story name="Orange Color" args={{ node: mockNode, nodeColor: 'orange' }} />

<Story name="Indigo Color" args={{ node: mockNode, nodeColor: 'indigo' }} />

<!-- Special cases -->
<Story name="Many Links" args={{ node: mockManyLinksNode, nodeColor: 'blue' }} />

<Story
	name="No Links"
	args={{
		node: { ...mockNode, linkSummary: { ...mockLinkSummary, regular_links: [] } },
		nodeColor: 'blue'
	}}
/>

<Story
	name="Long URL"
	args={{
		node: {
			...mockNode,
			url: 'https://very-long-subdomain.example-with-many-parts.com/very/long/path/with/many/segments/and/parameters?param1=value1&param2=value2&param3=value3'
		},
		nodeColor: 'blue'
	}}
/>

<!-- Different levels -->
<Story name="Level 0" args={{ node: { ...mockNode, level: 0 }, nodeColor: 'blue' }} />

<Story name="Level 3" args={{ node: { ...mockNode, level: 3 }, nodeColor: 'blue' }} />

<Story name="Level 10" args={{ node: { ...mockNode, level: 10 }, nodeColor: 'blue' }} />

<!-- Interactive states -->
<Story name="Collapsed" args={{ node: mockNode, nodeColor: 'blue' }}>
	<PathNode {...args} />
	<p class="mt-4 text-sm text-gray-600">
		Click the expand button to toggle node content visibility
	</p>
</Story>

<Story
	name="Playground"
	args={{
		node: mockNode,
		nodeColor: 'blue',
		isSelected: false
	}}
>
	<PathNode {...args} />
	<div class="mt-4 rounded bg-gray-100 p-4">
		<h3 class="mb-2 font-semibold">Interactive Controls:</h3>
		<ul class="space-y-1 text-sm text-gray-600">
			<li>• Change color using the controls panel</li>
			<li>• Toggle selection state</li>
			<li>• Click expand/collapse button</li>
			<li>• Click on links to see interaction</li>
			<li>• Try dragging the node</li>
		</ul>
	</div>
</Story>
