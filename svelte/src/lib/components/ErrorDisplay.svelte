<script lang="ts">
	export let error: string;

	let isDark = false;

	// Check for dark mode
	function checkDarkMode() {
		const mainContainer = document.querySelector('.main-container');
		isDark = mainContainer?.classList.contains('dark') || false;
	}

	// Listen for theme changes
	if (typeof window !== 'undefined') {
		const observer = new MutationObserver(() => {
			checkDarkMode();
		});

		const mainContainer = document.querySelector('.main-container');
		if (mainContainer) {
			observer.observe(mainContainer, { attributes: true });
		}

		// Initial check
		checkDarkMode();
	}
</script>

{#if error}
	<div class="error-container" class:dark={isDark}>
		<p class="error-message" class:dark={isDark}>{error}</p>
	</div>
{/if}
