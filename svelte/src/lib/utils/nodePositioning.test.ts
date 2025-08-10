import type { PathNode, PathState } from '$lib/types/linkAnalysis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	calculateNodePosition,
	calculateNodePositionFromParent,
	findOptimalPosition,
	generateNodeId
} from './nodePositioning';

// Mock the collision detection utility
vi.mock('./collisionDetection', () => ({
	checkPositionCollision: vi.fn()
}));

import { checkPositionCollision } from './collisionDetection';

describe('nodePositioning', () => {
	let pathState: PathState;

	beforeEach(() => {
		pathState = {
			startUrl: '',
			endUrl: '',
			nodes: new Map(),
			selectedNodeId: null
		};
		vi.clearAllMocks();
	});

	describe('generateNodeId', () => {
		it('should generate unique IDs', () => {
			const id1 = generateNodeId();
			const id2 = generateNodeId();

			expect(id1).toMatch(/^node_\d+_[a-z0-9]{9}$/);
			expect(id2).toMatch(/^node_\d+_[a-z0-9]{9}$/);
			expect(id1).not.toBe(id2);
		});

		it('should include timestamp in ID', () => {
			const beforeTime = Date.now();
			const id = generateNodeId();
			const afterTime = Date.now();

			const timestampPart = id.split('_')[1];
			const timestamp = parseInt(timestampPart);

			expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
			expect(timestamp).toBeLessThanOrEqual(afterTime);
		});

		it('should include random component in ID', () => {
			const id = generateNodeId();
			const randomPart = id.split('_')[2];

			expect(randomPart).toHaveLength(9);
			expect(randomPart).toMatch(/^[a-z0-9]+$/);
		});
	});

	describe('calculateNodePosition', () => {
		it('should calculate position based on level and index', () => {
			const position = calculateNodePosition(0, 0);

			expect(position).toEqual({ x: 5600, y: 5000 });
		});

		it('should space levels horizontally', () => {
			const level0 = calculateNodePosition(0, 0);
			const level1 = calculateNodePosition(1, 0);
			const level2 = calculateNodePosition(2, 0);

			expect(level1.x).toBe(level0.x + 350);
			expect(level2.x).toBe(level1.x + 350);
			expect(level0.y).toBe(level1.y);
			expect(level1.y).toBe(level2.y);
		});

		it('should space nodes vertically within same level', () => {
			const node0 = calculateNodePosition(0, 0);
			const node1 = calculateNodePosition(0, 1);
			const node2 = calculateNodePosition(0, 2);

			expect(node1.y).toBe(node0.y + 250);
			expect(node2.y).toBe(node1.y + 250);
			expect(node0.x).toBe(node1.x);
			expect(node1.x).toBe(node2.x);
		});

		it('should handle negative indices', () => {
			const position = calculateNodePosition(0, -1);

			expect(position).toEqual({ x: 5600, y: 4750 }); // 5000 + (-1) * 250
		});

		it('should handle large level and index values', () => {
			const position = calculateNodePosition(10, 5);

			expect(position).toEqual({
				x: 5600 + 10 * 350, // 9100
				y: 5000 + 5 * 250 // 6250
			});
		});
	});

	describe('findOptimalPosition', () => {
		beforeEach(() => {
			vi.mocked(checkPositionCollision).mockReturnValue(false);
		});

		it('should return ideal position when no collision', () => {
			vi.mocked(checkPositionCollision).mockReturnValue(false);

			const position = findOptimalPosition(100, 200, pathState);

			expect(position).toEqual({ x: 100, y: 200 });
			expect(checkPositionCollision).toHaveBeenCalledWith(100, 200, pathState, undefined);
		});

		it('should pass through excludeNodeId parameter', () => {
			vi.mocked(checkPositionCollision).mockReturnValue(false);

			findOptimalPosition(100, 200, pathState, 'node-123');

			expect(checkPositionCollision).toHaveBeenCalledWith(100, 200, pathState, 'node-123');
		});

		it('should find alternative position when ideal position collides', () => {
			// First call (ideal position) returns collision
			// Second call (spiral position) returns no collision
			vi.mocked(checkPositionCollision).mockReturnValueOnce(true).mockReturnValueOnce(false);

			const position = findOptimalPosition(100, 200, pathState);

			expect(position).not.toEqual({ x: 100, y: 200 });
			expect(checkPositionCollision).toHaveBeenCalledTimes(2);
		});

		it('should try spiral positions around ideal location', () => {
			// Mock collision detection to return true for first two calls, false for third
			vi.mocked(checkPositionCollision)
				.mockReturnValueOnce(true) // ideal position collides
				.mockReturnValueOnce(true) // first spiral position collides
				.mockReturnValueOnce(false); // second spiral position is free

			const position = findOptimalPosition(100, 200, pathState);

			// Should have tried multiple positions
			expect(checkPositionCollision).toHaveBeenCalledTimes(3);
			expect(position).not.toEqual({ x: 100, y: 200 });
		});

		it('should return ideal position as fallback when all positions collide', () => {
			vi.mocked(checkPositionCollision).mockReturnValue(true);

			const position = findOptimalPosition(100, 200, pathState);

			expect(position).toEqual({ x: 100, y: 200 });
		});

		it('should try positions at increasing radii', () => {
			// Mock collision for ideal and first few spiral positions
			let callCount = 0;
			vi.mocked(checkPositionCollision).mockImplementation(() => {
				callCount++;
				return callCount < 10; // First 9 calls collide, 10th doesn't
			});

			const position = findOptimalPosition(100, 200, pathState);

			expect(callCount).toBe(10);
			expect(position).not.toEqual({ x: 100, y: 200 });
		});
	});

	describe('calculateNodePositionFromParent', () => {
		let parentNode: PathNode;

		beforeEach(() => {
			parentNode = {
				id: 'parent-123',
				url: 'https://parent.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 1000, y: 1000 },
				isStartNode: false,
				isEndNode: false,
				kagiSearchSummary: null,
				isKagiSearchNode: false
			};
			pathState.nodes.set('parent-123', parentNode);
			vi.mocked(checkPositionCollision).mockReturnValue(false);
		});

		it('should fall back to grid positioning when parent not found', () => {
			const position = calculateNodePositionFromParent('non-existent', 1, pathState);

			// Should return same as calculateNodePosition(1, 0)
			expect(position).toEqual({ x: 5950, y: 5000 }); // 5600 + 1 * 350
		});

		it('should position child relative to parent', () => {
			const position = calculateNodePositionFromParent('parent-123', 1, pathState);

			// Should be positioned relative to parent
			expect(position.x).toBeGreaterThan(parentNode.position.x);
			expect(checkPositionCollision).toHaveBeenCalled();
		});

		it('should handle start node as parent', () => {
			parentNode.isStartNode = true;

			const position = calculateNodePositionFromParent('parent-123', 1, pathState);

			// Should flow right from start node
			expect(position.x).toBeGreaterThan(parentNode.position.x);
		});

		it('should handle end node as parent', () => {
			parentNode.isEndNode = true;

			const position = calculateNodePositionFromParent('parent-123', 1, pathState);

			// Should flow left from end node (negative direction)
			expect(position.x).toBeLessThan(parentNode.position.x);
		});

		it('should consider grandparent for direction calculation', () => {
			// Create grandparent -> parent -> child chain
			const grandparentNode: PathNode = {
				id: 'grandparent-123',
				url: 'https://grandparent.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 500, y: 1000 },
				isStartNode: false,
				isEndNode: false,
				kagiSearchSummary: null,
				isKagiSearchNode: false
			};

			parentNode.parentId = 'grandparent-123';
			pathState.nodes.set('grandparent-123', grandparentNode);

			const position = calculateNodePositionFromParent('parent-123', 1, pathState);

			// Should continue the direction from grandparent -> parent
			// Grandparent at x=500, parent at x=1000, so child should be further right
			expect(position.x).toBeGreaterThan(parentNode.position.x);
		});

		it('should increase spacing for deeper levels', () => {
			const level1Position = calculateNodePositionFromParent('parent-123', 1, pathState);

			// Test with higher level
			const level5Position = calculateNodePositionFromParent('parent-123', 5, pathState);

			// Higher levels should have more spacing
			const distance1 = Math.sqrt(
				Math.pow(level1Position.x - parentNode.position.x, 2) +
					Math.pow(level1Position.y - parentNode.position.y, 2)
			);

			const distance5 = Math.sqrt(
				Math.pow(level5Position.x - parentNode.position.x, 2) +
					Math.pow(level5Position.y - parentNode.position.y, 2)
			);

			expect(distance5).toBeGreaterThan(distance1);
		});

		it('should maintain minimum spacing from parent', () => {
			const position = calculateNodePositionFromParent('parent-123', 1, pathState);

			const distance = Math.sqrt(
				Math.pow(position.x - parentNode.position.x, 2) +
					Math.pow(position.y - parentNode.position.y, 2)
			);

			// Should maintain at least 450px minimum spacing
			expect(distance).toBeGreaterThanOrEqual(450);
		});

		it('should try multiple position candidates', () => {
			// Mock collision for first few positions
			let callCount = 0;
			vi.mocked(checkPositionCollision).mockImplementation(() => {
				callCount++;
				return callCount < 3; // First 2 positions collide, 3rd doesn't
			});

			const position = calculateNodePositionFromParent('parent-123', 1, pathState);

			expect(callCount).toBeGreaterThanOrEqual(3);
			expect(position).toBeDefined();
		});

		it('should handle blank-start and blank-end parent IDs', () => {
			parentNode.parentId = 'blank-start';

			const position = calculateNodePositionFromParent('parent-123', 1, pathState);

			// Should still work without throwing errors
			expect(position).toBeDefined();
			expect(typeof position.x).toBe('number');
			expect(typeof position.y).toBe('number');
		});

		it('should return fallback position when all positions collide', () => {
			vi.mocked(checkPositionCollision).mockReturnValue(true);

			const position = calculateNodePositionFromParent('parent-123', 1, pathState);

			// Should still return a valid position
			expect(position).toBeDefined();
			expect(typeof position.x).toBe('number');
			expect(typeof position.y).toBe('number');

			// Should maintain minimum distance from parent
			const distance = Math.sqrt(
				Math.pow(position.x - parentNode.position.x, 2) +
					Math.pow(position.y - parentNode.position.y, 2)
			);
			expect(distance).toBeGreaterThanOrEqual(450);
		});
	});
});
