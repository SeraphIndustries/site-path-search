import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PathState, PathNode, LinkSummary } from '$lib/types/linkAnalysis';
import { LinkAnalysisService } from '$lib/services/linkAnalysisService';
import { analyzeStartUrl, analyzeEndUrl, analyzeLinkFromNode } from './nodeAnalysis';

// Mock the LinkAnalysisService
vi.mock('$lib/services/linkAnalysisService', () => ({
	LinkAnalysisService: {
		analyzeLinks: vi.fn()
	}
}));

// Mock the node positioning utilities
vi.mock('./nodePositioning', () => ({
	generateNodeId: vi.fn(() => 'mock-node-id-123'),
	calculateNodePositionFromParent: vi.fn(() => ({ x: 1000, y: 1000 }))
}));

describe('nodeAnalysis', () => {
	let pathState: PathState;
	let mockLinkSummary: LinkSummary;

	beforeEach(() => {
		pathState = {
			startUrl: 'https://start.com',
			endUrl: 'https://end.com',
			nodes: new Map(),
			selectedNodeId: null
		};

		mockLinkSummary = {
			total_links: 10,
			main_text_links: 5,
			image_links_within_main_text: 2,
			regular_links_within_main_text: 3,
			other_links: 5,
			regular_links: ['https://link1.com', 'https://link2.com', 'https://link3.com']
		};

		// Reset mocks
		vi.clearAllMocks();
	});

	describe('analyzeStartUrl', () => {
		it('should return error when startUrl is empty', async () => {
			pathState.startUrl = '';

			const result = await analyzeStartUrl(pathState);

			expect(result.success).toBe(false);
			expect(result.error).toBe('No start URL provided');
			expect(result.nodeId).toBeUndefined();
		});

		it('should return error when startUrl is only whitespace', async () => {
			pathState.startUrl = '   ';

			const result = await analyzeStartUrl(pathState);

			expect(result.success).toBe(false);
			expect(result.error).toBe('No start URL provided');
		});

		it('should successfully analyze start URL', async () => {
			vi.mocked(LinkAnalysisService.analyzeLinks).mockResolvedValue(mockLinkSummary);
			pathState.startUrl = 'https://start.com';

			const result = await analyzeStartUrl(pathState);

			expect(result.success).toBe(true);
			expect(result.nodeId).toBe('mock-node-id-123');
			expect(result.error).toBeUndefined();

			// Check that node was added to pathState
			const node = pathState.nodes.get('mock-node-id-123');
			expect(node).toBeDefined();
			expect(node!.url).toBe('https://start.com');
			expect(node!.isStartNode).toBe(true);
			expect(node!.isEndNode).toBe(false);
			expect(node!.level).toBe(-1);
			expect(node!.position).toEqual({ x: 4800, y: 5000 });
			expect(node!.linkSummary).toEqual(mockLinkSummary);
			expect(node!.isLoading).toBe(false);
			expect(node!.error).toBe('');

			// Check that selectedNodeId was set
			expect(pathState.selectedNodeId).toBe('mock-node-id-123');

			// Verify service was called
			expect(LinkAnalysisService.analyzeLinks).toHaveBeenCalledWith('https://start.com');
		});

		it('should handle analysis error and update node accordingly', async () => {
			const errorMessage = 'Failed to analyze URL';
			vi.mocked(LinkAnalysisService.analyzeLinks).mockRejectedValue(new Error(errorMessage));
			pathState.startUrl = 'https://start.com';

			const result = await analyzeStartUrl(pathState);

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
			expect(result.nodeId).toBe('mock-node-id-123');

			// Check that node was added but with error state
			const node = pathState.nodes.get('mock-node-id-123');
			expect(node).toBeDefined();
			expect(node!.error).toBe(errorMessage);
			expect(node!.isLoading).toBe(false);
			expect(node!.linkSummary).toBeNull();
		});

		it('should handle non-Error objects thrown by service', async () => {
			vi.mocked(LinkAnalysisService.analyzeLinks).mockRejectedValue('String error');
			pathState.startUrl = 'https://start.com';

			const result = await analyzeStartUrl(pathState);

			expect(result.success).toBe(false);
			expect(result.error).toBe('String error');

			const node = pathState.nodes.get('mock-node-id-123');
			expect(node!.error).toBe('String error');
		});

		it('should set node as loading during analysis', async () => {
			let resolvePromise: (value: LinkSummary) => void;
			const pendingPromise = new Promise<LinkSummary>((resolve) => {
				resolvePromise = resolve;
			});
			vi.mocked(LinkAnalysisService.analyzeLinks).mockReturnValue(pendingPromise);

			pathState.startUrl = 'https://start.com';
			const resultPromise = analyzeStartUrl(pathState);

			// Check that node is initially loading
			const node = pathState.nodes.get('mock-node-id-123');
			expect(node!.isLoading).toBe(true);
			expect(node!.linkSummary).toBeNull();

			// Resolve the promise
			resolvePromise!(mockLinkSummary);
			await resultPromise;

			// Check that loading state is cleared
			expect(node!.isLoading).toBe(false);
			expect(node!.linkSummary).toEqual(mockLinkSummary);
		});
	});

	describe('analyzeEndUrl', () => {
		it('should return error when endUrl is empty', async () => {
			pathState.endUrl = '';

			const result = await analyzeEndUrl(pathState);

			expect(result.success).toBe(false);
			expect(result.error).toBe('No end URL provided');
		});

		it('should successfully analyze end URL', async () => {
			vi.mocked(LinkAnalysisService.analyzeLinks).mockResolvedValue(mockLinkSummary);
			pathState.endUrl = 'https://end.com';

			const result = await analyzeEndUrl(pathState);

			expect(result.success).toBe(true);
			expect(result.nodeId).toBe('mock-node-id-123');

			const node = pathState.nodes.get('mock-node-id-123');
			expect(node!.url).toBe('https://end.com');
			expect(node!.isStartNode).toBe(false);
			expect(node!.isEndNode).toBe(true);
			expect(node!.position).toEqual({ x: 5700, y: 5000 });
		});

		it('should handle analysis error for end URL', async () => {
			const errorMessage = 'Failed to analyze end URL';
			vi.mocked(LinkAnalysisService.analyzeLinks).mockRejectedValue(new Error(errorMessage));
			pathState.endUrl = 'https://end.com';

			const result = await analyzeEndUrl(pathState);

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);

			const node = pathState.nodes.get('mock-node-id-123');
			expect(node!.error).toBe(errorMessage);
			expect(node!.isLoading).toBe(false);
		});
	});

	describe('analyzeLinkFromNode', () => {
		let parentNode: PathNode;

		beforeEach(() => {
			parentNode = {
				id: 'parent-123',
				url: 'https://parent.com',
				linkSummary: mockLinkSummary,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 500, y: 500 },
				isStartNode: false,
				isEndNode: false
			};
			pathState.nodes.set('parent-123', parentNode);
		});

		it('should return error when parent node not found', async () => {
			const result = await analyzeLinkFromNode(
				'non-existent-parent',
				'https://link.com',
				pathState
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Parent node not found');
		});

		it('should return existing node if URL already analyzed', async () => {
			const existingNode: PathNode = {
				id: 'existing-123',
				url: 'https://existing.com',
				linkSummary: mockLinkSummary,
				error: '',
				isLoading: false,
				level: 1,
				position: { x: 800, y: 600 },
				parentId: 'parent-123',
				isStartNode: false,
				isEndNode: false
			};
			pathState.nodes.set('existing-123', existingNode);

			const result = await analyzeLinkFromNode('parent-123', 'https://existing.com', pathState);

			expect(result.success).toBe(true);
			expect(result.nodeId).toBe('existing-123');
			expect(pathState.selectedNodeId).toBe('existing-123');

			// Should not call the service since node already exists
			expect(LinkAnalysisService.analyzeLinks).not.toHaveBeenCalled();
		});

		it('should successfully analyze new link from parent node', async () => {
			vi.mocked(LinkAnalysisService.analyzeLinks).mockResolvedValue(mockLinkSummary);

			const result = await analyzeLinkFromNode('parent-123', 'https://newlink.com', pathState);

			expect(result.success).toBe(true);
			expect(result.nodeId).toBe('mock-node-id-123');

			const node = pathState.nodes.get('mock-node-id-123');
			expect(node!.url).toBe('https://newlink.com');
			expect(node!.parentId).toBe('parent-123');
			expect(node!.level).toBe(1); // parent level + 1
			expect(node!.position).toEqual({ x: 1000, y: 1000 }); // from mock
			expect(node!.isStartNode).toBe(false);
			expect(node!.isEndNode).toBe(false);
			expect(node!.linkSummary).toEqual(mockLinkSummary);

			expect(pathState.selectedNodeId).toBe('mock-node-id-123');
			expect(LinkAnalysisService.analyzeLinks).toHaveBeenCalledWith('https://newlink.com');
		});

		it('should handle analysis error for link from node', async () => {
			const errorMessage = 'Failed to analyze link';
			vi.mocked(LinkAnalysisService.analyzeLinks).mockRejectedValue(new Error(errorMessage));

			const result = await analyzeLinkFromNode('parent-123', 'https://newlink.com', pathState);

			expect(result.success).toBe(false);
			expect(result.error).toBe(errorMessage);
			expect(result.nodeId).toBe('mock-node-id-123');

			const node = pathState.nodes.get('mock-node-id-123');
			expect(node!.error).toBe(errorMessage);
			expect(node!.isLoading).toBe(false);
			expect(node!.linkSummary).toBeNull();
		});

		it('should calculate correct level based on parent', async () => {
			vi.mocked(LinkAnalysisService.analyzeLinks).mockResolvedValue(mockLinkSummary);

			// Set parent to level 5
			parentNode.level = 5;

			const result = await analyzeLinkFromNode('parent-123', 'https://newlink.com', pathState);

			const node = pathState.nodes.get('mock-node-id-123');
			expect(node!.level).toBe(6); // parent level + 1
		});

		it('should set node as loading during analysis', async () => {
			let resolvePromise: (value: LinkSummary) => void;
			const pendingPromise = new Promise<LinkSummary>((resolve) => {
				resolvePromise = resolve;
			});
			vi.mocked(LinkAnalysisService.analyzeLinks).mockReturnValue(pendingPromise);

			const resultPromise = analyzeLinkFromNode('parent-123', 'https://newlink.com', pathState);

			// Check that node is initially loading
			const node = pathState.nodes.get('mock-node-id-123');
			expect(node!.isLoading).toBe(true);
			expect(node!.linkSummary).toBeNull();

			// Resolve the promise
			resolvePromise!(mockLinkSummary);
			await resultPromise;

			// Check that loading state is cleared
			expect(node!.isLoading).toBe(false);
			expect(node!.linkSummary).toEqual(mockLinkSummary);
		});

		it('should handle non-Error objects in analysis failure', async () => {
			vi.mocked(LinkAnalysisService.analyzeLinks).mockRejectedValue({ message: 'Object error' });

			const result = await analyzeLinkFromNode('parent-123', 'https://newlink.com', pathState);

			expect(result.success).toBe(false);
			expect(result.error).toBe('[object Object]'); // String conversion

			const node = pathState.nodes.get('mock-node-id-123');
			expect(node!.error).toBe('[object Object]');
		});
	});
});
