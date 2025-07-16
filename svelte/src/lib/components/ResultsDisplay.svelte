<script lang="ts">
	import LinkCard from './LinkCard.svelte';
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
		<h2 class="results-title">Link Analysis Results</h2>

		<div class="results-grid">
			<LinkCard title="Total Links" value={linkSummary.total_links} icon="🔗" color="blue" />
			<LinkCard
				title="Main Text Links"
				value={linkSummary.main_text_links}
				icon="📝"
				color="green"
			/>
			<LinkCard
				title="Image Links"
				value={linkSummary.image_links_within_main_text}
				icon="🖼️"
				color="purple"
			/>
			<LinkCard
				title="Regular Links"
				value={linkSummary.regular_links_within_main_text}
				icon="🔗"
				color="indigo"
			/>
			<LinkCard title="Other Links" value={linkSummary.other_links} icon="📌" color="orange" />
		</div>
	</div>
{/if}
