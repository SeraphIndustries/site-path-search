<script lang="ts">
	import URLInput from './URLInput.svelte';
	import PathCanvas from './PathCanvas.svelte';
	import type { PathState, PathNode } from '$lib/types/linkAnalysis';
	import { LinkAnalysisService } from '$lib/services/linkAnalysisService';

	let pathState: PathState = {
		startUrl: '',
		endUrl: '',
		nodes: new Map(),
		selectedNodeId: null
	};

	let isLoading = false;

	function generateNodeId(): string {
		return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	function calculateNodePosition(level: number, index: number): { x: number; y: number } {
		const centerX = 5000;
		const centerY = 5000;
		const levelSpacing = 300;
		const nodeSpacing = 200;

		return {
			x: centerX + level * levelSpacing,
			y: centerY + index * nodeSpacing
		};
	}

	async function analyzeStartUrl() {
		if (!pathState.startUrl.trim()) return;

		isLoading = true;
		const nodeId = generateNodeId();
		const position = calculateNodePosition(0, 0);

		const node: PathNode = {
			id: nodeId,
			url: pathState.startUrl,
			linkSummary: null,
			error: '',
			isLoading: true,
			level: 0,
			position,
			isStartNode: true,
			isEndNode: false
		};

		pathState.nodes.set(nodeId, node);
		pathState.selectedNodeId = nodeId;
		pathState = pathState; // Trigger reactivity

		try {
			const linkSummary = await LinkAnalysisService.analyzeLinks(pathState.startUrl);
			node.linkSummary = linkSummary;
			node.isLoading = false;
		} catch (err) {
			node.error = err instanceof Error ? err.message : String(err);
			node.isLoading = false;
		} finally {
			pathState = pathState; // Trigger reactivity
			isLoading = false;
		}
	}

	async function analyzeEndUrl() {
		if (!pathState.endUrl.trim()) return;

		isLoading = true;
		const nodeId = generateNodeId();
		const position = calculateNodePosition(0, 1);

		const node: PathNode = {
			id: nodeId,
			url: pathState.endUrl,
			linkSummary: null,
			error: '',
			isLoading: true,
			level: 0,
			position,
			isStartNode: false,
			isEndNode: true
		};

		pathState.nodes.set(nodeId, node);
		pathState.selectedNodeId = nodeId;
		pathState = pathState; // Trigger reactivity

		try {
			const linkSummary = await LinkAnalysisService.analyzeLinks(pathState.endUrl);
			node.linkSummary = linkSummary;
			node.isLoading = false;
		} catch (err) {
			node.error = err instanceof Error ? err.message : String(err);
			node.isLoading = false;
		} finally {
			pathState = pathState; // Trigger reactivity
			isLoading = false;
		}
	}

	async function analyzeLinkFromNode(parentNodeId: string, linkUrl: string) {
		const parentNode = pathState.nodes.get(parentNodeId);
		if (!parentNode) return;

		// Check if we already have this URL analyzed
		for (const [id, node] of pathState.nodes) {
			if (node.url === linkUrl) {
				pathState.selectedNodeId = id;
				pathState = pathState;
				return;
			}
		}

		const nodeId = generateNodeId();
		const level = parentNode.level + 1;
		const levelNodes = Array.from(pathState.nodes.values()).filter((n) => n.level === level);
		const position = calculateNodePosition(level, levelNodes.length);

		const node: PathNode = {
			id: nodeId,
			url: linkUrl,
			linkSummary: null,
			error: '',
			isLoading: true,
			parentId: parentNodeId,
			level,
			position,
			isStartNode: false,
			isEndNode: false
		};

		pathState.nodes.set(nodeId, node);
		pathState.selectedNodeId = nodeId;
		pathState = pathState; // Trigger reactivity

		try {
			const linkSummary = await LinkAnalysisService.analyzeLinks(linkUrl);
			node.linkSummary = linkSummary;
			node.isLoading = false;
		} catch (err) {
			node.error = err instanceof Error ? err.message : String(err);
			node.isLoading = false;
		} finally {
			pathState = pathState; // Trigger reactivity
		}
	}

	function selectNode(nodeId: string) {
		pathState.selectedNodeId = nodeId;
		pathState = pathState;
	}

	function updateNodePosition(nodeId: string, position: { x: number; y: number }) {
		const node = pathState.nodes.get(nodeId);
		if (node) {
			node.position = position;
			pathState = pathState; // Trigger reactivity
		}
	}

	function clearPath() {
		pathState = {
			startUrl: '',
			endUrl: '',
			nodes: new Map(),
			selectedNodeId: null
		};
	}
</script>

<div class="pathfinder-container">
	<URLInput
		bind:startUrl={pathState.startUrl}
		bind:endUrl={pathState.endUrl}
		{isLoading}
		onAnalyzeStart={analyzeStartUrl}
		onAnalyzeEnd={analyzeEndUrl}
	/>

	<div class="controls">
		<button on:click={clearPath} class="clear-button"> Clear Path </button>
	</div>

	<PathCanvas
		{pathState}
		onNodeSelect={selectNode}
		onLinkClick={analyzeLinkFromNode}
		onNodePositionUpdate={updateNodePosition}
	/>
</div>

<style>
	.pathfinder-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.controls {
		margin-bottom: 1rem;
		display: flex;
		gap: 1rem;
	}

	.clear-button {
		padding: 0.5rem 1rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.clear-button:hover {
		background: #dc2626;
	}
</style>
