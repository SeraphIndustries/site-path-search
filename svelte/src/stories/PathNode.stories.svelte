<script module>
	import PathNode from '$lib/components/PathNode.svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Components/PathNode',
		component: PathNode,
		tags: ['autodocs'],
		parameters: {
			docs: {
				description: {
					component:
						'A visual node component that represents a website URL in the path finding interface. Each node displays link analysis information, supports selection states, and can be expanded/collapsed to show detailed link data. Nodes are draggable and support various visual states including loading, error, and different color themes.'
				}
			}
		},
		argTypes: {
			node: {
				description: 'The node data object containing URL, link summary, and state information',
				control: { type: 'object' },
				table: {
					category: 'Props',
					type: { summary: 'PathNode' },
					required: true
				}
			},
			isSelected: {
				description: 'Whether the node is currently selected',
				control: { type: 'boolean' },
				table: {
					category: 'Props',
					type: { summary: 'boolean' },
					defaultValue: { summary: 'false' }
				}
			},
			onSelect: {
				description: 'Callback function when the node is selected',
				action: 'node selected',
				table: {
					category: 'Events',
					type: { summary: 'function' }
				}
			},
			onLinkClick: {
				description: 'Callback function when a link within the node is clicked',
				action: 'link clicked',
				table: {
					category: 'Events',
					type: { summary: 'function' }
				}
			},
			onPositionUpdate: {
				description: 'Callback function when the node position changes',
				action: 'position updated',
				table: {
					category: 'Events',
					type: { summary: 'function' }
				}
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
			'https://community.example.com'
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
		isEndNode: false,
		isInPath: true
	};
</script>

<Story name="Default" args={{ node: mockNode, nodeColor: 'blue' }} />
