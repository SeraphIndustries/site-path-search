<script lang="ts">
	import { onMount } from 'svelte';
	import PathFinder from '$lib/components/PathFinder.svelte';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';

	let isDark = false;

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		isDark =
			savedTheme === 'dark' ||
			(!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
					const mainContainer = document.querySelector('.main-container');
					isDark = mainContainer?.classList.contains('dark') || false;
				}
			});
		});

		const mainContainer = document.querySelector('.main-container');
		if (mainContainer) {
			observer.observe(mainContainer, { attributes: true });
		}
	});
</script>

<main class="main-container">
	<div class="main-content">
		<div class="header-container">
			<h1 class="main-title" class:dark={isDark}>Site Path Finder</h1>
			<DarkModeToggle />
		</div>

		<PathFinder {isDark} />
	</div>
</main>

<style>
	@media (max-width: 768px) {
		.main-content {
			padding: 0.5rem;
		}

		.header-container {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.main-title {
			font-size: 1.5rem;
		}
	}
</style>
