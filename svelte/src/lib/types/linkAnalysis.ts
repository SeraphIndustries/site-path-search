export type LinkCardColor = 'blue' | 'green' | 'purple' | 'indigo' | 'orange';

export interface LinkSummary {
	total_links: number;
	main_text_links: number;
	image_links_within_main_text: number;
	regular_links_within_main_text: number;
	other_links: number;
	regular_links: string[];
}

export interface PathNode {
	id: string;
	url: string;
	linkSummary: LinkSummary | null;
	error: string;
	isLoading: boolean;
	parentId?: string;
	level: number;
	position: { x: number; y: number };
	isStartNode: boolean;
	isEndNode: boolean;
}

export interface PathState {
	startUrl: string;
	endUrl: string;
	nodes: Map<string, PathNode>;
	selectedNodeId: string | null;
}
