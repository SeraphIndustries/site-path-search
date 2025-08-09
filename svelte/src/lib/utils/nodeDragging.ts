// Node dragging utilities
export interface DragState {
	isDragging: boolean;
	dragStart: { x: number; y: number };
}

export function createDragState(): DragState {
	return {
		isDragging: false,
		dragStart: { x: 0, y: 0 }
	};
}

export function startDrag(
	event: MouseEvent,
	nodePosition: { x: number; y: number },
	dragState: DragState
): boolean {
	// Only start dragging if clicking on the header or the node itself (not on buttons or content)
	const target = event.target as HTMLElement;
	if (
		target.closest('.expand-button') ||
		target.closest('.link-button') ||
		target.closest('.more-links')
	) {
		return false; // Don't drag if clicking on interactive elements
	}

	dragState.isDragging = true;
	dragState.dragStart = {
		x: event.clientX - nodePosition.x,
		y: event.clientY - nodePosition.y
	};
	event.stopPropagation();
	return true;
}

export function updateDragPosition(
	event: MouseEvent,
	dragState: DragState
): { x: number; y: number } | null {
	if (!dragState.isDragging) return null;

	return {
		x: event.clientX - dragState.dragStart.x,
		y: event.clientY - dragState.dragStart.y
	};
}

export function endDrag(dragState: DragState): void {
	dragState.isDragging = false;
}

export function setupGlobalDragListeners(
	dragState: DragState,
	onMouseMove: (event: MouseEvent) => void,
	onMouseUp: () => void
): () => void {
	function globalMouseMove(event: MouseEvent) {
		if (dragState.isDragging) {
			onMouseMove(event);
		}
	}

	function globalMouseUp() {
		if (dragState.isDragging) {
			onMouseUp();
			endDrag(dragState);
		}
	}

	if (typeof window !== 'undefined') {
		window.addEventListener('mousemove', globalMouseMove);
		window.addEventListener('mouseup', globalMouseUp);

		// Return cleanup function
		return () => {
			window.removeEventListener('mousemove', globalMouseMove);
			window.removeEventListener('mouseup', globalMouseUp);
		};
	}

	return () => {}; // No-op cleanup for SSR
}
