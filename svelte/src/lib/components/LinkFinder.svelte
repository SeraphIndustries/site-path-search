<script lang="ts">
	import URLInput from './URLInput.svelte';
	import ResultsDisplay from './ResultsDisplay.svelte';
	import ErrorDisplay from './ErrorDisplay.svelte';
	import type { LinkSummary } from '$lib/types/linkAnalysis';
	import { LinkAnalysisService } from '$lib/services/linkAnalysisService';

	let startUrl = '';
	let endUrl = '';
	let linkSummary: LinkSummary | null = null;
	let error = '';
	let isLoading = false;
	let showArrow = false;

	async function analyzeStart() {
		if (startUrl.trim()) {
			isLoading = true;
			error = '';
			showArrow = false;

			try {
				linkSummary = await LinkAnalysisService.analyzeLinks(startUrl);
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

	async function analyzeEnd() {
		if (endUrl.trim()) {
			isLoading = true;
			error = '';
			showArrow = false;

			try {
				linkSummary = await LinkAnalysisService.analyzeLinks(endUrl);
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
	<URLInput
		bind:startUrl
		bind:endUrl
		{isLoading}
		onAnalyzeStart={analyzeStart}
		onAnalyzeEnd={analyzeEnd}
	/>

	<ErrorDisplay {error} />

	<ResultsDisplay {linkSummary} {showArrow} />
</div>
