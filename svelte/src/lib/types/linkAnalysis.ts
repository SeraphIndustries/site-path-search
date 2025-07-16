export type LinkCardColor = 'blue' | 'green' | 'purple' | 'indigo' | 'orange';

export interface LinkSummary {
	total_links: number;
	main_text_links: number;
	image_links_within_main_text: number;
	regular_links_within_main_text: number;
	other_links: number;
	regular_links: string[];
}
