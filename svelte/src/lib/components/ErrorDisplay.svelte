<script lang="ts">
	export let error: string;
</script>

{#if error}
	<div class="rounded-xl border border-red-200 bg-red-50 p-4">
		<p class="font-medium text-red-700">{error}</p>
	</div>
{/if}
