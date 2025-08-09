import type { PathState } from '$lib/types/linkAnalysis';

// Check if a rectangular area collides with another rectangle
export function checkRectangleCollision(
	x1: number,
	y1: number,
	width1: number,
	height1: number,
	x2: number,
	y2: number,
	width2: number,
	height2: number,
	margin: number = 0
): boolean {
	return (
		x1 < x2 + width2 + margin &&
		x1 + width1 + margin > x2 &&
		y1 < y2 + height2 + margin &&
		y1 + height1 + margin > y2
	);
}

// Check if a position collides with existing nodes and their associated elements
export function checkPositionCollision(
	x: number,
	y: number,
	pathState: PathState,
	excludeNodeId?: string
): boolean {
	const nodeWidth = 500; // Expanded width
	const nodeHeight = 200; // More realistic height for expanded nodes
	const previewWidth = 280; // Screenshot preview width
	const previewHeight = 200; // Screenshot preview height
	const margin = 40; // Margin between elements

	// Check collision with all existing real nodes
	for (const [nodeId, node] of pathState.nodes) {
		if (nodeId === excludeNodeId) continue;

		// Check collision with the node itself
		if (
			checkRectangleCollision(
				x,
				y,
				nodeWidth,
				nodeHeight,
				node.position.x,
				node.position.y,
				nodeWidth,
				nodeHeight,
				margin
			)
		) {
			return true;
		}

		// Check collision with the node's screenshot preview (positioned to the left)
		const previewX = node.position.x - 320; // 280px width + 40px gap
		const previewY = node.position.y;

		if (
			checkRectangleCollision(
				x,
				y,
				nodeWidth,
				nodeHeight,
				previewX,
				previewY,
				previewWidth,
				previewHeight,
				margin
			)
		) {
			return true;
		}

		// Also check if our screenshot preview would collide with existing nodes
		const ourPreviewX = x - 320;
		const ourPreviewY = y;

		if (
			checkRectangleCollision(
				ourPreviewX,
				ourPreviewY,
				previewWidth,
				previewHeight,
				node.position.x,
				node.position.y,
				nodeWidth,
				nodeHeight,
				margin
			)
		) {
			return true;
		}

		// Check if our screenshot preview would collide with their screenshot preview
		if (
			checkRectangleCollision(
				ourPreviewX,
				ourPreviewY,
				previewWidth,
				previewHeight,
				previewX,
				previewY,
				previewWidth,
				previewHeight,
				margin
			)
		) {
			return true;
		}
	}

	// Check against blank nodes if they're visible
	const blankStartPos = { x: 4800, y: 5000 };
	const blankEndPos = { x: 5700, y: 5000 };
	const blankNodeWidth = 300; // Blank nodes are smaller
	const blankNodeHeight = 150;

	// Check blank start node if visible
	if (!Array.from(pathState.nodes.values()).some((n) => n.isStartNode)) {
		if (
			checkRectangleCollision(
				x,
				y,
				nodeWidth,
				nodeHeight,
				blankStartPos.x,
				blankStartPos.y,
				blankNodeWidth,
				blankNodeHeight,
				margin
			)
		) {
			return true;
		}
	}

	// Check blank end node if visible
	if (!Array.from(pathState.nodes.values()).some((n) => n.isEndNode)) {
		if (
			checkRectangleCollision(
				x,
				y,
				nodeWidth,
				nodeHeight,
				blankEndPos.x,
				blankEndPos.y,
				blankNodeWidth,
				blankNodeHeight,
				margin
			)
		) {
			return true;
		}
	}

	return false;
}
