<script lang="ts">
	import URLInput from './URLInput.svelte';
	import PathCanvas from './PathCanvas.svelte';
	import type { PathState } from '$lib/types/linkAnalysis';
	import type { PathNode } from '$lib/types/linkAnalysis';
	import { LinkAnalysisService } from '$lib/services/linkAnalysisService';
	import { analyzeStartUrl, analyzeEndUrl, analyzeLinkFromNode } from '$lib/utils/nodeAnalysis';
	import {
		createInitialPathState,
		selectNode,
		updateNodePosition,
		clearPath
	} from '$lib/utils/pathStateManager';
	import { generateNodeId, calculateNodePosition } from '$lib/utils/nodePositioning';

	let pathState: PathState = createInitialPathState();

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

	// All utility functions moved to separate modules

	async function handleAnalyzeStartUrl() {
		isLoading = true;
		try {
			const result = await analyzeStartUrl(pathState);
			if (!result.success) {
				console.error('Failed to analyze start URL:', result.error);
			}
		} finally {
			pathState = { ...pathState }; // Trigger reactivity
			isLoading = false;
		}
	}

	async function handleAnalyzeEndUrl() {
		isLoading = true;
		try {
			const result = await analyzeEndUrl(pathState);
			if (!result.success) {
				console.error('Failed to analyze end URL:', result.error);
			}
		} finally {
			pathState = { ...pathState }; // Trigger reactivity
			isLoading = false;
		}
	}

	async function handleAnalyzeLinkFromNode(parentNodeId: string, linkUrl: string) {
		try {
			const result = await analyzeLinkFromNode(parentNodeId, linkUrl, pathState);
			if (!result.success) {
				console.error('Failed to analyze link:', result.error);
			}
		} finally {
			pathState = { ...pathState }; // Trigger reactivity
		}
	}

	function handleSelectNode(nodeId: string) {
		selectNode(nodeId, pathState);
		pathState = { ...pathState }; // Trigger reactivity
	}

	function handleUpdateNodePosition(nodeId: string, position: { x: number; y: number }) {
		updateNodePosition(nodeId, position, pathState);
		pathState = { ...pathState }; // Trigger reactivity
	}

	// Wrapper functions for PathCanvas component (maintains expected signatures)
	function selectNodeWrapper(nodeId: string) {
		handleSelectNode(nodeId);
	}

	function updateNodePositionWrapper(nodeId: string, position: { x: number; y: number }) {
		handleUpdateNodePosition(nodeId, position);
	}

	function handleClearPath() {
		pathState = clearPath(pathState);
	}

	async function startAutonomousPath() {
		if (!pathState.startUrl.trim() || !pathState.endUrl.trim()) return;
		isAutonomousRunning = true;
		autonomousProgress = { visited: [], currentPath: [], foundPath: [] };
		autonomousError = '';
		pathState.nodes = new Map();
		pathState.selectedNodeId = null;
		pathState = { ...pathState };
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
						pathState = { ...pathState };
					}
					if (event.url === pathState.endUrl) {
						pathState.selectedNodeId = nodeIdMap.get(event.url) ?? null;
						pathState = { ...pathState };
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
			onAnalyzeStart={handleAnalyzeStartUrl}
			onAnalyzeEnd={handleAnalyzeEndUrl}
		/>
		<button on:click={handleClearPath}>Clear</button>
		<PathCanvas
			{pathState}
			onNodeSelect={selectNodeWrapper}
			onLinkClick={handleAnalyzeLinkFromNode}
			onNodePositionUpdate={updateNodePositionWrapper}
			autonomousProgress={{ visited: [], currentPath: [], foundPath: [] }}
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
		<div class="autonomous-controls">
			<button
				class="start-autonomous-button"
				on:click={startAutonomousPath}
				disabled={isAutonomousRunning}
			>
				{isAutonomousRunning ? 'Finding Path...' : 'Start Autonomous Path'}
			</button>
		</div>

		{#if isAutonomousRunning}
			<div class="progress-indicator">
				<p>🔍 Autonomous path finding in progress...</p>
				<p class="progress-stats">
					Visited: {autonomousProgress.visited.length} URLs
				</p>
			</div>
		{/if}

		{#if autonomousError}
			<div class="error-message">
				<p>❌ {autonomousError}</p>
			</div>
		{/if}

		{#if autonomousProgress.foundPath.length > 0}
			<div class="path-found-section">
				<h3 class="path-found-title">🎯 Path Found!</h3>
				<div class="path-steps">
					{#each autonomousProgress.foundPath as url, index}
						<div class="path-step">
							<span class="step-number">{index + 1}</span>
							<span class="step-url">{url}</span>
						</div>
					{/each}
				</div>
			</div>
		{:else if !isAutonomousRunning && pathState.startUrl && pathState.endUrl && autonomousProgress.visited.length > 0}
			<div class="no-path-found">
				<p>❌ No path found between the specified URLs.</p>
				<p class="search-stats">Searched {autonomousProgress.visited.length} URLs</p>
			</div>
		{/if}

		<PathCanvas
			{pathState}
			onNodeSelect={selectNodeWrapper}
			onLinkClick={() => {}}
			onNodePositionUpdate={updateNodePositionWrapper}
			{autonomousProgress}
		/>
	{/if}

	<div class="controls">
		<button on:click={handleClearPath} class="clear-button"> Clear Path </button>
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

	.autonomous-controls {
		margin-top: 1rem;
		display: flex;
		justify-content: center;
	}

	.start-autonomous-button {
		padding: 0.75rem 1.5rem;
		background: #4f46e5;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.start-autonomous-button:hover:not(:disabled) {
		background: #4338ca;
	}

	.start-autonomous-button:disabled {
		background: #d1d5db;
		color: #6b7280;
		cursor: not-allowed;
	}

	.progress-indicator {
		margin-top: 1rem;
		padding: 1rem;
		background: #f3f4f6;
		border-radius: 0.5rem;
		text-align: center;
	}

	.progress-stats {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #4b5563;
	}

	.error-message {
		margin-top: 1rem;
		padding: 1rem;
		background: #fef3c7;
		border: 1px solid #fcd34d;
		border-radius: 0.5rem;
		color: #d97706;
	}

	.path-found-section {
		margin-top: 1rem;
		padding: 1rem;
		background: #ecfdf5;
		border: 1px solid #86efac;
		border-radius: 0.5rem;
	}

	.path-found-title {
		color: #065f46;
		margin-bottom: 0.5rem;
	}

	.path-steps {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.path-step {
		display: flex;
		align-items: center;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
		color: #374151;
	}

	.step-number {
		margin-right: 0.5rem;
		font-weight: 600;
		color: #10b981;
	}

	.step-url {
		font-family: monospace;
	}

	.no-path-found {
		margin-top: 1rem;
		padding: 1rem;
		background: #fef3f2;
		border: 1px solid #fca5a5;
		border-radius: 0.5rem;
		color: #991b1b;
	}

	.search-stats {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #991b1b;
	}
</style>
