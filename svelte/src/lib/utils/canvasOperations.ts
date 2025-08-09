import type { PathState, PathNode } from '$lib/types/linkAnalysis';

// Canvas state and operations
export interface CanvasState {
	isDragging: boolean;
	dragStart: { x: number; y: number };
	canvasOffset: { x: number; y: number };
	zoom: number;
	isDark: boolean;
}

export function createCanvasState(): CanvasState {
	return {
		isDragging: false,
		dragStart: { x: 0, y: 0 },
		canvasOffset: { x: 0, y: 0 },
		zoom: 1,
		isDark: false
	};
}

export const ZOOM_LIMITS = {
	min: 0.3,
	max: 3
} as const;

export function initializeCanvasOffset(
	canvasWrapper: HTMLDivElement,
	blankStartNode: PathNode,
	blankEndNode: PathNode,
	canvasState: CanvasState
): void {
	if (canvasWrapper) {
		const viewportRect = canvasWrapper.getBoundingClientRect();
		const centerX = (blankStartNode.position.x + blankEndNode.position.x) / 2;
		const centerY = (blankStartNode.position.y + blankEndNode.position.y) / 2;
		canvasState.canvasOffset.x = viewportRect.width / 2 - centerX;
		canvasState.canvasOffset.y = viewportRect.height / 2 - centerY;
	}
}

export function handleCanvasMouseDown(
	event: MouseEvent,
	canvasContainer: HTMLDivElement,
	canvasWrapper: HTMLDivElement,
	canvasState: CanvasState
): void {
	// Only handle canvas dragging if clicking on the canvas itself, not on nodes
	if (event.target === canvasContainer || event.target === canvasWrapper) {
		canvasState.isDragging = true;
		canvasState.dragStart = {
			x: event.clientX - canvasState.canvasOffset.x,
			y: event.clientY - canvasState.canvasOffset.y
		};
	}
}

export function handleCanvasMouseMove(event: MouseEvent, canvasState: CanvasState): void {
	if (canvasState.isDragging) {
		canvasState.canvasOffset.x = event.clientX - canvasState.dragStart.x;
		canvasState.canvasOffset.y = event.clientY - canvasState.dragStart.y;
	}
}

export function handleCanvasMouseUp(canvasState: CanvasState): void {
	canvasState.isDragging = false;
}

export function handleCanvasKeyDown(event: KeyboardEvent, canvasState: CanvasState): void {
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
				canvasState.canvasOffset.y += step;
				break;
			case 'ArrowDown':
				canvasState.canvasOffset.y -= step;
				break;
			case 'ArrowLeft':
				canvasState.canvasOffset.x += step;
				break;
			case 'ArrowRight':
				canvasState.canvasOffset.x -= step;
				break;
		}
	}
}

export function handleCanvasWheel(
	event: WheelEvent,
	canvasWrapper: HTMLDivElement,
	canvasState: CanvasState
): void {
	event.preventDefault();

	// Zoom with Ctrl+Wheel or just Wheel
	const delta = event.deltaY > 0 ? 0.9 : 1.1;
	const newZoom = Math.max(ZOOM_LIMITS.min, Math.min(ZOOM_LIMITS.max, canvasState.zoom * delta));

	if (newZoom !== canvasState.zoom) {
		// Get the viewport bounds (canvasWrapper, not the transformed container)
		const rect = canvasWrapper.getBoundingClientRect();

		// Calculate mouse position relative to the viewport
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		// Calculate the world position of the mouse before zoom
		const worldMouseX = (mouseX - canvasState.canvasOffset.x) / canvasState.zoom;
		const worldMouseY = (mouseY - canvasState.canvasOffset.y) / canvasState.zoom;

		// Update zoom
		canvasState.zoom = newZoom;

		// Calculate new offset to keep mouse position fixed in the viewport
		canvasState.canvasOffset.x = mouseX - worldMouseX * canvasState.zoom;
		canvasState.canvasOffset.y = mouseY - worldMouseY * canvasState.zoom;
	}
}

export function updateCanvasTransform(
	canvasContainer: HTMLDivElement,
	canvasState: CanvasState
): void {
	canvasContainer.style.transform = `translate(${canvasState.canvasOffset.x}px, ${canvasState.canvasOffset.y}px) scale(${canvasState.zoom})`;
}

export function zoomIn(canvasState: CanvasState): boolean {
	const newZoom = Math.min(ZOOM_LIMITS.max, canvasState.zoom * 1.2);
	if (newZoom !== canvasState.zoom) {
		canvasState.zoom = newZoom;
		return true;
	}
	return false;
}

export function zoomOut(canvasState: CanvasState): boolean {
	const newZoom = Math.max(ZOOM_LIMITS.min, canvasState.zoom / 1.2);
	if (newZoom !== canvasState.zoom) {
		canvasState.zoom = newZoom;
		return true;
	}
	return false;
}

export function resetView(
	nodes: PathNode[],
	blankStartNode: PathNode,
	blankEndNode: PathNode,
	canvasWrapper: HTMLDivElement | undefined,
	canvasState: CanvasState
): void {
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
			canvasState.canvasOffset.x = viewportRect.width / 2 - centerX + 5000;
			canvasState.canvasOffset.y = viewportRect.height / 2 - centerY + 5000;
		} else {
			// Fallback to center on blank nodes
			initializeCanvasOffset(canvasWrapper!, blankStartNode, blankEndNode, canvasState);
		}
	} else {
		// Fallback to center on blank nodes
		if (canvasWrapper) {
			initializeCanvasOffset(canvasWrapper, blankStartNode, blankEndNode, canvasState);
		}
	}

	canvasState.zoom = 0.8;
}

export function checkDarkMode(): boolean {
	const mainContainer = document.querySelector('.main-container');
	return mainContainer?.classList.contains('dark') || false;
}
