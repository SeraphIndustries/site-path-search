<script lang="ts">
	export let startUrl: string;
	export let endUrl: string;
	export let isLoading: boolean;
	export let onAnalyzeStart: () => void;
	export let onAnalyzeEnd: () => void;

	let isDark = false;

	function handleKeyDown(event: KeyboardEvent, type: 'start' | 'end') {
		console.log('Key pressed:', event.key);
		if (event.key === 'Enter') {
			console.log('Enter key pressed for:', type);
			if (type === 'start') {
				onAnalyzeStart();
			} else {
				onAnalyzeEnd();
			}
		}
	}

	function checkDarkMode() {
		const mainContainer = document.querySelector('.main-container');
		isDark = mainContainer?.classList.contains('dark') || false;
	}

	if (typeof window !== 'undefined') {
		const observer = new MutationObserver(() => {
			checkDarkMode();
		});

		const mainContainer = document.querySelector('.main-container');
		if (mainContainer) {
			observer.observe(mainContainer, { attributes: true });
		}

		checkDarkMode();
	}
</script>

<div class="path-input-container">
	<div class="url-inputs-wrapper">
		<!-- Start URL Input -->
		<div class="url-input-section">
			<label class="url-label" class:dark={isDark}>Start URL</label>
			<div class="url-input-wrapper" class:dark={isDark}>
				<input
					type="text"
					bind:value={startUrl}
					on:keypress={(e) => handleKeyDown(e, 'start')}
					placeholder="Enter starting URL..."
					class="url-input-field"
					class:dark={isDark}
					disabled={isLoading}
				/>
			</div>
			<button
				on:click={onAnalyzeStart}
				disabled={isLoading || !startUrl.trim()}
				class="analyze-button start-button"
			>
				{#if isLoading}
					<span class="loading-content">
						<div class="loading-spinner"></div>
						<span>Analyzing...</span>
					</span>
				{:else}
					Analyze Start
				{/if}
			</button>
		</div>

		<!-- End URL Input -->
		<div class="url-input-section">
			<label class="url-label" class:dark={isDark}>End URL</label>
			<div class="url-input-wrapper" class:dark={isDark}>
				<input
					type="text"
					bind:value={endUrl}
					on:keypress={(e) => handleKeyDown(e, 'end')}
					placeholder="Enter target URL..."
					class="url-input-field"
					class:dark={isDark}
					disabled={isLoading}
				/>
			</div>
			<button
				on:click={onAnalyzeEnd}
				disabled={isLoading || !endUrl.trim()}
				class="analyze-button end-button"
			>
				{#if isLoading}
					<span class="loading-content">
						<div class="loading-spinner"></div>
						<span>Analyzing...</span>
					</span>
				{:else}
					Analyze End
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	.path-input-container {
		width: 100%;
		margin-bottom: 2rem;
	}

	.url-inputs-wrapper {
		display: flex;
		gap: 2rem;
		align-items: flex-end;
	}

	.url-input-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.url-label {
		font-weight: 600;
		font-size: 0.875rem;
		color: #374151;
	}

	.url-label.dark {
		color: #d1d5db;
	}

	.url-input-wrapper {
		position: relative;
		border-radius: 0.5rem;
		background: #ffffff;
		border: 2px solid #e5e7eb;
		transition: all 0.2s ease;
	}

	.url-input-wrapper.dark {
		background: #1f2937;
		border-color: #374151;
	}

	.url-input-wrapper:focus-within {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.url-input-field {
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		outline: none;
		background: transparent;
		font-size: 1rem;
		color: #111827;
	}

	.url-input-field.dark {
		color: #f9fafb;
	}

	.url-input-field::placeholder {
		color: #9ca3af;
	}

	.analyze-button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.start-button {
		background: #3b82f6;
		color: white;
	}

	.start-button:hover:not(:disabled) {
		background: #2563eb;
	}

	.end-button {
		background: #10b981;
		color: white;
	}

	.end-button:hover:not(:disabled) {
		background: #059669;
	}

	.analyze-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.loading-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.loading-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.url-inputs-wrapper {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
