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

	export let isDark = false;

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
	<div class="mode-selector" class:dark={isDark}>
		<div class="mode-selector-header">
			<h3 class="mode-selector-title">Path Finding Mode</h3>
			<button
				class="clear-path-button"
				class:dark={isDark}
				on:click={handleClearPath}
				title="Clear current path"
			>
				🗑️ Clear Path
			</button>
		</div>
		<div class="mode-options">
			<label class="mode-option" class:active={mode === 'manual'} class:dark={isDark}>
				<input type="radio" bind:group={mode} value="manual" class="mode-radio" />
				<div class="mode-content">
					<div class="mode-icon">🔧</div>
					<div class="mode-text">
						<span class="mode-name">Manual</span>
						<span class="mode-description"
							>Click through links step-by-step to build your path manually</span
						>
					</div>
				</div>
			</label>
			<label class="mode-option" class:active={mode === 'autonomous'} class:dark={isDark}>
				<input type="radio" bind:group={mode} value="autonomous" class="mode-radio" />
				<div class="mode-content">
					<div class="mode-icon">🤖</div>
					<div class="mode-text">
						<span class="mode-name">Autonomous</span>
						<span class="mode-description"
							>AI automatically finds the shortest path between URLs</span
						>
					</div>
				</div>
			</label>
		</div>
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
</div>

<style>
	.pathfinder-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
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

	/* Mode Selector Styles */
	.mode-selector {
		margin-bottom: 2rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.mode-selector.dark {
		background: #1f2937;
		border-color: #374151;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
	}

	.mode-selector-header {
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.mode-selector-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #374151;
	}

	.mode-selector.dark .mode-selector-title {
		color: #f3f4f6;
	}

	.clear-path-button {
		padding: 0.5rem 1rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.clear-path-button:hover {
		background: #dc2626;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(239, 68, 68, 0.2);
	}

	.clear-path-button:active {
		transform: translateY(0);
	}

	.clear-path-button.dark {
		background: #7f1d1d;
		border: 1px solid #991b1b;
	}

	.clear-path-button.dark:hover {
		background: #991b1b;
		box-shadow: 0 4px 8px rgba(127, 29, 29, 0.3);
	}

	.mode-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.mode-option {
		position: relative;
		cursor: pointer;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1rem;
		background: #f9fafb;
		transition: all 0.2s ease;
		display: block;
	}

	.mode-option:hover {
		border-color: #3b82f6;
		background: #eff6ff;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
	}

	.mode-option.active {
		border-color: #3b82f6;
		background: #eff6ff;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.mode-option.dark {
		background: #374151;
		border-color: #4b5563;
	}

	.mode-option.dark:hover {
		border-color: #60a5fa;
		background: #1e3a8a;
	}

	.mode-option.dark.active {
		border-color: #60a5fa;
		background: #1e3a8a;
		box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
	}

	.mode-radio {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.mode-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.mode-icon {
		font-size: 1.5rem;
		line-height: 1;
		margin-top: 0.125rem;
	}

	.mode-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.mode-name {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
		line-height: 1.2;
	}

	.mode-option.dark .mode-name {
		color: #f3f4f6;
	}

	.mode-description {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.3;
	}

	.mode-option.dark .mode-description {
		color: #d1d5db;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.mode-options {
			grid-template-columns: 1fr;
		}

		.mode-content {
			align-items: center;
		}

		.mode-text {
			gap: 0.125rem;
		}

		.mode-name {
			font-size: 0.9rem;
		}

		.mode-description {
			font-size: 0.8rem;
		}

		.mode-selector-header {
			flex-direction: column;
			gap: 0.75rem;
			align-items: flex-start;
		}

		.clear-path-button {
			align-self: stretch;
			justify-content: center;
		}
	}
</style>
