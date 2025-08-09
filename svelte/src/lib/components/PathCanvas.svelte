<script lang="ts">
	import PathNode from './PathNode.svelte';
	import WebsitePreview from './WebsitePreview.svelte';
	import type { PathState, PathNode as PathNodeType } from '$lib/types/linkAnalysis';
	import {
		createCanvasState,
		initializeCanvasOffset,
		handleCanvasMouseDown,
		handleCanvasMouseMove,
		handleCanvasMouseUp,
		handleCanvasKeyDown,
		handleCanvasWheel,
		updateCanvasTransform,
		zoomIn,
		zoomOut,
		resetView,
		checkDarkMode,
		ZOOM_LIMITS,
		type CanvasState
	} from '$lib/utils/canvasOperations';
	import {
		calculateConnections,
		getConnectionOrigin,
		createBlankStartNode,
		createBlankEndNode
	} from '$lib/utils/connectionUtils';

	type AutonomousProgress = {
		visited: string[];
		currentPath: string[];
		foundPath: string[];
		error?: string;
	};

	export let pathState: PathState;
	export let onNodeSelect: (nodeId: string) => void;
	export let onLinkClick: (parentNodeId: string, linkUrl: string) => void;
	export let onNodePositionUpdate: (nodeId: string, position: { x: number; y: number }) => void;
	export let autonomousProgress: AutonomousProgress = {
		visited: [],
		currentPath: [],
		foundPath: []
	};

	let canvasContainer: HTMLDivElement;
	let canvasWrapper: HTMLDivElement;
	let canvasState: CanvasState = createCanvasState();

	function handleMouseDown(event: MouseEvent) {
		handleCanvasMouseDown(event, canvasContainer, canvasWrapper, canvasState);
	}

	function handleMouseMove(event: MouseEvent) {
		handleCanvasMouseMove(event, canvasState);
		if (canvasState.isDragging) {
			updateCanvasTransform(canvasContainer, canvasState);
		}
	}

	function handleMouseUp() {
		handleCanvasMouseUp(canvasState);
	}

	function handleKeyDown(event: KeyboardEvent) {
		handleCanvasKeyDown(event, canvasState);
		updateCanvasTransform(canvasContainer, canvasState);
		canvasState = { ...canvasState }; // Trigger reactivity
	}

	function handleWheel(event: WheelEvent) {
		handleCanvasWheel(event, canvasWrapper, canvasState);
		updateCanvasTransform(canvasContainer, canvasState);
		canvasState = { ...canvasState }; // Trigger reactivity
	}

	function handleZoomIn() {
		if (zoomIn(canvasState)) {
			updateCanvasTransform(canvasContainer, canvasState);
			canvasState = { ...canvasState }; // Trigger reactivity
		}
	}

	function handleZoomOut() {
		if (zoomOut(canvasState)) {
			updateCanvasTransform(canvasContainer, canvasState);
			canvasState = { ...canvasState }; // Trigger reactivity
		}
	}

	function handleResetView() {
		resetView(nodes, blankStartNode, blankEndNode, canvasWrapper, canvasState);
		updateCanvasTransform(canvasContainer, canvasState);
		canvasState = { ...canvasState }; // Trigger reactivity
	}

	// Check dark mode on mount and when it changes
	if (typeof window !== 'undefined') {
		const observer = new MutationObserver(() => {
			canvasState.isDark = checkDarkMode();
		});

		const mainContainer = document.querySelector('.main-container');
		if (mainContainer) {
			observer.observe(mainContainer, { attributes: true });
		}

		canvasState.isDark = checkDarkMode();

		// Initialize canvas offset after a short delay to ensure DOM is ready
		setTimeout(() => {
			handleResetView();
		}, 100);
	}

	$: nodes = Array.from(pathState.nodes.values());
	$: selectedNode = pathState.selectedNodeId ? pathState.nodes.get(pathState.selectedNodeId) : null;

	// Create blank start and end nodes - separated more for better visibility
	$: blankStartNode = createBlankStartNode();
	$: blankEndNode = createBlankEndNode();

	// Calculate connection points and preview positions
	$: connections = calculateConnections(
		nodes,
		pathState,
		blankStartNode,
		blankEndNode,
		autonomousProgress
	);

	// Sort nodes by level for proper z-index layering
	$: sortedNodes = [...nodes].sort((a, b) => a.level - b.level);
</script>

