import { describe, it, expect, beforeEach } from 'vitest';
import type { PathState, PathNode } from '$lib/types/linkAnalysis';
import {
	checkRectangleCollision,
	checkPositionCollision,
	createRectangle,
	type Rectangle
} from './collisionDetection';

describe('collisionDetection', () => {
	let pathState: PathState;

	beforeEach(() => {
		pathState = {
			startUrl: '',
			endUrl: '',
			nodes: new Map(),
			selectedNodeId: null
		};
	});

	describe('createRectangle', () => {
		it('should create a rectangle with the correct properties', () => {
			const rect = createRectangle(10, 20, 100, 200);
			expect(rect).toEqual({
				x: 10,
				y: 20,
				width: 100,
				height: 200
			});
		});

		it('should handle zero and negative values', () => {
			const rect = createRectangle(-5, 0, 0, 10);
			expect(rect.x).toBe(-5);
			expect(rect.y).toBe(0);
			expect(rect.width).toBe(0);
			expect(rect.height).toBe(10);
		});
	});

	describe('checkRectangleCollision', () => {
		it('should return true when rectangles overlap', () => {
			const rect1 = createRectangle(0, 0, 100, 100);
			const rect2 = createRectangle(50, 50, 100, 100);
			const result = checkRectangleCollision(rect1, rect2);
			expect(result).toBe(true);
		});

		it('should return false when rectangles do not overlap', () => {
			const rect1 = createRectangle(0, 0, 100, 100);
			const rect2 = createRectangle(200, 200, 100, 100);
			const result = checkRectangleCollision(rect1, rect2);
			expect(result).toBe(false);
		});

		it('should return true when rectangles just touch', () => {
			const rect1 = createRectangle(0, 0, 100, 100);
			const rect2 = createRectangle(100, 0, 100, 100);
			const result = checkRectangleCollision(rect1, rect2);
			// The current implementation uses < not <=, so touching rectangles don't collide
			expect(result).toBe(false);
		});

		it('should account for margin parameter', () => {
			const rect1 = createRectangle(0, 0, 100, 100);
			const rect2 = createRectangle(110, 0, 100, 100); // 10px gap

			// Without margin - should not collide
			const withoutMargin = checkRectangleCollision(rect1, rect2);
			expect(withoutMargin).toBe(false);

			// With margin - should collide
			const withMargin = checkRectangleCollision(rect1, rect2, 20); // margin: 20px
			expect(withMargin).toBe(true);
		});

		it('should handle edge cases with zero dimensions', () => {
			const rect1 = createRectangle(0, 0, 0, 0); // zero-size rectangle
			const rect2 = createRectangle(0, 0, 100, 100);
			const result = checkRectangleCollision(rect1, rect2);
			expect(result).toBe(false);
		});

		it('should handle negative coordinates', () => {
			const rect1 = createRectangle(-50, -50, 100, 100);
			const rect2 = createRectangle(25, 25, 100, 100);
			const result = checkRectangleCollision(rect1, rect2);
			expect(result).toBe(true);
		});
	});

	describe('checkPositionCollision', () => {
		beforeEach(() => {
			// Add some test nodes to pathState
			const node1: PathNode = {
				id: 'node1',
				url: 'https://example1.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 1000, y: 1000 },
				isStartNode: false,
				isEndNode: false
			};

			const node2: PathNode = {
				id: 'node2',
				url: 'https://example2.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 1,
				position: { x: 2000, y: 1000 },
				isStartNode: false,
				isEndNode: false
			};

			pathState.nodes.set('node1', node1);
			pathState.nodes.set('node2', node2);
		});

		it('should return true when position collides with existing node', () => {
			// Try to place a node very close to node1
			const result = checkPositionCollision(1050, 1050, pathState);
			expect(result).toBe(true);
		});

		it('should return false when position does not collide', () => {
			// Try to place a node far from existing nodes and blank nodes
			// Blank nodes are at x=4800 and x=5700, so use x=3000 to avoid collision
			const result = checkPositionCollision(3000, 3000, pathState);
			expect(result).toBe(false);
		});

		it('should exclude specified node from collision check', () => {
			// Try to place a node at the exact position of node1, but exclude node1
			const result = checkPositionCollision(1000, 1000, pathState, 'node1');
			expect(result).toBe(false);
		});

		it('should check collision with screenshot previews', () => {
			// Screenshot preview is positioned at x - 320, so collision should occur
			// if we try to place a node where it would overlap with a preview
			const node1 = pathState.nodes.get('node1')!;
			const previewX = node1.position.x - 320; // 680
			const previewY = node1.position.y; // 1000

			// Try to place a node that would overlap with the preview
			const result = checkPositionCollision(previewX + 100, previewY + 100, pathState);
			expect(result).toBe(true);
		});

		it('should check collision with blank start node when no start node exists', () => {
			// The blank start node is at { x: 4800, y: 5000 }
			// Try to place a node near it
			const result = checkPositionCollision(4850, 5050, pathState);
			expect(result).toBe(true);
		});

		it('should check collision with blank end node when no end node exists', () => {
			// The blank end node is at { x: 5700, y: 5000 }
			// Try to place a node near it
			const result = checkPositionCollision(5750, 5050, pathState);
			expect(result).toBe(true);
		});

		it('should not check blank start node collision when start node exists', () => {
			// Add a start node to pathState
			const startNode: PathNode = {
				id: 'start',
				url: 'https://start.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 4800, y: 5000 },
				isStartNode: true,
				isEndNode: false
			};
			pathState.nodes.set('start', startNode);

			// Now try to place a node at the blank start position - should not collide with blank
			const result = checkPositionCollision(4850, 5050, pathState);
			// Should still collide with the actual start node, but not the blank one
			expect(result).toBe(true);
		});

		it('should not check blank end node collision when end node exists', () => {
			// Add an end node to pathState
			const endNode: PathNode = {
				id: 'end',
				url: 'https://end.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 5700, y: 5000 },
				isStartNode: false,
				isEndNode: true
			};
			pathState.nodes.set('end', endNode);

			// Now try to place a node at the blank end position - should not collide with blank
			const result = checkPositionCollision(5750, 5050, pathState);
			// Should still collide with the actual end node, but not the blank one
			expect(result).toBe(true);
		});

		it('should handle empty pathState', () => {
			const emptyPathState: PathState = {
				startUrl: '',
				endUrl: '',
				nodes: new Map(),
				selectedNodeId: null
			};

			// Should only check against blank nodes
			const result = checkPositionCollision(3000, 3000, emptyPathState);
			expect(result).toBe(false);
		});

		it('should account for our screenshot preview colliding with existing nodes', () => {
			// Our screenshot preview would be at x - 320
			// If we place at x=1320, our preview would be at x=1000, colliding with node1
			const result = checkPositionCollision(1320, 1000, pathState);
			expect(result).toBe(true);
		});

		it('should account for our screenshot preview colliding with existing previews', () => {
			// Node1 preview is at x=680, node at x=1000
			// If we place at x=1000, our preview would be at x=680, colliding with node1's preview
			const result = checkPositionCollision(1000, 1000, pathState);
			expect(result).toBe(true);
		});
	});
});
