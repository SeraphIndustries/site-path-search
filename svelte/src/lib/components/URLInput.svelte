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

<div class="relative" style="margin: 20px 0;">
	<div
		class="rounded-3xl border-2 border-blue-200 bg-white p-2 shadow-lg transition-all duration-300 hover:border-blue-300"
		style="background: white; border-radius: 24px; padding: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 2px solid #bfdbfe;"
	>
		<input
			type="text"
			bind:value={url}
			on:keypress={handleKeyDown}
			placeholder="Enter URL to analyze..."
			class="w-full rounded-2xl border-none px-6 py-4 text-gray-700 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-300"
			style="width: 100%; padding: 16px 24px; border-radius: 16px; border: none; outline: none; color: #374151; background: transparent;"
			disabled={isLoading}
		/>
	</div>

	<!-- Find Links Button -->
	<div
		class="mt-4 flex justify-center"
		style="margin-top: 16px; display: flex; justify-content: center;"
	>
		<button
			on:click={onFetch}
			disabled={isLoading || !url.trim()}
			class="transform rounded-full bg-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95 active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
			style="padding: 12px 32px; background: #3b82f6; color: white; font-weight: 600; border-radius: 9999px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: none; cursor: pointer; transition: all 0.2s;"
		>
			{#if isLoading}
				<span
					class="flex items-center space-x-2"
					style="display: flex; align-items: center; gap: 8px;"
				>
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
						style="height: 20px; width: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"
					></div>
					<span>Finding Links...</span>
				</span>
			{:else}
				Find Links
			{/if}
		</button>
	</div>
</div>

<style>
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	button:hover {
		background: #2563eb !important;
		transform: scale(1.05);
	}

	button:active {
		background: #1d4ed8 !important;
		transform: scale(0.95);
	}

	button:disabled {
		background: #d1d5db !important;
		cursor: not-allowed;
		transform: none;
	}
</style>