<div class="canvas-wrapper" class:dark={canvasState.isDark}>
	<div
		bind:this={canvasWrapper}
		class="canvas-viewport"
		role="button"
		tabindex="0"
		aria-label="Interactive path canvas - drag to pan, scroll to zoom, use arrow keys to navigate"
		on:mousedown={handleMouseDown}
		on:mousemove={handleMouseMove}
		on:mouseup={handleMouseUp}
		on:wheel={handleWheel}
		on:keydown={handleKeyDown}
	>
		<div bind:this={canvasContainer} class="path-canvas">
			<!-- Connection lines -->
			<svg class="connections" width="100%" height="100%">
				{#each connections as conn}
					<!-- Line from start to midpoint -->
					<line
						x1={conn.startX}
						y1={conn.startY}
						x2={conn.midX}
						y2={conn.midY}
						stroke={conn.isInPath
							? '#065f46'
							: conn.isStartConnection
								? canvasState.isDark
									? '#3b82f6'
									: '#1d4ed8'
								: conn.isEndConnection
									? canvasState.isDark
										? '#10b981'
										: '#047857'
									: canvasState.isDark
										? '#9ca3af'
										: '#6b7280'}
						stroke-width={conn.isInPath
							? '4'
							: conn.isStartConnection || conn.isEndConnection
								? '3'
								: '2'}
						marker-end={conn.isInPath
							? 'url(#arrowhead-green)'
							: conn.isStartConnection
								? 'url(#arrowhead-start)'
								: conn.isEndConnection
									? 'url(#arrowhead-end)'
									: 'url(#arrowhead)'}
						class:arrow-in-path={conn.isInPath}
						class:arrow-not-in-path={!conn.isInPath}
					/>
					<!-- Line from midpoint to end -->
					<line
						x1={conn.midX}
						y1={conn.midY}
						x2={conn.endX}
						y2={conn.endY}
						stroke={conn.isInPath
							? '#065f46'
							: conn.isStartConnection
								? canvasState.isDark
									? '#3b82f6'
									: '#1d4ed8'
								: conn.isEndConnection
									? canvasState.isDark
										? '#10b981'
										: '#047857'
									: canvasState.isDark
										? '#9ca3af'
										: '#6b7280'}
						stroke-width={conn.isInPath
							? '4'
							: conn.isStartConnection || conn.isEndConnection
								? '3'
								: '2'}
						class:arrow-in-path={conn.isInPath}
						class:arrow-not-in-path={!conn.isInPath}
					/>
				{/each}
				<defs>
					<marker
						id="arrowhead"
						markerWidth="20"
						markerHeight="16"
						refX="18"
						refY="8"
						orient="auto"
						markerUnits="userSpaceOnUse"
					>
						<polygon points="0 0, 20 8, 0 16" fill={canvasState.isDark ? '#9ca3af' : '#6b7280'} />
					</marker>
					<marker
						id="arrowhead-start"
						markerWidth="24"
						markerHeight="18"
						refX="22"
						refY="9"
						orient="auto"
						markerUnits="userSpaceOnUse"
					>
						<polygon points="0 0, 24 9, 0 18" fill={canvasState.isDark ? '#3b82f6' : '#1d4ed8'} />
					</marker>
					<marker
						id="arrowhead-end"
						markerWidth="24"
						markerHeight="18"
						refX="22"
						refY="9"
						orient="auto"
						markerUnits="userSpaceOnUse"
					>
						<polygon points="0 0, 24 9, 0 18" fill={canvasState.isDark ? '#10b981' : '#047857'} />
					</marker>
					<marker
						id="arrowhead-green"
						markerWidth="24"
						markerHeight="18"
						refX="22"
						refY="9"
						orient="auto"
						markerUnits="userSpaceOnUse"
					>
						<polygon points="0 0, 24 9, 0 18" fill="#065f46" />
					</marker>
				</defs>
			</svg>

			<!-- Website previews along connections (behind nodes) -->
			{#each connections as conn}
				<WebsitePreview
					url={conn.url}
					isDark={canvasState.isDark}
					position={conn.previewPosition}
					isVisible={true}
					isInPath={autonomousProgress &&
					autonomousProgress.foundPath &&
					autonomousProgress.foundPath.length > 0
						? autonomousProgress.foundPath.includes(conn.url)
						: true}
					isStartConnection={conn.isStartConnection}
					isEndConnection={conn.isEndConnection}
				/>
			{/each}

			<!-- Screenshot preview for start node -->
			{#each nodes.filter((n) => n.isStartNode) as startNode}
				<WebsitePreview
					url={startNode.url}
					isDark={canvasState.isDark}
					position={{ x: startNode.position.x - 320, y: startNode.position.y }}
					isVisible={true}
					isInPath={true}
					isStartConnection={true}
					isEndConnection={false}
				/>
			{/each}

			<!-- Screenshot preview for end node -->
			{#each nodes.filter((n) => n.isEndNode) as endNode}
				<WebsitePreview
					url={endNode.url}
					isDark={canvasState.isDark}
					position={{ x: endNode.position.x - 320, y: endNode.position.y }}
					isVisible={true}
					isInPath={true}
					isStartConnection={false}
					isEndConnection={true}
				/>
			{/each}

			<!-- Blank start and end nodes (only show if no actual start/end nodes exist) -->
			{#if !nodes.some((n) => n.isStartNode)}
				<PathNode
					node={blankStartNode}
					isDark={canvasState.isDark}
					isSelected={false}
					onSelect={() => {}}
					onLinkClick={() => {}}
					onPositionUpdate={() => {}}
					isInPath={true}
				/>
			{/if}
			{#if !nodes.some((n) => n.isEndNode)}
				<PathNode
					node={blankEndNode}
					isDark={canvasState.isDark}
					isSelected={false}
					onSelect={() => {}}
					onLinkClick={() => {}}
					onPositionUpdate={() => {}}
					isInPath={true}
				/>
			{/if}

			<!-- Path nodes sorted by level for proper z-index -->
			{#each sortedNodes as node (node.id)}
				<PathNode
					{node}
					isDark={canvasState.isDark}
					isSelected={node.id === pathState.selectedNodeId}
					onSelect={() => onNodeSelect(node.id)}
					onLinkClick={(linkUrl: string) => onLinkClick(node.id, linkUrl)}
					onPositionUpdate={(position: { x: number; y: number }) =>
						onNodePositionUpdate(node.id, position)}
					isInPath={autonomousProgress &&
					autonomousProgress.foundPath &&
					autonomousProgress.foundPath.length > 0
						? autonomousProgress.foundPath.includes(node.url)
						: true}
					connectionOrigin={getConnectionOrigin(node.id, pathState)}
				/>
			{/each}
		</div>
	</div>

	<!-- Canvas controls -->
	<div class="canvas-controls">
		<div class="zoom-controls">
			<button
				class="control-button"
				class:dark={canvasState.isDark}
				on:click={handleZoomOut}
				disabled={canvasState.zoom <= ZOOM_LIMITS.min}
			>
				−
			</button>
			<span class="zoom-level" class:dark={canvasState.isDark}
				>{Math.round(canvasState.zoom * 100)}%</span
			>
			<button
				class="control-button"
				class:dark={canvasState.isDark}
				on:click={handleZoomIn}
				disabled={canvasState.zoom >= ZOOM_LIMITS.max}
			>
				+
			</button>
		</div>
		<button class="control-button" class:dark={canvasState.isDark} on:click={handleResetView}>
			Reset View
		</button>
	</div>
</div>

<style>
	.canvas-wrapper {
		flex: 1;
		position: relative;
		overflow: hidden;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		background: #f9fafb;
		transition: all 0.3s ease;
	}

	.canvas-wrapper.dark {
		border-color: #374151;
		background: #1f2937;
	}

	.canvas-viewport {
		width: 100%;
		height: 100%;
		position: relative;
		cursor: grab;
		overflow: hidden;
	}

	.canvas-viewport:active {
		cursor: grabbing;
	}

	.path-canvas {
		width: 10000px;
		height: 10000px;
		position: absolute;
		top: -5000px;
		left: -5000px;
		transition: transform 0.1s ease;
		transform-origin: center;
		background:
			linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
		background-size: 50px 50px;
	}

	.canvas-wrapper.dark .path-canvas {
		background:
			linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
		background-size: 50px 50px;
	}

	.connections {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		z-index: 1;
		width: 100%;
		height: 100%;
	}

	.canvas-controls {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.zoom-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		padding: 0.25rem;
		backdrop-filter: blur(10px);
	}

	.canvas-wrapper.dark .zoom-controls {
		background: rgba(31, 41, 55, 0.9);
		border-color: #4b5563;
	}

	.control-button {
		padding: 0.5rem 0.75rem;
		background: #ffffff;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		color: #374151;
		font-weight: 600;
		min-width: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.control-button.dark {
		background: #374151;
		border-color: #4b5563;
		color: #f9fafb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.control-button:hover:not(:disabled) {
		background: #f3f4f6;
		border-color: #9ca3af;
	}

	.control-button.dark:hover:not(:disabled) {
		background: #4b5563;
		border-color: #6b7280;
	}

	.control-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.zoom-level {
		font-size: 0.75rem;
		font-weight: 600;
		color: #374151;
		min-width: 3rem;
		text-align: center;
	}

	.zoom-level.dark {
		color: #f9fafb;
	}

	.arrow-in-path {
		stroke: #065f46 !important;
		animation: pulse-green 1.2s infinite;
		opacity: 1 !important;
	}
	.arrow-not-in-path {
		opacity: 0.25;
		transition: opacity 0.2s;
	}
	@keyframes pulse-green {
		0% {
			filter: drop-shadow(0 0 0 #10b981);
		}
		50% {
			filter: drop-shadow(0 0 8px #10b981);
		}
		100% {
			filter: drop-shadow(0 0 0 #10b981);
		}
	}
</style>
