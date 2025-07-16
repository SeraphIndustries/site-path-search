import type { LinkSummary } from '$lib/types/linkAnalysis';

const API_BASE_URL = 'http://localhost:8000';

export class LinkAnalysisService {
	static async analyzeLinks(url: string): Promise<LinkSummary> {
		const response = await fetch(`${API_BASE_URL}/links?url=${encodeURIComponent(url)}`);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch data from server: ${response.status} ${response.statusText}`
			);
		}

		return await response.json();
	}
}
