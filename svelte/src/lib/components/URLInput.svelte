<script lang="ts">
	export let url: string;
	export let isLoading: boolean;
	export let onFetch: () => void;

	let isDark = false;

	function handleKeyDown(event: KeyboardEvent) {
		console.log('Key pressed:', event.key);
		console.log('handleKeyDown url:', url);
		if (event.key === 'Enter') {
			console.log('Enter key pressed');
			onFetch();
		}
	}

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

<div class="url-input-container">
	<div class="url-input-wrapper" class:dark={isDark}>
		<input
			type="text"
			bind:value={url}
			on:keypress={handleKeyDown}
			placeholder="Enter URL to analyze..."
			class="url-input-field"
			class:dark={isDark}
			disabled={isLoading}
		/>
	</div>

	<!-- Find Links Button -->
	<div class="button-container">
		<button on:click={onFetch} disabled={isLoading || !url.trim()} class="primary-button">
			{#if isLoading}
				<span class="loading-content">
					<div class="loading-spinner"></div>
					<span>Finding Links...</span>
				</span>
			{:else}
				Find Links
			{/if}
		</button>
	</div>
</div>
