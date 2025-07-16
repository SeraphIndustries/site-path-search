<script lang="ts">
	import SummaryBubble from './SummaryBubble.svelte';
	import LinksList from './LinksList.svelte';
	import type { LinkSummary } from '$lib/types/linkAnalysis';

	export let linkSummary: LinkSummary | null;
	export let showArrow: boolean;
</script>

{#if linkSummary}
	<!-- Arrow Animation -->
	{#if showArrow}
		<div class="arrow-animation">
			<div class="arrow-icon">↓</div>
		</div>
	{/if}

	<!-- Results Section -->
	<div class="results-container">
		<div class="results-header">
			<h2 class="results-title">Link Analysis Results</h2>
			<SummaryBubble {linkSummary} />
		</div>

		{#if linkSummary.regular_links && linkSummary.regular_links.length > 0}
			<LinksList links={linkSummary.regular_links} />
		{/if}
	</div>
{/if}
