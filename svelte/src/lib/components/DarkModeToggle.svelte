<script lang="ts">
	import { onMount } from 'svelte';

	let isDark = false;

	onMount(() => {
		// Check for saved theme preference or default to light mode
		const savedTheme = localStorage.getItem('theme');
		isDark =
			savedTheme === 'dark' ||
			(!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
		applyTheme();
	});

	function toggleTheme() {
		isDark = !isDark;
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
		applyTheme();
	}

	function applyTheme() {
		const mainContainer = document.querySelector('.main-container');
		if (mainContainer) {
			if (isDark) {
				mainContainer.classList.add('dark');
			} else {
				mainContainer.classList.remove('dark');
			}
		}
	}
</script>

<button
	on:click={toggleTheme}
	class="dark-mode-toggle"
	class:dark={isDark}
	aria-label="Toggle dark mode"
>
	{#if isDark}
		<span class="toggle-icon">☀️</span>
	{:else}
		<span class="toggle-icon">🌙</span>
	{/if}
</button>
