<script lang="ts">
	import { onMount } from 'svelte';
	import LinkFinder from '$lib/components/LinkFinder.svelte';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';

	let isDark = false;

	onMount(() => {
		// Check for saved theme preference
		const savedTheme = localStorage.getItem('theme');
		isDark =
			savedTheme === 'dark' ||
			(!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

		// Listen for theme changes
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
			<h1 class="main-title" class:dark={isDark}>Site Page Link Finder</h1>
			<DarkModeToggle />
		</div>

		<LinkFinder />
	</div>
</main>
