import type { PathNode, PathState } from '$lib/types/linkAnalysis';

export interface Connection {
	nodeId: string;
	parentId: string;
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	midX: number;
	midY: number;
	previewPosition: { x: number; y: number };
	url: string;
	isStartConnection: boolean;
	isEndConnection: boolean;
	isInPath: boolean;
}

// Function to determine if a node ultimately originates from start or end by tracing parent chain
export function getConnectionOrigin(
	nodeId: string,
	pathState: PathState
): 'start' | 'end' | 'none' {
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

export function calculateConnections(
	nodes: PathNode[],
	pathState: PathState,
	blankStartNode: PathNode,
	blankEndNode: PathNode,
	autonomousProgress: {
		visited: string[];
		currentPath: string[];
		foundPath: string[];
		error?: string;
	}
): Connection[] {
	return nodes
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
			const connectionOrigin = getConnectionOrigin(node.id, pathState);
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
}

export function createBlankStartNode(): PathNode {
	return {
		id: 'blank-start',
		url: 'Enter start URL',
		linkSummary: null,
		kagiSearchSummary: null,
		error: '',
		isLoading: false,
		level: -1,
		position: { x: 4800, y: 5000 },
		isStartNode: true,
		isEndNode: false,
		isKagiSearchNode: false
	};
}

export function createBlankEndNode(): PathNode {
	return {
		id: 'blank-end',
		url: 'Enter end URL',
		linkSummary: null,
		kagiSearchSummary: null,
		error: '',
		isLoading: false,
		level: -1,
		position: { x: 5700, y: 5000 },
		isStartNode: false,
		isEndNode: true,
		isKagiSearchNode: false
	};
}
