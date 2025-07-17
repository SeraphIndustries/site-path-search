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

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onSelect();
		}
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

	// Use the node properties for color coding
	$: isStartNode = node.isStartNode;
	$: isEndNode = node.isEndNode;
</script>

<div
	class="path-node"
	class:selected={isSelected}
	class:expanded={isExpanded}
	class:dark={isDark}
	class:start-node={isStartNode}
	class:end-node={isEndNode}
	style="left: {node.position.x}px; top: {node.position.y}px;"
	data-level={node.level}
	on:mousedown={handleMouseDown}
	on:click={onSelect}
	on:keydown={handleKeyDown}
	tabindex="0"
	role="button"
	aria-label="Path node for {node.url}"
>
	<div class="node-header">
		<div class="node-title">
			<span class="node-level" class:start-level={isStartNode} class:end-level={isEndNode}
				>{node.level >= 0 ? `L${node.level}` : isStartNode ? 'START' : 'END'}</span
			>
			<span class="node-url">{node.url}</span>
		</div>
		{#if node.level >= 0}
			<button class="expand-button" on:click|stopPropagation={toggleExpanded}>
				{isExpanded ? '−' : '+'}
			</button>
		{/if}
	</div>

	{#if node.level < 0}
		<div class="blank-node-content">
			<span class="blank-message">
				{isStartNode
					? 'Click "Analyze Start URL" to begin'
					: 'Click "Analyze End URL" to set destination'}
			</span>
		</div>
	{:else if node.isLoading}
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

	/* Z-index layering based on node level */
	.path-node[data-level='-1'] {
		z-index: 1;
	}

	.path-node[data-level='0'] {
		z-index: 10;
	}

	.path-node[data-level='1'] {
		z-index: 20;
	}

	.path-node[data-level='2'] {
		z-index: 30;
	}

	.path-node[data-level='3'] {
		z-index: 40;
	}

	.path-node[data-level='4'] {
		z-index: 50;
	}

	.path-node[data-level='5'] {
		z-index: 60;
	}

	.path-node.dark {
		background: #1f2937;
		border-color: #374151;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
	}

	/* Start node styling */
	.path-node.start-node {
		border-color: #3b82f6;
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	}

	.path-node.dark.start-node {
		background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
		border-color: #60a5fa;
	}

	/* End node styling */
	.path-node.end-node {
		border-color: #10b981;
		background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
	}

	.path-node.dark.end-node {
		background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
		border-color: #34d399;
	}

	.path-node.selected {
		border-color: #f59e0b;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
	}

	.path-node.dark.selected {
		border-color: #fbbf24;
		box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
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

	.path-node.start-node .node-header {
		background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
		border-bottom-color: #3b82f6;
	}

	.path-node.dark.start-node .node-header {
		background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
		border-bottom-color: #60a5fa;
	}

	.path-node.end-node .node-header {
		background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
		border-bottom-color: #10b981;
	}

	.path-node.dark.end-node .node-header {
		background: linear-gradient(135deg, #065f46 0%, #047857 100%);
		border-bottom-color: #34d399;
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

	.node-level.start-level {
		background: #1d4ed8;
	}

	.node-level.end-level {
		background: #047857;
	}

	.path-node.dark .node-level {
		background: #60a5fa;
	}

	.path-node.dark .node-level.start-level {
		background: #3b82f6;
	}

	.path-node.dark .node-level.end-level {
		background: #10b981;
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
		display: flex;
		align-items: flex-start;
		width: 100%;
		min-height: 2.5rem;
		white-space: normal;
		word-break: break-all;
		line-height: 1.4;
		height: auto;
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
		line-height: 1.4;
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

	.blank-node-content {
		padding: 1rem;
		text-align: center;
	}

	.blank-message {
		font-size: 0.875rem;
		color: #6b7280;
		font-style: italic;
	}

	.path-node.dark .blank-message {
		color: #9ca3af;
	}
</style>
