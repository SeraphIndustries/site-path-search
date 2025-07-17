<script lang="ts">
	import { getScreenshotUrl, SCREENSHOT_CONFIG } from '$lib/config.js';

	export let url: string;
	export let isDark: boolean = false;
	export let position: { x: number; y: number };
	export let isVisible: boolean = false;

	let previewImage: string | null = null;
	let isLoading = true;
	let hasError = false;

	// Function to get website preview using our screenshot service
	async function loadPreview() {
		if (!url || !isVisible) return;

		isLoading = true;
		hasError = false;

		try {
			// Use our custom screenshot service via proxy - get screenshot
			const screenshotUrl = getScreenshotUrl(url, {
				width: SCREENSHOT_CONFIG.fullPageWidth,
				height: SCREENSHOT_CONFIG.fullPageHeight,
				quality: SCREENSHOT_CONFIG.defaultQuality
			});
			const response = await fetch(screenshotUrl);

			if (response.ok) {
				// Convert the image blob to a data URL
				const blob = await response.blob();
				previewImage = URL.createObjectURL(blob);
			} else {
				// Fallback to placeholder if screenshot service fails
				const encodedUrl = encodeURIComponent(url);
				previewImage = `https://via.placeholder.com/200x150/3b82f6/ffffff?text=${encodeURIComponent(new URL(url).hostname)}`;
			}
		} catch (error) {
			hasError = true;
			console.error('Failed to load preview:', error);

			// Fallback to placeholder
			try {
				const encodedUrl = encodeURIComponent(url);
				previewImage = `https://via.placeholder.com/200x150/3b82f6/ffffff?text=${encodeURIComponent(new URL(url).hostname)}`;
			} catch (fallbackError) {
				console.error('Fallback also failed:', fallbackError);
			}
		} finally {
			isLoading = false;
		}
	}

	$: if (url && isVisible) {
		loadPreview();
	}
</script>

{#if isVisible}
	<div
		class="website-preview"
		class:dark={isDark}
		style="left: {position.x}px; top: {position.y}px;"
	>
		<div class="preview-header">
			<span class="preview-url">{url}</span>
			<span class="preview-type">Screenshot</span>
		</div>

		<div class="preview-content">
			{#if isLoading}
				<div class="loading-preview">
					<div class="preview-spinner"></div>
					<span>Taking screenshot...</span>
				</div>
			{:else if hasError}
				<div class="error-preview">
					<span>Preview unavailable</span>
				</div>
			{:else if previewImage}
				<img
					src={previewImage}
					alt="Preview of {url}"
					class="preview-image"
					on:error={() => (hasError = true)}
				/>
			{/if}
		</div>
	</div>
{/if}

<style>
	.website-preview {
		position: absolute;
		width: 280px; /* Increased from 220px to better accommodate full page screenshots */
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		z-index: 5; /* Lower than nodes to appear behind them */
		transform: translate(-50%, -50%);
		pointer-events: none;
		transition: all 0.3s ease;
	}

	.website-preview.dark {
		background: #1f2937;
		border-color: #374151;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
	}

	.preview-header {
		padding: 0.5rem;
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
		border-radius: 0.5rem 0.5rem 0 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.website-preview.dark .preview-header {
		background: #374151;
		border-bottom-color: #4b5563;
	}

	.preview-url {
		font-size: 0.75rem;
		color: #6b7280;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: block;
	}

	.website-preview.dark .preview-url {
		color: #9ca3af;
	}

	.preview-type {
		font-size: 0.625rem;
		color: #3b82f6;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.website-preview.dark .preview-type {
		color: #60a5fa;
	}

	.preview-content {
		padding: 0.5rem;
		height: 200px; /* Increased from 160px to better accommodate full page screenshots */
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: contain; /* Changed from 'cover' to 'contain' to show full image */
		border-radius: 0.25rem;
		background-color: #f8f9fa; /* Light background for transparent areas */
		transition: transform 0.3s ease;
	}

	.preview-image:hover {
		transform: scale(1.05); /* Slight zoom on hover */
	}

	.website-preview.dark .preview-image {
		background-color: #374151; /* Dark background for dark mode */
	}

	.loading-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.website-preview.dark .loading-preview {
		color: #9ca3af;
	}

	.preview-spinner {
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid #e5e7eb;
		border-top: 2px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.website-preview.dark .preview-spinner {
		border-color: #374151;
		border-top-color: #60a5fa;
	}

	.error-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #6b7280;
		font-size: 0.875rem;
		font-style: italic;
	}

	.website-preview.dark .error-preview {
		color: #9ca3af;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
