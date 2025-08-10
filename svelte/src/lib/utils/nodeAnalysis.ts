import type { PathState, PathNode } from '$lib/types/linkAnalysis';
import { LinkAnalysisService } from '$lib/services/linkAnalysisService';
import {
	generateNodeId,
	calculateNodePosition,
	calculateNodePositionFromParent
} from './nodePositioning';

export async function analyzeStartUrl(pathState: PathState): Promise<{
	success: boolean;
	nodeId?: string;
	error?: string;
}> {
	if (!pathState.startUrl.trim()) {
		return { success: false, error: 'No start URL provided' };
	}

	const nodeId = generateNodeId();
	const position = { x: 4800, y: 5000 }; // Position where blank start node was

	const node: PathNode = {
		id: nodeId,
		url: pathState.startUrl,
		linkSummary: null,
		kagiSearchSummary: null,
		error: '',
		isLoading: true,
		parentId: undefined, // No parent - this IS the start
		level: -1, // Start/end nodes use -1 to get proper "START"/"END" labels
		position,
		isStartNode: true,
		isEndNode: false,
		isKagiSearchNode: false
	};

	pathState.nodes.set(nodeId, node);
	pathState.selectedNodeId = nodeId;

	try {
		const linkSummary = await LinkAnalysisService.analyzeLinks(pathState.startUrl);
		node.linkSummary = linkSummary;
		node.isLoading = false;
		return { success: true, nodeId };
	} catch (err) {
		node.error = err instanceof Error ? err.message : String(err);
		node.isLoading = false;
		return { success: false, error: node.error, nodeId };
	}
}

export async function analyzeEndUrl(pathState: PathState): Promise<{
	success: boolean;
	nodeId?: string;
	error?: string;
}> {
	if (!pathState.endUrl.trim()) {
		return { success: false, error: 'No end URL provided' };
	}

	const nodeId = generateNodeId();
	const position = { x: 5700, y: 5000 }; // Position where blank end node was

	const node: PathNode = {
		id: nodeId,
		url: pathState.endUrl,
		linkSummary: null,
		kagiSearchSummary: null,
		error: '',
		isLoading: true,
		parentId: undefined, // No parent - this IS the end
		level: -1, // Start/end nodes use -1 to get proper "START"/"END" labels
		position,
		isStartNode: false,
		isEndNode: true,
		isKagiSearchNode: false
	};

	pathState.nodes.set(nodeId, node);
	pathState.selectedNodeId = nodeId;

	try {
		const linkSummary = await LinkAnalysisService.analyzeLinks(pathState.endUrl);
		node.linkSummary = linkSummary;
		node.isLoading = false;
		return { success: true, nodeId };
	} catch (err) {
		node.error = err instanceof Error ? err.message : String(err);
		node.isLoading = false;
		return { success: false, error: node.error, nodeId };
	}
}

export async function analyzeLinkFromNode(
	parentNodeId: string,
	linkUrl: string,
	pathState: PathState
): Promise<{ success: boolean; nodeId?: string; error?: string }> {
	const parentNode = pathState.nodes.get(parentNodeId);
	if (!parentNode) {
		return { success: false, error: 'Parent node not found' };
	}

	// Check if we already have this URL analyzed
	for (const [id, node] of pathState.nodes) {
		if (node.url === linkUrl) {
			pathState.selectedNodeId = id;
			return { success: true, nodeId: id };
		}
	}

	const nodeId = generateNodeId();
	const level = parentNode.level + 1;
	const position = calculateNodePositionFromParent(parentNodeId, level, pathState);

	const node: PathNode = {
		id: nodeId,
		url: linkUrl,
		linkSummary: null,
		kagiSearchSummary: null,
		error: '',
		isLoading: true,
		parentId: parentNodeId,
		level,
		position,
		isStartNode: false,
		isEndNode: false,
		isKagiSearchNode: false
	};

	pathState.nodes.set(nodeId, node);
	pathState.selectedNodeId = nodeId;

	try {
		const linkSummary = await LinkAnalysisService.analyzeLinks(linkUrl);
		node.linkSummary = linkSummary;
		node.isLoading = false;
		return { success: true, nodeId };
	} catch (err) {
		node.error = err instanceof Error ? err.message : String(err);
		node.isLoading = false;
		return { success: false, error: node.error, nodeId };
	}
}

export async function analyzeKagiSearchFromNode(
	parentNodeId: string,
	targetUrl: string,
	pathState: PathState
): Promise<{ success: boolean; nodeId?: string; error?: string }> {
	const parentNode = pathState.nodes.get(parentNodeId);
	if (!parentNode) {
		return { success: false, error: 'Parent node not found' };
	}

	// Check if we already have this Kagi search analyzed
	for (const [id, node] of pathState.nodes) {
		if (node.url === targetUrl && node.isKagiSearchNode) {
			pathState.selectedNodeId = id;
			return { success: true, nodeId: id };
		}
	}

	const nodeId = generateNodeId();
	const level = parentNode.level + 1;
	const position = calculateNodePositionFromParent(parentNodeId, level, pathState);

	const node: PathNode = {
		id: nodeId,
		url: targetUrl,
		linkSummary: null,
		kagiSearchSummary: null,
		error: '',
		isLoading: true,
		parentId: parentNodeId,
		level,
		position,
		isStartNode: false,
		isEndNode: false,
		isKagiSearchNode: true
	};

	pathState.nodes.set(nodeId, node);
	pathState.selectedNodeId = nodeId;

	try {
		const kagiSearchSummary = await LinkAnalysisService.analyzeKagiSearch(targetUrl);
		node.kagiSearchSummary = kagiSearchSummary;
		node.isLoading = false;
		return { success: true, nodeId };
	} catch (err) {
		node.error = err instanceof Error ? err.message : String(err);
		node.isLoading = false;
		return { success: false, error: node.error, nodeId };
	}
}
