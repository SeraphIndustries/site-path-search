import { getLinksUrl } from '$lib/config.js';
import type { LinkSummary } from '$lib/types/linkAnalysis';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

	static async *autonomousPath({
		startUrl,
		endUrl,
		maxDepth = 3
	}: {
		startUrl: string;
		endUrl: string;
		maxDepth?: number;
	}) {
		const url = `${API_BASE_URL}/autonomous-path?start_url=${encodeURIComponent(startUrl)}&end_url=${encodeURIComponent(endUrl)}&max_depth=${maxDepth}`;
		const response = await fetch(url);
		if (!response.body) throw new Error('No response body');
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			let lines = buffer.split('\n');
			buffer = lines.pop() ?? '';
			for (const line of lines) {
				if (line.trim()) {
					yield JSON.parse(line);
				}
			}
		}
		if (buffer.trim()) {
			yield JSON.parse(buffer);
		}
	}
}
