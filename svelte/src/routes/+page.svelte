<script lang="ts">
	import { onMount } from 'svelte';
	import LinkFinder from '$lib/components/LinkFinder.svelte';
</script>

<main
	class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8"
	style="min-height: 100vh; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 32px;"
>
	<div class="mx-auto max-w-4xl" style="max-width: 896px; margin: 0 auto;">
		<h1
			class="mb-8 text-center text-4xl font-bold text-blue-900"
			style="font-size: 36px; font-weight: 700; color: #1e3a8a; text-align: center; margin-bottom: 32px;"
		>
			Site Page Link Finder
		</h1>

		<LinkFinder />
	</div>
</main>
