import type { PathState } from '$lib/types/linkAnalysis';

export interface Rectangle {
	x: number;
	y: number;
	width: number;
	height: number;
}

// Helper function to create a rectangle
export function createRectangle(x: number, y: number, width: number, height: number): Rectangle {
	return { x, y, width, height };
}

// Check if two rectangles collide with an optional margin
export function checkRectangleCollision(
	rect1: Rectangle,
	rect2: Rectangle,
	margin: number = 0
): boolean {
	return (
		rect1.x < rect2.x + rect2.width + margin &&
		rect1.x + rect1.width + margin > rect2.x &&
		rect1.y < rect2.y + rect2.height + margin &&
		rect1.y + rect1.height + margin > rect2.y
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

	// Create rectangle for the position we're checking
	const candidateRect = createRectangle(x, y, nodeWidth, nodeHeight);

	// Check collision with all existing real nodes
	for (const [nodeId, node] of pathState.nodes) {
		if (nodeId === excludeNodeId) continue;

		// Check collision with the node itself
		const nodeRect = createRectangle(node.position.x, node.position.y, nodeWidth, nodeHeight);
		if (checkRectangleCollision(candidateRect, nodeRect, margin)) {
			return true;
		}

		// Check collision with the node's screenshot preview (positioned to the left)
		const nodePreviewRect = createRectangle(
			node.position.x - 320, // 280px width + 40px gap
			node.position.y,
			previewWidth,
			previewHeight
		);

		if (checkRectangleCollision(candidateRect, nodePreviewRect, margin)) {
			return true;
		}

		// Also check if our screenshot preview would collide with existing nodes
		const ourPreviewRect = createRectangle(x - 320, y, previewWidth, previewHeight);

		if (checkRectangleCollision(ourPreviewRect, nodeRect, margin)) {
			return true;
		}

		// Check if our screenshot preview would collide with their screenshot preview
		if (checkRectangleCollision(ourPreviewRect, nodePreviewRect, margin)) {
			return true;
		}
	}

	// Check against blank nodes if they're visible
	const blankStartRect = createRectangle(4800, 5000, 300, 150); // Blank nodes are smaller
	const blankEndRect = createRectangle(5700, 5000, 300, 150);

	// Check blank start node if visible
	if (!Array.from(pathState.nodes.values()).some((n) => n.isStartNode)) {
		if (checkRectangleCollision(candidateRect, blankStartRect, margin)) {
			return true;
		}
	}

	// Check blank end node if visible
	if (!Array.from(pathState.nodes.values()).some((n) => n.isEndNode)) {
		if (checkRectangleCollision(candidateRect, blankEndRect, margin)) {
			return true;
		}
	}

	return false;
}
