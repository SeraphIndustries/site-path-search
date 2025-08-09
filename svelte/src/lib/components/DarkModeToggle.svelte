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

<style>
	.dark-mode-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: 2px solid #e5e7eb;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.dark-mode-toggle:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.dark-mode-toggle:focus {
		outline: none;
		ring: 2px solid #3b82f6;
		ring-offset: 2px;
	}

	.dark-mode-toggle.dark {
		background: #1f2937;
		border-color: #4b5563;
	}

	.toggle-icon {
		font-size: 18px;
		transition: transform 0.3s ease;
	}

	.dark-mode-toggle:hover .toggle-icon {
		transform: rotate(15deg);
	}

	/* Dark mode styles for the context story */
	:global(.dark) .dark-mode-toggle {
		background: #1f2937;
		border-color: #4b5563;
	}
</style>
