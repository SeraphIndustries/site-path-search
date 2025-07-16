import type { LinkSummary } from '$lib/types/linkAnalysis';
import { getLinksUrl } from '$lib/config.js';

export class LinkAnalysisService {
	static async analyzeLinks(url: string): Promise<LinkSummary> {
		const response = await fetch(getLinksUrl(url));

		if (!response.ok) {
			throw new Error(
				`Failed to fetch data from server: ${response.status} ${response.statusText}`
			);
		}

		return await response.json();
	}
}
