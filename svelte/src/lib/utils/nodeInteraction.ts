// Node interaction utilities
export interface NodeInteractionState {
	isExpanded: boolean;
	showAllLinks: boolean;
	linksToShow: number;
}

export function createNodeInteractionState(): NodeInteractionState {
	return {
		isExpanded: true, // Start expanded by default
		showAllLinks: false,
		linksToShow: 10
	};
}

export function toggleExpanded(state: NodeInteractionState): void {
	state.isExpanded = !state.isExpanded;
	if (!state.isExpanded) {
		state.showAllLinks = false; // Reset when collapsing
	}
}

export function showMoreLinks(state: NodeInteractionState): void {
	state.showAllLinks = true;
}

export function handleKeyboardInteraction(event: KeyboardEvent, onSelect: () => void): void {
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		onSelect();
	}
}

export function handleWheelScroll(event: WheelEvent): void {
	// Prevent the event from bubbling up to the canvas
	event.stopPropagation();

	const linksGrid = event.currentTarget as HTMLElement;
	linksGrid.scrollTop += event.deltaY;
}

export function getDisplayedLinks(
	regularLinks: string[] | undefined,
	showAllLinks: boolean,
	linksToShow: number
): string[] {
	if (!regularLinks) return [];

	return showAllLinks ? regularLinks : regularLinks.slice(0, linksToShow);
}
