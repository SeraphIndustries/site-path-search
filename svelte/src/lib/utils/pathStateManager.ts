import type { PathState } from '$lib/types/linkAnalysis';

export function createInitialPathState(): PathState {
	return {
		startUrl: '',
		endUrl: '',
		nodes: new Map(),
		selectedNodeId: null
	};
}

export function selectNode(nodeId: string, pathState: PathState): void {
	pathState.selectedNodeId = nodeId;
}

export function updateNodePosition(
	nodeId: string,
	position: { x: number; y: number },
	pathState: PathState
): boolean {
	const node = pathState.nodes.get(nodeId);
	if (node) {
		node.position = position;
		return true;
	}
	return false;
}

export function clearPath(pathState: PathState): PathState {
	return {
		startUrl: '',
		endUrl: '',
		nodes: new Map(),
		selectedNodeId: null
	};
}

export function getNodesArray(pathState: PathState) {
	return Array.from(pathState.nodes.values());
}

export function getSelectedNode(pathState: PathState) {
	return pathState.selectedNodeId ? pathState.nodes.get(pathState.selectedNodeId) : null;
}
