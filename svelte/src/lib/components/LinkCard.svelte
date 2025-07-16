<script lang="ts">
	import type { LinkCardColor } from '$lib/types/linkAnalysis';

	export let title: string;
	export let value: number;
	export let icon: string;
	export let color: LinkCardColor;
</script>

<div class="link-card link-card-{color}">
	<div class="link-card-content">
		<span class="link-card-icon">{icon}</span>
		<div>
			<h3 class="link-card-title">{title}</h3>
			<p class="link-card-value">{value}</p>
		</div>
	</div>
</div>
