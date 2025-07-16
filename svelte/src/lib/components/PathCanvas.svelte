<script lang="ts">
	import PathNode from './PathNode.svelte';
	import type { PathState, PathNode as PathNodeType } from '$lib/types/linkAnalysis';

	export let pathState: PathState;
	export let onNodeSelect: (nodeId: string) => void;
	export let onLinkClick: (parentNodeId: string, linkUrl: string) => void;
	export let onNodePositionUpdate: (nodeId: string, position: { x: number; y: number }) => void;

	let canvasContainer: HTMLDivElement;
	let canvasWrapper: HTMLDivElement;
	let isDragging = false;
	let dragStart = { x: 0, y: 0 };
	let canvasOffset = { x: 0, y: 0 };
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
			// Calculate zoom center point
			const rect = canvasContainer.getBoundingClientRect();
			const centerX = event.clientX - rect.left;
			const centerY = event.clientY - rect.top;

			// Adjust offset to zoom towards mouse position
			const zoomRatio = newZoom / zoom;
			canvasOffset.x = centerX - (centerX - canvasOffset.x) * zoomRatio;
			canvasOffset.y = centerY - (centerY - canvasOffset.y) * zoomRatio;

			zoom = newZoom;
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
		canvasOffset = { x: 0, y: 0 };
		zoom = 1;
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
	}

	$: nodes = Array.from(pathState.nodes.values());
	$: selectedNode = pathState.selectedNodeId ? pathState.nodes.get(pathState.selectedNodeId) : null;
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
				{#each nodes as node}
					{#if node.parentId}
						{@const parentNode = pathState.nodes.get(node.parentId)}
						{#if parentNode}
							<line
								x1={parentNode.position.x + 150}
								y1={parentNode.position.y + 75}
								x2={node.position.x}
								y2={node.position.y + 75}
								stroke={isDark ? '#9ca3af' : '#6b7280'}
								stroke-width="2"
								marker-end="url(#arrowhead)"
							/>
						{/if}
					{/if}
				{/each}
				<defs>
					<marker
						id="arrowhead"
						markerWidth="10"
						markerHeight="7"
						refX="9"
						refY="3.5"
						orient="auto"
					>
						<polygon points="0 0, 10 3.5, 0 7" fill={isDark ? '#9ca3af' : '#6b7280'} />
					</marker>
				</defs>
			</svg>

			<!-- Path nodes -->
			{#each nodes as node (node.id)}
				<PathNode
					{node}
					{isDark}
					isSelected={node.id === pathState.selectedNodeId}
					onSelect={() => onNodeSelect(node.id)}
					onLinkClick={(linkUrl: string) => onLinkClick(node.id, linkUrl)}
					onPositionUpdate={(position: { x: number; y: number }) =>
						onNodePositionUpdate(node.id, position)}
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
</style>
