import type { PathNode, PathState } from '$lib/types/linkAnalysis';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	clearPath,
	createInitialPathState,
	getNodesArray,
	getSelectedNode,
	selectNode,
	updateNodePosition
} from './pathStateManager';

describe('pathStateManager', () => {
	let pathState: PathState;
	let testNode: PathNode;

	beforeEach(() => {
		pathState = createInitialPathState();
		testNode = {
			id: 'test-node-123',
			url: 'https://test.com',
			linkSummary: {
				total_links: 5,
				main_text_links: 3,
				image_links_within_main_text: 1,
				regular_links_within_main_text: 2,
				other_links: 2,
				regular_links: ['https://link1.com', 'https://link2.com']
			},
			error: '',
			isLoading: false,
			level: 1,
			position: { x: 500, y: 600 },
			parentId: 'parent-node',
			isStartNode: false,
			isEndNode: false,
			kagiSearchSummary: null,
			isKagiSearchNode: false
		};
	});

	describe('createInitialPathState', () => {
		it('should create initial state with correct defaults', () => {
			const state = createInitialPathState();

			expect(state.startUrl).toBe('');
			expect(state.endUrl).toBe('');
			expect(state.nodes).toBeInstanceOf(Map);
			expect(state.nodes.size).toBe(0);
			expect(state.selectedNodeId).toBeNull();
		});

		it('should create a new Map instance each time', () => {
			const state1 = createInitialPathState();
			const state2 = createInitialPathState();

			expect(state1.nodes).not.toBe(state2.nodes);
		});
	});

	describe('selectNode', () => {
		it('should set selectedNodeId to the provided nodeId', () => {
			selectNode('test-node-123', pathState);

			expect(pathState.selectedNodeId).toBe('test-node-123');
		});

		it('should update selectedNodeId when called multiple times', () => {
			selectNode('node-1', pathState);
			expect(pathState.selectedNodeId).toBe('node-1');

			selectNode('node-2', pathState);
			expect(pathState.selectedNodeId).toBe('node-2');
		});

		it('should handle empty string nodeId', () => {
			selectNode('', pathState);

			expect(pathState.selectedNodeId).toBe('');
		});

		it('should handle null-like values', () => {
			selectNode(null as any, pathState);

			expect(pathState.selectedNodeId).toBeNull();
		});
	});

	describe('updateNodePosition', () => {
		beforeEach(() => {
			pathState.nodes.set(testNode.id, testNode);
		});

		it('should update position of existing node', () => {
			const newPosition = { x: 1000, y: 1200 };

			const result = updateNodePosition(testNode.id, newPosition, pathState);

			expect(result).toBe(true);
			expect(pathState.nodes.get(testNode.id)!.position).toEqual(newPosition);
		});

		it('should return false for non-existent node', () => {
			const newPosition = { x: 1000, y: 1200 };

			const result = updateNodePosition('non-existent', newPosition, pathState);

			expect(result).toBe(false);
		});

		it('should not modify other node properties', () => {
			const originalNode = { ...testNode };
			const newPosition = { x: 1000, y: 1200 };

			updateNodePosition(testNode.id, newPosition, pathState);

			const updatedNode = pathState.nodes.get(testNode.id)!;
			expect(updatedNode.id).toBe(originalNode.id);
			expect(updatedNode.url).toBe(originalNode.url);
			expect(updatedNode.linkSummary).toBe(originalNode.linkSummary);
			expect(updatedNode.error).toBe(originalNode.error);
			expect(updatedNode.isLoading).toBe(originalNode.isLoading);
			expect(updatedNode.level).toBe(originalNode.level);
			expect(updatedNode.parentId).toBe(originalNode.parentId);
			expect(updatedNode.isStartNode).toBe(originalNode.isStartNode);
			expect(updatedNode.isEndNode).toBe(originalNode.isEndNode);
		});

		it('should handle negative coordinates', () => {
			const newPosition = { x: -500, y: -300 };

			const result = updateNodePosition(testNode.id, newPosition, pathState);

			expect(result).toBe(true);
			expect(pathState.nodes.get(testNode.id)!.position).toEqual(newPosition);
		});

		it('should handle decimal coordinates', () => {
			const newPosition = { x: 123.456, y: 789.012 };

			const result = updateNodePosition(testNode.id, newPosition, pathState);

			expect(result).toBe(true);
			expect(pathState.nodes.get(testNode.id)!.position).toEqual(newPosition);
		});
	});

	describe('clearPath', () => {
		beforeEach(() => {
			pathState.startUrl = 'https://start.com';
			pathState.endUrl = 'https://end.com';
			pathState.nodes.set(testNode.id, testNode);
			pathState.selectedNodeId = testNode.id;
		});

		it('should return new state with cleared values', () => {
			const clearedState = clearPath(pathState);

			expect(clearedState.startUrl).toBe('');
			expect(clearedState.endUrl).toBe('');
			expect(clearedState.nodes).toBeInstanceOf(Map);
			expect(clearedState.nodes.size).toBe(0);
			expect(clearedState.selectedNodeId).toBeNull();
		});

		it('should not modify the original state', () => {
			const originalStartUrl = pathState.startUrl;
			const originalEndUrl = pathState.endUrl;
			const originalNodesSize = pathState.nodes.size;
			const originalSelectedNodeId = pathState.selectedNodeId;

			clearPath(pathState);

			expect(pathState.startUrl).toBe(originalStartUrl);
			expect(pathState.endUrl).toBe(originalEndUrl);
			expect(pathState.nodes.size).toBe(originalNodesSize);
			expect(pathState.selectedNodeId).toBe(originalSelectedNodeId);
		});

		it('should return a new Map instance', () => {
			const clearedState = clearPath(pathState);

			expect(clearedState.nodes).not.toBe(pathState.nodes);
		});
	});

	describe('getNodesArray', () => {
		it('should return empty array when no nodes exist', () => {
			const nodesArray = getNodesArray(pathState);

			expect(nodesArray).toEqual([]);
			expect(Array.isArray(nodesArray)).toBe(true);
		});

		it('should return array of all nodes', () => {
			const node1: PathNode = { ...testNode, id: 'node-1' };
			const node2: PathNode = { ...testNode, id: 'node-2' };
			const node3: PathNode = { ...testNode, id: 'node-3' };

			pathState.nodes.set('node-1', node1);
			pathState.nodes.set('node-2', node2);
			pathState.nodes.set('node-3', node3);

			const nodesArray = getNodesArray(pathState);

			expect(nodesArray).toHaveLength(3);
			expect(nodesArray).toContain(node1);
			expect(nodesArray).toContain(node2);
			expect(nodesArray).toContain(node3);
		});

		it('should return a new array instance', () => {
			pathState.nodes.set(testNode.id, testNode);

			const array1 = getNodesArray(pathState);
			const array2 = getNodesArray(pathState);

			expect(array1).not.toBe(array2);
			expect(array1).toEqual(array2);
		});

		it('should contain actual node objects, not copies', () => {
			pathState.nodes.set(testNode.id, testNode);

			const nodesArray = getNodesArray(pathState);

			expect(nodesArray[0]).toBe(testNode);
		});

		it('should maintain insertion order', () => {
			const node1: PathNode = { ...testNode, id: 'node-1', url: 'https://first.com' };
			const node2: PathNode = { ...testNode, id: 'node-2', url: 'https://second.com' };
			const node3: PathNode = { ...testNode, id: 'node-3', url: 'https://third.com' };

			pathState.nodes.set('node-1', node1);
			pathState.nodes.set('node-2', node2);
			pathState.nodes.set('node-3', node3);

			const nodesArray = getNodesArray(pathState);

			expect(nodesArray[0].url).toBe('https://first.com');
			expect(nodesArray[1].url).toBe('https://second.com');
			expect(nodesArray[2].url).toBe('https://third.com');
		});
	});

	describe('getSelectedNode', () => {
		beforeEach(() => {
			pathState.nodes.set(testNode.id, testNode);
		});

		it('should return null when no node is selected', () => {
			pathState.selectedNodeId = null;

			const selectedNode = getSelectedNode(pathState);

			expect(selectedNode).toBeNull();
		});

		it('should return null when selectedNodeId is undefined', () => {
			pathState.selectedNodeId = undefined as any;

			const selectedNode = getSelectedNode(pathState);

			expect(selectedNode).toBeNull();
		});

		it('should return the selected node when it exists', () => {
			pathState.selectedNodeId = testNode.id;

			const selectedNode = getSelectedNode(pathState);

			expect(selectedNode).toBe(testNode);
		});

		it('should return undefined when selectedNodeId does not match any node', () => {
			pathState.selectedNodeId = 'non-existent-node';

			const selectedNode = getSelectedNode(pathState);

			expect(selectedNode).toBeUndefined();
		});

		it('should return actual node object, not a copy', () => {
			pathState.selectedNodeId = testNode.id;

			const selectedNode = getSelectedNode(pathState);

			expect(selectedNode).toBe(testNode);
		});

		it('should handle empty string selectedNodeId', () => {
			pathState.selectedNodeId = '';

			const selectedNode = getSelectedNode(pathState);

			expect(selectedNode).toBeNull();
		});

		it('should work with multiple nodes but only return selected one', () => {
			const node1: PathNode = { ...testNode, id: 'node-1' };
			const node2: PathNode = { ...testNode, id: 'node-2' };

			pathState.nodes.set('node-1', node1);
			pathState.nodes.set('node-2', node2);
			pathState.selectedNodeId = 'node-2';

			const selectedNode = getSelectedNode(pathState);

			expect(selectedNode).toBe(node2);
			expect(selectedNode).not.toBe(node1);
		});
	});
});
