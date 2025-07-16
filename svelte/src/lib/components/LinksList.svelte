<script lang="ts">
	export let links: string[];
</script>

<div class="links-list-container">
	<h3 class="links-list-title">Regular Links Found</h3>
	<div class="links-list">
		{#each links as link, index}
			<a href={link} target="_blank" rel="noopener noreferrer" class="link-item">
				<span class="link-number">{index + 1}</span>
				<span class="link-url">{link}</span>
			</a>
		{/each}
	</div>
</div>
