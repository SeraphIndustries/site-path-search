<script lang="ts">
	export let url: string;
	export let isLoading: boolean;
	export let onFetch: () => void;

	function handleKeyDown(event: KeyboardEvent) {
		console.log('Key pressed:', event.key);
		console.log('handleKeyDown url:', url);
		if (event.key === 'Enter') {
			console.log('Enter key pressed');
			onFetch();
		}
	}
</script>

<div class="url-input-container">
	<div class="url-input-wrapper">
		<input
			type="text"
			bind:value={url}
			on:keypress={handleKeyDown}
			placeholder="Enter URL to analyze..."
			class="url-input-field"
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
