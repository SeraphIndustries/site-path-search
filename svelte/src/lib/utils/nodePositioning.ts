import type { PathState } from '$lib/types/linkAnalysis';
import { checkPositionCollision } from './collisionDetection';

export function generateNodeId(): string {
	return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateNodePosition(level: number, index: number): { x: number; y: number } {
	const baseX = 5600; // Start far enough from the blank start node for proper clickability
	const baseY = 5000; // Same Y as blank nodes
	const levelSpacing = 350;
	const nodeSpacing = 250;

	return {
		x: baseX + level * levelSpacing,
		y: baseY + index * nodeSpacing
	};
}

// Find an optimal position using spiral search around ideal location
export function findOptimalPosition(
	idealX: number,
	idealY: number,
	pathState: PathState,
	excludeNodeId?: string
): { x: number; y: number } {
	// First try the ideal position
	if (!checkPositionCollision(idealX, idealY, pathState, excludeNodeId)) {
		return { x: idealX, y: idealY };
	}

	// Spiral search parameters
	const stepSize = 80;
	const maxRadius = 800; // Maximum search distance

	// Try positions in expanding spiral
	for (let radius = stepSize; radius <= maxRadius; radius += stepSize) {
		const positions = [];

		// Generate positions around a circle at current radius
		const numPositions = Math.max(8, Math.floor(radius / 40)); // More positions for larger radii
		for (let i = 0; i < numPositions; i++) {
			const angle = (i / numPositions) * 2 * Math.PI;
			const x = idealX + radius * Math.cos(angle);
			const y = idealY + radius * Math.sin(angle);
			positions.push({ x, y });
		}

		// Sort positions by distance from ideal location
		positions.sort((a, b) => {
			const distA = Math.sqrt((a.x - idealX) ** 2 + (a.y - idealY) ** 2);
			const distB = Math.sqrt((b.x - idealX) ** 2 + (b.y - idealY) ** 2);
			return distA - distB;
		});

		// Try each position at this radius
		for (const pos of positions) {
			if (!checkPositionCollision(pos.x, pos.y, pathState, excludeNodeId)) {
				return pos;
			}
		}
	}

	// Fallback: return ideal position even if it collides
	return { x: idealX, y: idealY };
}

export function calculateNodePositionFromParent(
	parentNodeId: string,
	level: number,
	pathState: PathState
): { x: number; y: number } {
	const parentNode = pathState.nodes.get(parentNodeId);
	if (!parentNode) {
		// Fallback to grid positioning if no parent
		return calculateNodePosition(level, 0);
	}

	// Get grandparent to calculate direction
	let grandparentPosition: { x: number; y: number } | null = null;
	if (
		parentNode.parentId &&
		parentNode.parentId !== 'blank-start' &&
		parentNode.parentId !== 'blank-end'
	) {
		const grandparentNode = pathState.nodes.get(parentNode.parentId);
		if (grandparentNode) {
			grandparentPosition = grandparentNode.position;
		}
	}

	// Calculate direction from grandparent to parent (if available)
	let directionX = 1; // Default right direction
	let directionY = 0;

	if (grandparentPosition) {
		// Calculate direction from grandparent to parent
		const deltaX = parentNode.position.x - grandparentPosition.x;
		const deltaY = parentNode.position.y - grandparentPosition.y;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		if (distance > 0) {
			directionX = deltaX / distance;
			directionY = deltaY / distance;
		}
	} else if (parentNode.isStartNode) {
		// Start nodes flow right
		directionX = 1;
		directionY = 0;
	} else if (parentNode.isEndNode) {
		// End nodes flow left
		directionX = -1;
		directionY = 0;
	}

	// Calculate spacing based on level - account for larger effective node area with previews
	const baseSpacing = 650; // Increased to account for screenshot previews
	const levelSpacing = baseSpacing + level * 50; // Increase spacing for deeper levels

	// Try multiple positions around the parent
	const positions = [];

	// Primary direction (continuing the flow)
	let primaryX = parentNode.position.x + directionX * levelSpacing;
	let primaryY = parentNode.position.y + directionY * levelSpacing;
	positions.push({ x: primaryX, y: primaryY, priority: 1 });

	// Perpendicular directions (branching out) - increased to account for screenshot previews
	const perpendicularOffsets = [250, -250, 450, -450];
	for (const offset of perpendicularOffsets) {
		const offsetX = -directionY * offset;
		const offsetY = directionX * offset;
		positions.push({
			x: primaryX + offsetX,
			y: primaryY + offsetY,
			priority: 2
		});
	}

	// Additional radial positions for more variety
	const radialAngles = [Math.PI / 4, -Math.PI / 4, (3 * Math.PI) / 4, (-3 * Math.PI) / 4];
	for (const angle of radialAngles) {
		const radialX = parentNode.position.x + levelSpacing * Math.cos(angle);
		const radialY = parentNode.position.y + levelSpacing * Math.sin(angle);
		positions.push({ x: radialX, y: radialY, priority: 3 });
	}

	// Sort by priority and try each position
	positions.sort((a, b) => a.priority - b.priority);

	for (const pos of positions) {
		// Ensure minimum spacing from parent - increased for screenshot previews
		const minSpacing = 450;
		const actualDistance = Math.sqrt(
			Math.pow(pos.x - parentNode.position.x, 2) + Math.pow(pos.y - parentNode.position.y, 2)
		);

		if (actualDistance < minSpacing) {
			const scale = minSpacing / actualDistance;
			pos.x = parentNode.position.x + (pos.x - parentNode.position.x) * scale;
			pos.y = parentNode.position.y + (pos.y - parentNode.position.y) * scale;
		}

		// Use optimal position finding for this candidate
		const optimalPos = findOptimalPosition(pos.x, pos.y, pathState);

		// If this position doesn't collide, use it
		if (!checkPositionCollision(optimalPos.x, optimalPos.y, pathState)) {
			return optimalPos;
		}
	}

	// Fallback: use the first position even if it collides
	const fallbackPos = positions[0];
	const minSpacing = 450;
	const actualDistance = Math.sqrt(
		Math.pow(fallbackPos.x - parentNode.position.x, 2) +
			Math.pow(fallbackPos.y - parentNode.position.y, 2)
	);

	if (actualDistance < minSpacing) {
		const scale = minSpacing / actualDistance;
		return {
			x: parentNode.position.x + (fallbackPos.x - parentNode.position.x) * scale,
			y: parentNode.position.y + (fallbackPos.y - parentNode.position.y) * scale
		};
	}

	return { x: fallbackPos.x, y: fallbackPos.y };
}
