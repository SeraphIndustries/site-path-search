<script lang="ts">
	export let links: string[];
	export let isDark: boolean = false;
</script>

<div class="links-list-container">
	<h3 class="links-list-title" class:dark={isDark}>Regular Links Found</h3>
	<div class="links-list">
		{#each links as link, index}
			<a
				href={link}
				target="_blank"
				rel="noopener noreferrer"
				class="link-item"
				class:dark={isDark}
			>
				<span class="link-number">{index + 1}</span>
				<span class="link-url" class:dark={isDark}>{link}</span>
			</a>
		{/each}
	</div>
</div>
