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
	let mode: 'manual' | 'autonomous' = 'manual';
	let autonomousProgress: {
		visited: string[];
		currentPath: string[];
		foundPath: string[];
		error?: string;
	} = { visited: [], currentPath: [], foundPath: [] };
	let isAutonomousRunning = false;
	let autonomousError = '';

	function generateNodeId(): string {
		return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	function calculateNodePosition(level: number, index: number): { x: number; y: number } {
		const baseX = 200;
		const baseY = 200;
		const levelSpacing = 350;
		const nodeSpacing = 250;

		return {
			x: baseX + level * levelSpacing,
			y: baseY + index * nodeSpacing
		};
	}

	function calculateNodePositionFromParent(
		parentNodeId: string,
		level: number
	): { x: number; y: number } {
		const parentNode = pathState.nodes.get(parentNodeId);
		if (!parentNode) {
			// Fallback to grid positioning if no parent
			return calculateNodePosition(level, 0);
		}

		// Get grandparent to calculate direction
		let grandparentPosition: { x: number; y: number } | null = null;
		if (
			parentNode.parentId &&
			parentNode.parentId !== 'blank-start' &&
			parentNode.parentId !== 'blank-end'
		) {
			const grandparentNode = pathState.nodes.get(parentNode.parentId);
			if (grandparentNode) {
				grandparentPosition = grandparentNode.position;
			}
		}

		// Calculate direction from grandparent to parent (if available)
		let directionX = 1; // Default right direction
		let directionY = 0;

		if (grandparentPosition) {
			// Calculate direction from grandparent to parent
			const deltaX = parentNode.position.x - grandparentPosition.x;
			const deltaY = parentNode.position.y - grandparentPosition.y;
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

			if (distance > 0) {
				directionX = deltaX / distance;
				directionY = deltaY / distance;
			}
		} else if (parentNode.parentId === 'blank-start') {
			// Start nodes flow right
			directionX = 1;
			directionY = 0;
		} else if (parentNode.parentId === 'blank-end') {
			// End nodes flow left
			directionX = -1;
			directionY = 0;
		}

		// Calculate spacing based on level
		const baseSpacing = 400;
		const levelSpacing = baseSpacing + level * 50; // Increase spacing for deeper levels

		// Add some perpendicular offset to avoid overlap
		const perpendicularOffset = 100;
		const offsetX = -directionY * perpendicularOffset;
		const offsetY = directionX * perpendicularOffset;

		// Calculate new position
		const newX = parentNode.position.x + directionX * levelSpacing + offsetX;
		const newY = parentNode.position.y + directionY * levelSpacing + offsetY;

		// Ensure minimum spacing from parent
		const minSpacing = 350;
		const actualDistance = Math.sqrt(
			Math.pow(newX - parentNode.position.x, 2) + Math.pow(newY - parentNode.position.y, 2)
		);

		if (actualDistance < minSpacing) {
			const scale = minSpacing / actualDistance;
			return {
				x: parentNode.position.x + (newX - parentNode.position.x) * scale,
				y: parentNode.position.y + (newY - parentNode.position.y) * scale
			};
		}

		return { x: newX, y: newY };
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
			parentId: 'blank-start', // Connect to blank start node
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
			parentId: 'blank-end', // Connect to blank end node
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
		const position = calculateNodePositionFromParent(parentNodeId, level);

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

	async function startAutonomousPath() {
		if (!pathState.startUrl.trim() || !pathState.endUrl.trim()) return;
		isAutonomousRunning = true;
		autonomousProgress = { visited: [], currentPath: [], foundPath: [] };
		autonomousError = '';
		pathState.nodes = new Map();
		pathState.selectedNodeId = null;
		pathState = pathState;
		try {
			let nodeIdMap = new Map<string, string>();
			let nodeLevel = 0;
			for await (const event of LinkAnalysisService.autonomousPath({
				startUrl: pathState.startUrl,
				endUrl: pathState.endUrl,
				maxDepth: 3
			})) {
				if (event.event === 'visit') {
					autonomousProgress.visited.push(event.url);
					autonomousProgress.currentPath = event.path;
					// Add node to pathState if not present
					if (!nodeIdMap.has(event.url)) {
						const nodeId = generateNodeId();
						nodeIdMap.set(event.url, nodeId);
						const parentId =
							event.path.length > 1
								? (nodeIdMap.get(event.path[event.path.length - 2]) ?? 'blank-start')
								: 'blank-start';
						const position = calculateNodePosition(nodeLevel, nodeIdMap.size - 1);
						const node: PathNode = {
							id: nodeId,
							url: event.url,
							linkSummary: null,
							error: '',
							isLoading: false,
							parentId,
							level: nodeLevel,
							position,
							isStartNode: event.url === pathState.startUrl,
							isEndNode: event.url === pathState.endUrl
						};
						pathState.nodes.set(nodeId, node);
						pathState = pathState;
					}
					if (event.url === pathState.endUrl) {
						pathState.selectedNodeId = nodeIdMap.get(event.url) ?? null;
						pathState = pathState;
					}
				}
				if (event.event === 'found') {
					autonomousProgress.foundPath = event.path;
					isAutonomousRunning = false;
					break;
				}
				if (event.event === 'not_found') {
					isAutonomousRunning = false;
					break;
				}
				if (event.event === 'error') {
					autonomousError = event.error;
				}
			}
		} catch (err) {
			autonomousError = err instanceof Error ? err.message : String(err);
		} finally {
			isAutonomousRunning = false;
		}
	}
</script>

<div class="pathfinder-container">
	<div class="mode-toggle">
		<label>
			<input type="radio" bind:group={mode} value="manual" /> Manual
		</label>
		<label>
			<input type="radio" bind:group={mode} value="autonomous" /> Autonomous
		</label>
	</div>

	{#if mode === 'manual'}
		<!-- Manual mode UI (existing) -->
		<URLInput
			bind:startUrl={pathState.startUrl}
			bind:endUrl={pathState.endUrl}
			{isLoading}
			onAnalyzeStart={analyzeStartUrl}
			onAnalyzeEnd={analyzeEndUrl}
		/>
		<button on:click={clearPath}>Clear</button>
		<PathCanvas
			{pathState}
			onNodeSelect={selectNode}
			onLinkClick={analyzeLinkFromNode}
			onNodePositionUpdate={updateNodePosition}
		/>
	{/if}

	{#if mode === 'autonomous'}
		<!-- Autonomous mode UI -->
		<URLInput
			bind:startUrl={pathState.startUrl}
			bind:endUrl={pathState.endUrl}
			isLoading={isAutonomousRunning}
			onAnalyzeStart={startAutonomousPath}
			onAnalyzeEnd={startAutonomousPath}
		/>
		<button on:click={startAutonomousPath} disabled={isAutonomousRunning}
			>Start Autonomous Path</button
		>
		<button on:click={clearPath} disabled={isAutonomousRunning}>Clear</button>
		{#if isAutonomousRunning}
			<p>Autonomous path finding in progress...</p>
		{/if}
		{#if autonomousError}
			<p class="error">{autonomousError}</p>
		{/if}
		{#if autonomousProgress.foundPath.length > 0}
			<p>Path found:</p>
			<ol>
				{#each autonomousProgress.foundPath as url}
					<li>{url}</li>
				{/each}
			</ol>
		{:else if !isAutonomousRunning && pathState.startUrl && pathState.endUrl}
			<p>No path found.</p>
		{/if}
		<PathCanvas
			{pathState}
			onNodeSelect={selectNode}
			onLinkClick={() => {}}
			onNodePositionUpdate={updateNodePosition}
		/>
	{/if}

	<div class="controls">
		<button on:click={clearPath} class="clear-button"> Clear Path </button>
	</div>
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
