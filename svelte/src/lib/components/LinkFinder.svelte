<script lang="ts">
	import URLInput from './URLInput.svelte';
	import ResultsDisplay from './ResultsDisplay.svelte';
	import ErrorDisplay from './ErrorDisplay.svelte';
	import type { LinkSummary } from '$lib/types/linkAnalysis';
	import { LinkAnalysisService } from '$lib/services/linkAnalysisService';

	let url = '';
	let linkSummary: LinkSummary | null = null;
	let error = '';
	let isLoading = false;
	let showArrow = false;

	async function fetchLinks() {
		console.log('fetchLinks called');
		console.log('url:', url);
		if (url.trim()) {
			isLoading = true;
			error = '';
			showArrow = false;

			try {
				linkSummary = await LinkAnalysisService.analyzeLinks(url);
				showArrow = true;
			} catch (err) {
				if (err instanceof Error) {
					error = err.message;
				} else {
					error = String(err);
				}
			} finally {
				isLoading = false;
			}
		}
	}
</script>

<div class="space-y-8">
	<URLInput bind:url {isLoading} onFetch={fetchLinks} />

	<ErrorDisplay {error} />

	<ResultsDisplay {linkSummary} {showArrow} />
</div>
