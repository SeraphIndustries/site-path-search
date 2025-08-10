export type LinkCardColor = 'blue' | 'green' | 'purple' | 'indigo' | 'orange';

export interface LinkSummary {
	total_links: number;
	main_text_links: number;
	image_links_within_main_text: number;
	regular_links_within_main_text: number;
	other_links: number;
	regular_links: string[];
}

export interface KagiSearchResult {
	title: string;
	url: string;
	snippet: string;
}

export interface KagiSearchSummary {
	target_url: string;
	results: KagiSearchResult[];
}

export interface PathNode {
	id: string;
	url: string;
	linkSummary: LinkSummary | null;
	kagiSearchSummary: KagiSearchSummary | null;
	error: string;
	isLoading: boolean;
	parentId?: string;
	level: number;
	position: { x: number; y: number };
	isStartNode: boolean;
	isEndNode: boolean;
	isKagiSearchNode: boolean;
}

export interface PathState {
	startUrl: string;
	endUrl: string;
	nodes: Map<string, PathNode>;
	selectedNodeId: string | null;
}
