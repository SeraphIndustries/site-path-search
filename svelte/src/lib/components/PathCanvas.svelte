<script lang="ts">
	import PathNode from './PathNode.svelte';
	import WebsitePreview from './WebsitePreview.svelte';
	import type { PathState, PathNode as PathNodeType } from '$lib/types/linkAnalysis';

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
	let isDragging = false;
	let dragStart = { x: 0, y: 0 };
	let canvasOffset = { x: 0, y: 0 };

	// Initialize canvas offset to center on blank nodes
	function initializeCanvasOffset() {
		if (canvasWrapper) {
			const viewportRect = canvasWrapper.getBoundingClientRect();
			const centerX = (blankStartNode.position.x + blankEndNode.position.x) / 2;
			const centerY = (blankStartNode.position.y + blankEndNode.position.y) / 2;
			canvasOffset.x = viewportRect.width / 2 - centerX;
			canvasOffset.y = viewportRect.height / 2 - centerY;
			updateCanvasTransform();
		}
	}
	let isDark = false;
	let zoom = 1;
	const minZoom = 0.3;
	const maxZoom = 3;

	function checkDarkMode() {
		const mainContainer = document.querySelector('.main-container');
		isDark = mainContainer?.classList.contains('dark') || false;
	}

	function handleMouseDown(event: MouseEvent) {
		// Only handle canvas dragging if clicking on the canvas itself, not on nodes
		if (event.target === canvasContainer || event.target === canvasWrapper) {
			isDragging = true;
			dragStart = { x: event.clientX - canvasOffset.x, y: event.clientY - canvasOffset.y };
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (isDragging) {
			canvasOffset.x = event.clientX - dragStart.x;
			canvasOffset.y = event.clientY - dragStart.y;
			updateCanvasTransform();
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (
			event.key === 'ArrowUp' ||
			event.key === 'ArrowDown' ||
			event.key === 'ArrowLeft' ||
			event.key === 'ArrowRight'
		) {
			event.preventDefault();
			const step = event.shiftKey ? 50 : 20;
			switch (event.key) {
				case 'ArrowUp':
					canvasOffset.y += step;
					break;
				case 'ArrowDown':
					canvasOffset.y -= step;
					break;
				case 'ArrowLeft':
					canvasOffset.x += step;
					break;
				case 'ArrowRight':
					canvasOffset.x -= step;
					break;
			}
			updateCanvasTransform();
		}
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();

		// Zoom with Ctrl+Wheel or just Wheel
		const delta = event.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * delta));

		if (newZoom !== zoom) {
			// Get the viewport bounds (canvasWrapper, not the transformed container)
			const rect = canvasWrapper.getBoundingClientRect();

			// Calculate mouse position relative to the viewport
			const mouseX = event.clientX - rect.left;
			const mouseY = event.clientY - rect.top;

			// Calculate the world position of the mouse before zoom
			const worldMouseX = (mouseX - canvasOffset.x) / zoom;
			const worldMouseY = (mouseY - canvasOffset.y) / zoom;

			// Update zoom
			zoom = newZoom;

			// Calculate new offset to keep mouse position fixed in the viewport
			canvasOffset.x = mouseX - worldMouseX * zoom;
			canvasOffset.y = mouseY - worldMouseY * zoom;

			updateCanvasTransform();
		}
	}

	function updateCanvasTransform() {
		canvasContainer.style.transform = `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`;
	}

	function zoomIn() {
		const newZoom = Math.min(maxZoom, zoom * 1.2);
		if (newZoom !== zoom) {
			zoom = newZoom;
			updateCanvasTransform();
		}
	}

	function zoomOut() {
		const newZoom = Math.max(minZoom, zoom / 1.2);
		if (newZoom !== zoom) {
			zoom = newZoom;
			updateCanvasTransform();
		}
	}

	function resetView() {
		// Calculate the center of all nodes including visible blank nodes
		const visibleBlankNodes = [];
		if (!nodes.some((n) => n.isStartNode)) visibleBlankNodes.push(blankStartNode);
		if (!nodes.some((n) => n.isEndNode)) visibleBlankNodes.push(blankEndNode);
		const allNodes = [...visibleBlankNodes, ...nodes];

		if (allNodes.length > 0) {
			const minX = Math.min(...allNodes.map((n) => n.position.x));
			const maxX = Math.max(...allNodes.map((n) => n.position.x));
			const minY = Math.min(...allNodes.map((n) => n.position.y));
			const maxY = Math.max(...allNodes.map((n) => n.position.y));

			const centerX = (minX + maxX) / 2;
			const centerY = (minY + maxY) / 2;

			// Get the canvas viewport dimensions
			const viewportRect = canvasWrapper?.getBoundingClientRect();
			if (viewportRect) {
				// Center the view on the calculated center of nodes
				canvasOffset.x = viewportRect.width / 2 - centerX + 5000;
				canvasOffset.y = viewportRect.height / 2 - centerY + 5000;
			} else {
				// Fallback to center on blank nodes
				initializeCanvasOffset();
			}
		} else {
			// Fallback to center on blank nodes
			initializeCanvasOffset();
		}

		zoom = 0.8;
		updateCanvasTransform();
	}

	// Check dark mode on mount and when it changes
	if (typeof window !== 'undefined') {
		const observer = new MutationObserver(() => {
			checkDarkMode();
		});

		const mainContainer = document.querySelector('.main-container');
		if (mainContainer) {
			observer.observe(mainContainer, { attributes: true });
		}

		checkDarkMode();

		// Initialize canvas offset after a short delay to ensure DOM is ready
		setTimeout(() => {
			resetView();
		}, 100);
	}

	$: nodes = Array.from(pathState.nodes.values());
	$: selectedNode = pathState.selectedNodeId ? pathState.nodes.get(pathState.selectedNodeId) : null;

	// Create blank start and end nodes - separated more for better visibility
	$: blankStartNode = {
		id: 'blank-start',
		url: 'Enter start URL',
		linkSummary: null,
		error: '',
		isLoading: false,
		level: -1,
		position: { x: 4800, y: 5000 },
		isStartNode: true,
		isEndNode: false
	};

	$: blankEndNode = {
		id: 'blank-end',
		url: 'Enter end URL',
		linkSummary: null,
		error: '',
		isLoading: false,
		level: -1,
		position: { x: 5700, y: 5000 },
		isStartNode: false,
		isEndNode: true
	};

	// Calculate connection points and preview positions
	$: connections = nodes
		.filter((node) => node.parentId)
		.map((node) => {
			let parentPosition: { x: number; y: number };
			let parentId: string;
			let parentUrl: string;

			if (node.parentId === 'blank-start') {
				parentPosition = blankStartNode.position;
				parentId = 'blank-start';
				parentUrl = blankStartNode.url;
			} else if (node.parentId === 'blank-end') {
				parentPosition = blankEndNode.position;
				parentId = 'blank-end';
				parentUrl = blankEndNode.url;
			} else if (node.parentId) {
				const parentNode = pathState.nodes.get(node.parentId);
				if (!parentNode) return null;
				parentPosition = parentNode.position;
				parentId = parentNode.id;
				parentUrl = parentNode.url;
			} else {
				// This shouldn't happen with proper parentId setup, but handle gracefully
				return null;
			}

			// Connect to the center of the level indicator
			const headerPadding = 12; // 0.75rem = 12px
			const levelIndicatorHeight = 24; // Approximate height including padding
			const levelIndicatorWidth = 40; // Approximate width for level indicators

			// Start connection from center of parent's level indicator
			const startX = parentPosition.x + headerPadding + levelIndicatorWidth / 2;
			const startY = parentPosition.y + headerPadding + levelIndicatorHeight / 2;

			// End connection at center of child's level indicator
			const endX = node.position.x + headerPadding + levelIndicatorWidth / 2;
			const endY = node.position.y + headerPadding + levelIndicatorHeight / 2;

			// Calculate midpoint for arrow head positioning
			const midX = (startX + endX) / 2;
			const midY = (startY + endY) / 2;

			// Screenshot preview positioned to the left of the child node, aligned with top
			const previewX = node.position.x - 320; // 280px width + 40px gap
			const previewY = node.position.y;

			// Determine if this connection is on the found path
			let isInPath = false;
			if (
				autonomousProgress &&
				autonomousProgress.foundPath &&
				autonomousProgress.foundPath.length > 1
			) {
				const idx = autonomousProgress.foundPath.indexOf(parentUrl);
				if (idx !== -1 && autonomousProgress.foundPath[idx + 1] === node.url) {
					isInPath = true;
				}
			}

			// Determine connection origin by tracing the chain
			const connectionOrigin = getConnectionOrigin(node.id);
			const isStartConnection = connectionOrigin === 'start';
			const isEndConnection = connectionOrigin === 'end';

			return {
				nodeId: node.id,
				parentId,
				startX,
				startY,
				endX,
				endY,
				midX,
				midY,
				previewPosition: { x: previewX, y: previewY },
				url: node.url,
				isStartConnection,
				isEndConnection,
				isInPath
			};
		})
		.filter((conn): conn is NonNullable<typeof conn> => conn !== null);

	// Function to determine if a node ultimately originates from start or end by tracing parent chain
	function getConnectionOrigin(nodeId: string): 'start' | 'end' | 'none' {
		let currentNodeId = nodeId;
		let visited = new Set<string>(); // Prevent infinite loops

		while (currentNodeId && !visited.has(currentNodeId)) {
			visited.add(currentNodeId);

			if (currentNodeId === 'blank-start') return 'start';
			if (currentNodeId === 'blank-end') return 'end';

			const node = pathState.nodes.get(currentNodeId);
			if (!node) break;

			// Check if this node itself is a start or end node
			if (node.isStartNode) return 'start';
			if (node.isEndNode) return 'end';

			if (!node.parentId) break;
			currentNodeId = node.parentId;
		}

		return 'none';
	}

	// Sort nodes by level for proper z-index layering
	$: sortedNodes = [...nodes].sort((a, b) => a.level - b.level);
