<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PathCanvas from '$lib/components/PathCanvas.svelte';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Components/PathCanvas',
		component: PathCanvas,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen'
		},
		args: {
			onNodeSelect: fn(),
			onLinkClick: fn(),
			onNodePositionUpdate: fn()
		}
	});

	const mockLinkSummary = {
		total_links: 8,
		main_text_links: 5,
		image_links_within_main_text: 2,
		regular_links_within_main_text: 3,
		other_links: 3,
		regular_links: [
			'https://docs.example.com',
			'https://api.example.com',
			'https://blog.example.com'
		]
	};

	// Empty state
	const emptyPathState = {
		startUrl: '',
		endUrl: '',
		nodes: new Map(),
		selectedNodeId: null
	};

	// Single node state
	const singleNodeState = {
		startUrl: 'https://example.com',
		endUrl: '',
		nodes: new Map([
			[
				'node-1',
				{
					id: 'node-1',
					url: 'https://example.com',
					linkSummary: mockLinkSummary,
					error: '',
					isLoading: false,
					level: -1,
					position: { x: 5000, y: 5000 },
					isStartNode: true,
					isEndNode: false
				}
			]
		]),
		selectedNodeId: 'node-1'
	};

	// Multiple nodes with connections
	const connectedNodesState = {
		startUrl: 'https://example.com',
		endUrl: 'https://target.com',
		nodes: new Map([
			[
				'start-node',
				{
					id: 'start-node',
					url: 'https://example.com',
					linkSummary: mockLinkSummary,
					error: '',
					isLoading: false,
					level: -1,
					position: { x: 4800, y: 5000 },
					isStartNode: true,
					isEndNode: false
				}
			],
			[
				'middle-node',
				{
					id: 'middle-node',
					url: 'https://intermediate.com',
					linkSummary: mockLinkSummary,
					error: '',
					isLoading: false,
					level: 0,
					position: { x: 5200, y: 4800 },
					parentId: 'start-node',
					isStartNode: false,
					isEndNode: false
				}
			],
			[
				'end-node',
				{
					id: 'end-node',
					url: 'https://target.com',
					linkSummary: mockLinkSummary,
					error: '',
					isLoading: false,
					level: -1,
					position: { x: 5700, y: 5000 },
					isStartNode: false,
					isEndNode: true
				}
			]
		]),
		selectedNodeId: 'middle-node'
	};

	// Complex tree structure
	const complexTreeState = {
		startUrl: 'https://root.com',
		endUrl: '',
		nodes: new Map([
			[
				'root',
				{
					id: 'root',
					url: 'https://root.com',
					linkSummary: mockLinkSummary,
					error: '',
					isLoading: false,
					level: -1,
					position: { x: 4800, y: 5000 },
					isStartNode: true,
					isEndNode: false
				}
			],
			[
				'child-1',
				{
					id: 'child-1',
					url: 'https://child1.com',
					linkSummary: mockLinkSummary,
					error: '',
					isLoading: false,
					level: 0,
					position: { x: 5300, y: 4700 },
					parentId: 'root',
					isStartNode: false,
					isEndNode: false
				}
			],
			[
				'child-2',
				{
					id: 'child-2',
					url: 'https://child2.com',
					linkSummary: mockLinkSummary,
					error: '',
					isLoading: false,
					level: 0,
					position: { x: 5300, y: 5300 },
					parentId: 'root',
					isStartNode: false,
					isEndNode: false
				}
			],
			[
				'grandchild-1',
				{
					id: 'grandchild-1',
					url: 'https://grandchild1.com',
					linkSummary: mockLinkSummary,
					error: '',
					isLoading: false,
					level: 1,
					position: { x: 5800, y: 4600 },
					parentId: 'child-1',
					isStartNode: false,
					isEndNode: false
				}
			],
			[
				'grandchild-2',
				{
					id: 'grandchild-2',
					url: 'https://grandchild2.com',
					linkSummary: mockLinkSummary,
					error: '',
					isLoading: false,
					level: 1,
					position: { x: 5800, y: 4800 },
					parentId: 'child-1',
					isStartNode: false,
					isEndNode: false
				}
			]
		]),
		selectedNodeId: 'grandchild-1'
	};

	// Loading states
	const loadingNodesState = {
		startUrl: 'https://example.com',
		endUrl: '',
		nodes: new Map([
			[
				'loading-node',
				{
					id: 'loading-node',
					url: 'https://loading.com',
					linkSummary: null,
					error: '',
					isLoading: true,
					level: 0,
					position: { x: 5000, y: 5000 },
					isStartNode: false,
					isEndNode: false
				}
			]
		]),
		selectedNodeId: 'loading-node'
	};

	// Error states
	const errorNodesState = {
		startUrl: 'https://example.com',
		endUrl: '',
		nodes: new Map([
			[
				'error-node',
				{
					id: 'error-node',
					url: 'https://error.com',
					linkSummary: null,
					error: 'Failed to fetch URL content',
					isLoading: false,
					level: 0,
					position: { x: 5000, y: 5000 },
					isStartNode: false,
					isEndNode: false
				}
			]
		]),
		selectedNodeId: 'error-node'
	};

	// Autonomous progress simulation
	const autonomousProgress = {
		visited: ['https://example.com', 'https://intermediate.com'],
		currentPath: ['https://example.com', 'https://intermediate.com', 'https://target.com'],
		foundPath: ['https://example.com', 'https://intermediate.com', 'https://target.com']
	};
