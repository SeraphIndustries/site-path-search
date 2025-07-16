<script lang="ts">
	import type { PathNode as PathNodeType } from '$lib/types/linkAnalysis';
	import LinkCard from './LinkCard.svelte';
	import ErrorDisplay from './ErrorDisplay.svelte';

	export let node: PathNodeType;
	export let isSelected: boolean;
	export let onSelect: () => void;
	export let onLinkClick: (linkUrl: string) => void;
	export let onPositionUpdate: (position: { x: number; y: number }) => void;
	export let isDark: boolean = false;

	let isExpanded = false;
	let isDragging = false;
	let dragStart = { x: 0, y: 0 };
	let showAllLinks = false;
	let linksToShow = 10;

	function handleMouseDown(event: MouseEvent) {
		// Only start dragging if clicking on the header or the node itself (not on buttons or content)
		const target = event.target as HTMLElement;
		if (
			target.closest('.expand-button') ||
			target.closest('.link-button') ||
			target.closest('.more-links')
		) {
			return; // Don't drag if clicking on interactive elements
		}

		isDragging = true;
		dragStart = { x: event.clientX - node.position.x, y: event.clientY - node.position.y };
		event.stopPropagation();
	}

	function handleMouseMove(event: MouseEvent) {
		if (isDragging) {
			const newPosition = {
				x: event.clientX - dragStart.x,
				y: event.clientY - dragStart.y
			};
			onPositionUpdate(newPosition);
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Global mouse move handler for better dragging
	function handleGlobalMouseMove(event: MouseEvent) {
		if (isDragging) {
			const newPosition = {
				x: event.clientX - dragStart.x,
				y: event.clientY - dragStart.y
			};
			onPositionUpdate(newPosition);
		}
	}

	// Global mouse up handler
	function handleGlobalMouseUp() {
		isDragging = false;
	}

	function toggleExpanded() {
		isExpanded = !isExpanded;
		if (!isExpanded) {
			showAllLinks = false; // Reset when collapsing
		}
	}

	function handleLinkClick(linkUrl: string) {
		onLinkClick(linkUrl);
	}

	function handleShowMore() {
		showAllLinks = true;
	}

	function handleWheel(event: WheelEvent) {
		// Prevent the event from bubbling up to the canvas
		event.stopPropagation();

		const linksGrid = event.currentTarget as HTMLElement;
		linksGrid.scrollTop += event.deltaY;
	}

	// Set up global event listeners when dragging starts
	$: if (isDragging && typeof window !== 'undefined') {
		window.addEventListener('mousemove', handleGlobalMouseMove);
		window.addEventListener('mouseup', handleGlobalMouseUp);
	} else if (typeof window !== 'undefined') {
		window.removeEventListener('mousemove', handleGlobalMouseMove);
		window.removeEventListener('mouseup', handleGlobalMouseUp);
	}

	$: displayedLinks = showAllLinks
		? node.linkSummary?.regular_links || []
		: (node.linkSummary?.regular_links || []).slice(0, linksToShow);
</script>

<div
	class="path-node"
	class:selected={isSelected}
	class:expanded={isExpanded}
	class:dark={isDark}
	style="left: {node.position.x}px; top: {node.position.y}px;"
	on:mousedown={handleMouseDown}
	on:click={onSelect}
>
	<div class="node-header">
		<div class="node-title">
			<span class="node-level">L{node.level}</span>
			<span class="node-url">{node.url}</span>
		</div>
		<button class="expand-button" on:click|stopPropagation={toggleExpanded}>
			{isExpanded ? '−' : '+'}
		</button>
	</div>

	{#if node.isLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<span>Analyzing...</span>
		</div>
	{:else if node.error}
		<ErrorDisplay error={node.error} />
	{:else if node.linkSummary && isExpanded}
		<div class="node-content">
			<div class="summary-stats">
				<div class="stat">
					<span class="stat-label">Total Links:</span>
					<span class="stat-value">{node.linkSummary.total_links}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Main Text:</span>
					<span class="stat-value">{node.linkSummary.main_text_links}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Regular Links:</span>
					<span class="stat-value">{node.linkSummary.regular_links_within_main_text}</span>
				</div>
			</div>

			{#if node.linkSummary.regular_links.length > 0}
				<div class="links-section">
					<h4>Clickable Links:</h4>
					<div class="links-grid" on:wheel={handleWheel}>
						{#each displayedLinks as link}
							<button class="link-button" on:click={() => handleLinkClick(link)}>
								<span class="link-text">{link}</span>
							</button>
						{/each}
						{#if !showAllLinks && node.linkSummary.regular_links.length > linksToShow}
							<button class="more-links" on:click={handleShowMore}>
								+{node.linkSummary.regular_links.length - linksToShow} more
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.path-node {
		position: absolute;
		width: 300px;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		cursor: move;
		transition: all 0.2s ease;
		z-index: 2;
	}

	.path-node.dark {
		background: #1f2937;
		border-color: #374151;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
	}

	.path-node.selected {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.path-node.dark.selected {
		border-color: #60a5fa;
		box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
	}

	.path-node.expanded {
		width: 500px;
	}

	.node-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		border-bottom: 1px solid #f3f4f6;
		background: #f9fafb;
		border-radius: 0.5rem 0.5rem 0 0;
	}

	.path-node.dark .node-header {
		border-bottom-color: #374151;
		background: #374151;
	}

	.node-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.node-level {
		background: #3b82f6;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.path-node.dark .node-level {
		background: #60a5fa;
	}

	.node-url {
		font-size: 0.875rem;
		color: #374151;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.path-node.dark .node-url {
		color: #f9fafb;
	}

	.expand-button {
		background: none;
		border: none;
		font-size: 1.25rem;
		font-weight: bold;
		color: #6b7280;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		transition: all 0.2s;
	}

	.expand-button:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.path-node.dark .expand-button {
		color: #9ca3af;
	}

	.path-node.dark .expand-button:hover {
		background: #4b5563;
		color: #f9fafb;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		color: #6b7280;
	}

	.path-node.dark .loading-state {
		color: #9ca3af;
	}

	.loading-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid #e5e7eb;
		border-top: 2px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.path-node.dark .loading-spinner {
		border-color: #374151;
		border-top-color: #60a5fa;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.node-content {
		padding: 1rem;
	}

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.stat {
		text-align: center;
		padding: 0.5rem;
		background: #f9fafb;
		border-radius: 0.375rem;
	}

	.path-node.dark .stat {
		background: #374151;
	}

	.stat-label {
		display: block;
		font-size: 0.75rem;
		color: #6b7280;
		margin-bottom: 0.25rem;
	}

	.path-node.dark .stat-label {
		color: #9ca3af;
	}

	.stat-value {
		display: block;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.path-node.dark .stat-value {
		color: #f9fafb;
	}

	.links-section h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		color: #374151;
	}

	.path-node.dark .links-section h4 {
		color: #f9fafb;
	}

	.links-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 250px;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.links-grid::-webkit-scrollbar {
		width: 6px;
	}

	.links-grid::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 3px;
	}

	.links-grid::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}

	.links-grid::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	.path-node.dark .links-grid::-webkit-scrollbar-track {
		background: #374151;
	}

	.path-node.dark .links-grid::-webkit-scrollbar-thumb {
		background: #6b7280;
	}

	.path-node.dark .links-grid::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}

	.link-button {
		text-align: left;
		padding: 0.75rem;
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: #374151;
		cursor: pointer;
		transition: all 0.2s;
		word-break: break-all;
		line-height: 1.4;
		display: flex;
		align-items: flex-start;
		width: 100%;
		min-height: 2.5rem;
		white-space: normal;
	}

	.link-button:hover {
		background: #e5e7eb;
		border-color: #d1d5db;
		transform: translateX(2px);
	}

	.path-node.dark .link-button {
		background: #374151;
		border-color: #4b5563;
		color: #f9fafb;
	}

	.path-node.dark .link-button:hover {
		background: #4b5563;
		border-color: #6b7280;
	}

	.link-text {
		display: block;
		width: 100%;
		overflow-wrap: break-word;
		word-wrap: break-word;
		hyphens: auto;
	}

	.more-links {
		text-align: center;
		padding: 0.75rem;
		color: #6b7280;
		font-size: 0.875rem;
		font-style: italic;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.more-links:hover {
		background: #e5e7eb;
		color: #374151;
	}

	.path-node.dark .more-links {
		background: #374151;
		border-color: #4b5563;
		color: #9ca3af;
	}

	.path-node.dark .more-links:hover {
		background: #4b5563;
		color: #f9fafb;
	}
</style>