</script>

<div class="canvas-wrapper" class:dark={isDark}>
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
								? isDark
									? '#3b82f6'
									: '#1d4ed8'
								: conn.isEndConnection
									? isDark
										? '#10b981'
										: '#047857'
									: isDark
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
								? isDark
									? '#3b82f6'
									: '#1d4ed8'
								: conn.isEndConnection
									? isDark
										? '#10b981'
										: '#047857'
									: isDark
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
						<polygon points="0 0, 20 8, 0 16" fill={isDark ? '#9ca3af' : '#6b7280'} />
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
						<polygon points="0 0, 24 9, 0 18" fill={isDark ? '#3b82f6' : '#1d4ed8'} />
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
						<polygon points="0 0, 24 9, 0 18" fill={isDark ? '#10b981' : '#047857'} />
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
					{isDark}
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
					{isDark}
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
					{isDark}
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
					{isDark}
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
					{isDark}
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
					{isDark}
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
					connectionOrigin={getConnectionOrigin(node.id)}
				/>
			{/each}
		</div>
	</div>

	<!-- Canvas controls -->
	<div class="canvas-controls">
		<div class="zoom-controls">
			<button
				class="control-button"
				class:dark={isDark}
				on:click={zoomOut}
				disabled={zoom <= minZoom}
			>
				−
			</button>
			<span class="zoom-level" class:dark={isDark}>{Math.round(zoom * 100)}%</span>
			<button
				class="control-button"
				class:dark={isDark}
				on:click={zoomIn}
				disabled={zoom >= maxZoom}
			>
				+
			</button>
		</div>
		<button class="control-button" class:dark={isDark} on:click={resetView}> Reset View </button>
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
