import { getKagiSearchUrl, getLinksUrl } from '$lib/config.js';
import type { KagiSearchSummary, LinkSummary } from '$lib/types/linkAnalysis';

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

	static async analyzeKagiSearch(
		targetUrl: string,
		limit: number = 10,
		excludeDomain: boolean = true
	): Promise<KagiSearchSummary> {
		const response = await fetch(getKagiSearchUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				target_url: targetUrl,
				limit: limit,
				exclude_domain: excludeDomain
			})
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch Kagi search data from server: ${response.status} ${response.statusText}`
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
		const url = `${API_BASE_URL}/autonomous-path`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				start_url: startUrl,
				end_url: endUrl,
				max_depth: maxDepth
			})
		});
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
