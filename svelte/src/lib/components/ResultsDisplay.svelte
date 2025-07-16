<script lang="ts">
	import SummaryBubble from './SummaryBubble.svelte';
	import LinksList from './LinksList.svelte';
	import type { LinkSummary } from '$lib/types/linkAnalysis';

	export let linkSummary: LinkSummary | null;
	export let showArrow: boolean;

	let isDark = false;

	function checkDarkMode() {
		const mainContainer = document.querySelector('.main-container');
		isDark = mainContainer?.classList.contains('dark') || false;
	}

	if (typeof window !== 'undefined') {
		const observer = new MutationObserver(() => {
			checkDarkMode();
		});

		const mainContainer = document.querySelector('.main-container');
		if (mainContainer) {
			observer.observe(mainContainer, { attributes: true });
		}

		checkDarkMode();
	}
</script>

{#if linkSummary}
	{#if showArrow}
		<div class="arrow-animation">
			<div class="arrow-icon" class:dark={isDark}>↓</div>
		</div>
	{/if}

	<div class="results-container" class:dark={isDark}>
		<div class="results-header">
			<h2 class="results-title" class:dark={isDark}>Link Analysis Results</h2>
			<SummaryBubble {linkSummary} {isDark} />
		</div>

		{#if linkSummary.regular_links && linkSummary.regular_links.length > 0}
			<LinksList links={linkSummary.regular_links} {isDark} />
		{/if}
	</div>
{/if}
