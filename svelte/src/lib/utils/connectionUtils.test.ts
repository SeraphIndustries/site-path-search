import { describe, it, expect, beforeEach } from 'vitest';
import type { PathState, PathNode } from '$lib/types/linkAnalysis';
import {
	getConnectionOrigin,
	calculateConnections,
	createBlankStartNode,
	createBlankEndNode,
	type Connection
} from './connectionUtils';

describe('connectionUtils', () => {
	let pathState: PathState;

	beforeEach(() => {
		pathState = {
			startUrl: 'https://start.com',
			endUrl: 'https://end.com',
			nodes: new Map(),
			selectedNodeId: null
		};
	});

	describe('getConnectionOrigin', () => {
		it('should return "start" for blank-start node', () => {
			const result = getConnectionOrigin('blank-start', pathState);
			expect(result).toBe('start');
		});

		it('should return "end" for blank-end node', () => {
			const result = getConnectionOrigin('blank-end', pathState);
			expect(result).toBe('end');
		});

		it('should return "start" for nodes with isStartNode true', () => {
			const startNode: PathNode = {
				id: 'start-node',
				url: 'https://start.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 100, y: 100 },
				isStartNode: true,
				isEndNode: false
			};
			pathState.nodes.set('start-node', startNode);

			const result = getConnectionOrigin('start-node', pathState);
			expect(result).toBe('start');
		});

		it('should return "end" for nodes with isEndNode true', () => {
			const endNode: PathNode = {
				id: 'end-node',
				url: 'https://end.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 100, y: 100 },
				isStartNode: false,
				isEndNode: true
			};
			pathState.nodes.set('end-node', endNode);

			const result = getConnectionOrigin('end-node', pathState);
			expect(result).toBe('end');
		});

		it('should trace parent chain to find origin', () => {
			// Create a chain: start -> node1 -> node2 -> node3
			const startNode: PathNode = {
				id: 'start',
				url: 'https://start.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 100, y: 100 },
				isStartNode: true,
				isEndNode: false
			};

			const node1: PathNode = {
				id: 'node1',
				url: 'https://node1.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 200, y: 100 },
				parentId: 'start',
				isStartNode: false,
				isEndNode: false
			};

			const node2: PathNode = {
				id: 'node2',
				url: 'https://node2.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 1,
				position: { x: 300, y: 100 },
				parentId: 'node1',
				isStartNode: false,
				isEndNode: false
			};

			const node3: PathNode = {
				id: 'node3',
				url: 'https://node3.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 2,
				position: { x: 400, y: 100 },
				parentId: 'node2',
				isStartNode: false,
				isEndNode: false
			};

			pathState.nodes.set('start', startNode);
			pathState.nodes.set('node1', node1);
			pathState.nodes.set('node2', node2);
			pathState.nodes.set('node3', node3);

			const result = getConnectionOrigin('node3', pathState);
			expect(result).toBe('start');
		});

		it('should return "none" for nodes without parent chain to start/end', () => {
			const orphanNode: PathNode = {
				id: 'orphan',
				url: 'https://orphan.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 100, y: 100 },
				isStartNode: false,
				isEndNode: false
			};
			pathState.nodes.set('orphan', orphanNode);

			const result = getConnectionOrigin('orphan', pathState);
			expect(result).toBe('none');
		});

		it('should handle circular references safely', () => {
			const node1: PathNode = {
				id: 'node1',
				url: 'https://node1.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 100, y: 100 },
				parentId: 'node2',
				isStartNode: false,
				isEndNode: false
			};

			const node2: PathNode = {
				id: 'node2',
				url: 'https://node2.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 1,
				position: { x: 200, y: 100 },
				parentId: 'node1',
				isStartNode: false,
				isEndNode: false
			};

			pathState.nodes.set('node1', node1);
			pathState.nodes.set('node2', node2);

			const result = getConnectionOrigin('node1', pathState);
			expect(result).toBe('none');
		});

		it('should return "none" for non-existent node', () => {
			const result = getConnectionOrigin('non-existent', pathState);
			expect(result).toBe('none');
		});
	});

	describe('calculateConnections', () => {
		let blankStartNode: PathNode;
		let blankEndNode: PathNode;
		let autonomousProgress: {
			visited: string[];
			currentPath: string[];
			foundPath: string[];
			error?: string;
		};

		beforeEach(() => {
			blankStartNode = createBlankStartNode();
			blankEndNode = createBlankEndNode();
			autonomousProgress = {
				visited: [],
				currentPath: [],
				foundPath: []
			};
		});

		it('should return empty array when no nodes have parents', () => {
			const nodes: PathNode[] = [
				{
					id: 'node1',
					url: 'https://node1.com',
					linkSummary: null,
					error: '',
					isLoading: false,
					level: 0,
					position: { x: 100, y: 100 },
					isStartNode: false,
					isEndNode: false
				}
			];

			const connections = calculateConnections(
				nodes,
				pathState,
				blankStartNode,
				blankEndNode,
				autonomousProgress
			);

			expect(connections).toEqual([]);
		});

		it('should calculate connection from blank start node', () => {
			const node1: PathNode = {
				id: 'node1',
				url: 'https://node1.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 500, y: 500 },
				parentId: 'blank-start',
				isStartNode: false,
				isEndNode: false
			};

			// Add node to pathState so getConnectionOrigin can find it
			pathState.nodes.set('node1', node1);

			const nodes = [node1];

			const connections = calculateConnections(
				nodes,
				pathState,
				blankStartNode,
				blankEndNode,
				autonomousProgress
			);

			expect(connections).toHaveLength(1);
			expect(connections[0]).toMatchObject({
				nodeId: 'node1',
				parentId: 'blank-start',
				url: 'https://node1.com',
				isStartConnection: true,
				isEndConnection: false,
				isInPath: false
			});

			// Check coordinate calculations
			expect(connections[0].startX).toBe(blankStartNode.position.x + 12 + 20); // 4832
			expect(connections[0].startY).toBe(blankStartNode.position.y + 12 + 12); // 5024
			expect(connections[0].endX).toBe(node1.position.x + 12 + 20); // 532
			expect(connections[0].endY).toBe(node1.position.y + 12 + 12); // 524
		});

		it('should calculate connection from blank end node', () => {
			const node1: PathNode = {
				id: 'node1',
				url: 'https://node1.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 500, y: 500 },
				parentId: 'blank-end',
				isStartNode: false,
				isEndNode: false
			};

			// Add node to pathState so getConnectionOrigin can find it
			pathState.nodes.set('node1', node1);

			const nodes = [node1];

			const connections = calculateConnections(
				nodes,
				pathState,
				blankStartNode,
				blankEndNode,
				autonomousProgress
			);

			expect(connections).toHaveLength(1);
			expect(connections[0]).toMatchObject({
				nodeId: 'node1',
				parentId: 'blank-end',
				url: 'https://node1.com',
				isStartConnection: false,
				isEndConnection: true,
				isInPath: false
			});
		});

		it('should calculate connection between regular nodes', () => {
			const parentNode: PathNode = {
				id: 'parent',
				url: 'https://parent.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 200, y: 300 },
				isStartNode: false,
				isEndNode: false
			};

			const childNode: PathNode = {
				id: 'child',
				url: 'https://child.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 1,
				position: { x: 400, y: 500 },
				parentId: 'parent',
				isStartNode: false,
				isEndNode: false
			};

			pathState.nodes.set('parent', parentNode);
			const nodes = [childNode];

			const connections = calculateConnections(
				nodes,
				pathState,
				blankStartNode,
				blankEndNode,
				autonomousProgress
			);

			expect(connections).toHaveLength(1);
			expect(connections[0]).toMatchObject({
				nodeId: 'child',
				parentId: 'parent',
				url: 'https://child.com'
			});

			// Check coordinate calculations
			expect(connections[0].startX).toBe(parentNode.position.x + 12 + 20); // 232
			expect(connections[0].startY).toBe(parentNode.position.y + 12 + 12); // 324
			expect(connections[0].endX).toBe(childNode.position.x + 12 + 20); // 432
			expect(connections[0].endY).toBe(childNode.position.y + 12 + 12); // 524
		});

		it('should calculate midpoint correctly', () => {
			const parentNode: PathNode = {
				id: 'parent',
				url: 'https://parent.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 0, y: 0 },
				isStartNode: false,
				isEndNode: false
			};

			const childNode: PathNode = {
				id: 'child',
				url: 'https://child.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 1,
				position: { x: 200, y: 400 },
				parentId: 'parent',
				isStartNode: false,
				isEndNode: false
			};

			pathState.nodes.set('parent', parentNode);
			const nodes = [childNode];

			const connections = calculateConnections(
				nodes,
				pathState,
				blankStartNode,
				blankEndNode,
				autonomousProgress
			);

			const startX = 32; // 0 + 12 + 20
			const startY = 24; // 0 + 12 + 12
			const endX = 232; // 200 + 12 + 20
			const endY = 424; // 400 + 12 + 12

			expect(connections[0].midX).toBe((startX + endX) / 2);
			expect(connections[0].midY).toBe((startY + endY) / 2);
		});

		it('should calculate preview position correctly', () => {
			const childNode: PathNode = {
				id: 'child',
				url: 'https://child.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 1,
				position: { x: 500, y: 600 },
				parentId: 'blank-start',
				isStartNode: false,
				isEndNode: false
			};

			const nodes = [childNode];

			const connections = calculateConnections(
				nodes,
				pathState,
				blankStartNode,
				blankEndNode,
				autonomousProgress
			);

			expect(connections[0].previewPosition).toEqual({
				x: childNode.position.x - 320, // 180
				y: childNode.position.y // 600
			});
		});

		it('should mark connections as in path when they exist in foundPath', () => {
			autonomousProgress.foundPath = [
				'https://parent.com',
				'https://child.com',
				'https://grandchild.com'
			];

			const parentNode: PathNode = {
				id: 'parent',
				url: 'https://parent.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 100, y: 100 },
				isStartNode: false,
				isEndNode: false
			};

			const childNode: PathNode = {
				id: 'child',
				url: 'https://child.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 1,
				position: { x: 200, y: 200 },
				parentId: 'parent',
				isStartNode: false,
				isEndNode: false
			};

			pathState.nodes.set('parent', parentNode);
			const nodes = [childNode];

			const connections = calculateConnections(
				nodes,
				pathState,
				blankStartNode,
				blankEndNode,
				autonomousProgress
			);

			expect(connections[0].isInPath).toBe(true);
		});

		it('should not mark connections as in path when they do not exist in foundPath', () => {
			autonomousProgress.foundPath = ['https://other.com', 'https://different.com'];

			const parentNode: PathNode = {
				id: 'parent',
				url: 'https://parent.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 100, y: 100 },
				isStartNode: false,
				isEndNode: false
			};

			const childNode: PathNode = {
				id: 'child',
				url: 'https://child.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 1,
				position: { x: 200, y: 200 },
				parentId: 'parent',
				isStartNode: false,
				isEndNode: false
			};

			pathState.nodes.set('parent', parentNode);
			const nodes = [childNode];

			const connections = calculateConnections(
				nodes,
				pathState,
				blankStartNode,
				blankEndNode,
				autonomousProgress
			);

			expect(connections[0].isInPath).toBe(false);
		});

		it('should filter out null connections when parent not found', () => {
			const childNode: PathNode = {
				id: 'child',
				url: 'https://child.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 1,
				position: { x: 200, y: 200 },
				parentId: 'non-existent-parent',
				isStartNode: false,
				isEndNode: false
			};

			const nodes = [childNode];

			const connections = calculateConnections(
				nodes,
				pathState,
				blankStartNode,
				blankEndNode,
				autonomousProgress
			);

			expect(connections).toEqual([]);
		});
	});

	describe('createBlankStartNode', () => {
		it('should create blank start node with correct properties', () => {
			const node = createBlankStartNode();

			expect(node).toMatchObject({
				id: 'blank-start',
				url: 'Enter start URL',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 4800, y: 5000 },
				isStartNode: true,
				isEndNode: false
			});
		});
	});

	describe('createBlankEndNode', () => {
		it('should create blank end node with correct properties', () => {
			const node = createBlankEndNode();

			expect(node).toMatchObject({
				id: 'blank-end',
				url: 'Enter end URL',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 5700, y: 5000 },
				isStartNode: false,
				isEndNode: true
			});
		});
	});
});
