<script lang="ts">
	export let error: string;
</script>

{#if error}
	<div class="error-container">
		<p class="error-message">{error}</p>
	</div>
{/if}
