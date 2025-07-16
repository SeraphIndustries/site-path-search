<script lang="ts">
	import type { LinkSummary } from '$lib/types/linkAnalysis';

	export let linkSummary: LinkSummary;
</script>

<div class="summary-bubble">
	<div class="summary-content">
		<div class="summary-item">
			<span class="summary-icon">🔗</span>
			<span class="summary-number">{linkSummary.total_links}</span>
			<span class="summary-label">Total</span>
		</div>
		<div class="summary-item">
			<span class="summary-icon">📝</span>
			<span class="summary-number">{linkSummary.main_text_links}</span>
			<span class="summary-label">Main Text</span>
		</div>
		<div class="summary-item">
			<span class="summary-icon">🖼️</span>
			<span class="summary-number">{linkSummary.image_links_within_main_text}</span>
			<span class="summary-label">Images</span>
		</div>
		<div class="summary-item">
			<span class="summary-icon">🔗</span>
			<span class="summary-number">{linkSummary.regular_links_within_main_text}</span>
			<span class="summary-label">Regular</span>
		</div>
		<div class="summary-item">
			<span class="summary-icon">📌</span>
			<span class="summary-number">{linkSummary.other_links}</span>
			<span class="summary-label">Other</span>
		</div>
	</div>
</div>
