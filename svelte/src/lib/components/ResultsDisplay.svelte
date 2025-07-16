<script lang="ts">
	import LinkCard from './LinkCard.svelte';
	import type { LinkSummary } from '$lib/types/linkAnalysis';

	export let linkSummary: LinkSummary | null;
	export let showArrow: boolean;
</script>

{#if linkSummary}
	<!-- Arrow Animation -->
	{#if showArrow}
		<div class="flex justify-center">
			<div class="animate-bounce text-2xl text-blue-500">↓</div>
		</div>
	{/if}

	<!-- Results Section -->
	<div class="rounded-2xl border border-blue-200 bg-white p-6 shadow-lg">
		<h2 class="mb-6 text-center text-2xl font-bold text-blue-900">Link Analysis Results</h2>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
