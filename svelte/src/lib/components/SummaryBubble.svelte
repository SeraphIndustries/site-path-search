<script lang="ts">
	import type { LinkSummary } from '$lib/types/linkAnalysis';

	export let linkSummary: LinkSummary;
	export let isDark: boolean = false;
</script>

<div class="summary-bubble" class:dark={isDark}>
	<div class="summary-content">
		<div class="summary-item">
			<span class="summary-icon">🔗</span>
			<span class="summary-number" class:dark={isDark}>{linkSummary.total_links}</span>
			<span class="summary-label" class:dark={isDark}>Total</span>
		</div>
		<div class="summary-item">
			<span class="summary-icon">📝</span>
			<span class="summary-number" class:dark={isDark}>{linkSummary.main_text_links}</span>
			<span class="summary-label" class:dark={isDark}>Main Text</span>
		</div>
		<div class="summary-item">
			<span class="summary-icon">🖼️</span>
			<span class="summary-number" class:dark={isDark}
				>{linkSummary.image_links_within_main_text}</span
			>
			<span class="summary-label" class:dark={isDark}>Images</span>
		</div>
		<div class="summary-item">
			<span class="summary-icon">🔗</span>
			<span class="summary-number" class:dark={isDark}
				>{linkSummary.regular_links_within_main_text}</span
			>
			<span class="summary-label" class:dark={isDark}>Regular</span>
		</div>
		<div class="summary-item">
			<span class="summary-icon">📌</span>
			<span class="summary-number" class:dark={isDark}>{linkSummary.other_links}</span>
			<span class="summary-label" class:dark={isDark}>Other</span>
		</div>
	</div>
</div>