</script>

<!-- Basic states -->
<Story name="Empty Canvas" args={{ pathState: emptyPathState }}>
	<div style="height: 600px; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<p class="mt-4 text-sm text-gray-600">
		Empty canvas showing blank start and end nodes. Try zooming and panning.
	</p>
</Story>

<Story name="Single Node" args={{ pathState: singleNodeState }}>
	<div style="height: 600px; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<p class="mt-4 text-sm text-gray-600">
		Canvas with a single start node. The node should be centered and interactive.
	</p>
</Story>

<Story name="Connected Nodes" args={{ pathState: connectedNodesState }}>
	<div style="height: 600px; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<p class="mt-4 text-sm text-gray-600">
		Canvas showing start, intermediate, and end nodes with connections.
	</p>
</Story>

<Story name="Complex Tree" args={{ pathState: complexTreeState }}>
	<div style="height: 600px; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<p class="mt-4 text-sm text-gray-600">
		Complex tree structure with multiple levels and branches.
	</p>
</Story>

<!-- Special states -->
<Story name="Loading Nodes" args={{ pathState: loadingNodesState }}>
	<div style="height: 600px; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<p class="mt-4 text-sm text-gray-600">Canvas with nodes in loading state showing spinners.</p>
</Story>

<Story name="Error Nodes" args={{ pathState: errorNodesState }}>
	<div style="height: 600px; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<p class="mt-4 text-sm text-gray-600">Canvas with nodes displaying error states.</p>
</Story>

<Story
	name="With Autonomous Progress"
	args={{
		pathState: connectedNodesState,
		autonomousProgress
	}}
>
	<div style="height: 600px; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<p class="mt-4 text-sm text-gray-600">
		Canvas showing autonomous pathfinding progress with highlighted path.
	</p>
</Story>

<!-- Interactive demonstrations -->
<Story name="Zoom Controls Demo" args={{ pathState: connectedNodesState }}>
	<div style="height: 600px; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<div class="mt-4 rounded bg-gray-100 p-4">
		<h3 class="mb-2 font-semibold">Zoom Controls:</h3>
		<ul class="space-y-1 text-sm text-gray-600">
			<li>• Mouse wheel to zoom in/out</li>
			<li>• Ctrl + Mouse wheel for precise zoom</li>
			<li>• + and - keys for keyboard zoom</li>
			<li>• Double-click to reset view</li>
		</ul>
	</div>
</Story>

<Story name="Pan Controls Demo" args={{ pathState: complexTreeState }}>
	<div style="height: 600px; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<div class="mt-4 rounded bg-gray-100 p-4">
		<h3 class="mb-2 font-semibold">Pan Controls:</h3>
		<ul class="space-y-1 text-sm text-gray-600">
			<li>• Click and drag on empty canvas to pan</li>
			<li>• Arrow keys for keyboard panning</li>
			<li>• Shift + Arrow keys for faster panning</li>
			<li>• Space bar to reset to center</li>
		</ul>
	</div>
</Story>

<Story name="Node Interaction Demo" args={{ pathState: connectedNodesState }}>
	<div style="height: 600px; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<div class="mt-4 rounded bg-gray-100 p-4">
		<h3 class="mb-2 font-semibold">Node Interactions:</h3>
		<ul class="space-y-1 text-sm text-gray-600">
			<li>• Click node to select it</li>
			<li>• Drag nodes to reposition them</li>
			<li>• Expand/collapse nodes with the toggle button</li>
			<li>• Click links to create new connected nodes</li>
		</ul>
	</div>
</Story>

<!-- Responsive testing -->
<Story name="Small Canvas" args={{ pathState: connectedNodesState }}>
	<div style="height: 300px; width: 400px; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<p class="mt-4 text-sm text-gray-600">
		Canvas in a smaller container to test responsive behavior.
	</p>
</Story>

<Story name="Wide Canvas" args={{ pathState: complexTreeState }}>
	<div style="height: 400px; width: 100%; border: 1px solid #ccc;">
		<PathCanvas {...args} />
	</div>
	<p class="mt-4 text-sm text-gray-600">Wide canvas format to test horizontal layouts.</p>
</Story>

<!-- Playground -->
<Story name="Playground" args={{ pathState: connectedNodesState }}>
	<div style="height: 600px; border: 1px solid #ccc; position: relative;">
		<PathCanvas {...args} />
		<div
			style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.9); padding: 10px; border-radius: 4px; font-size: 12px;"
		>
			<div>Nodes: {args.pathState.nodes.size}</div>
			<div>Selected: {args.pathState.selectedNodeId || 'None'}</div>
		</div>
	</div>
	<div class="mt-4 rounded bg-gray-100 p-4">
		<h3 class="mb-2 font-semibold">Try these interactions:</h3>
		<div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
			<div>
				<strong>Canvas Controls:</strong>
				<ul class="mt-1 space-y-1">
					<li>• Zoom with mouse wheel</li>
					<li>• Pan by dragging canvas</li>
					<li>• Reset view with R key</li>
				</ul>
			</div>
			<div>
				<strong>Node Controls:</strong>
				<ul class="mt-1 space-y-1">
					<li>• Select nodes by clicking</li>
					<li>• Drag nodes to move them</li>
					<li>• Expand/collapse content</li>
				</ul>
			</div>
		</div>
	</div>
</Story>
