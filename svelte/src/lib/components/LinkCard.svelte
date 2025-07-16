<script lang="ts">
	import type { LinkCardColor } from '$lib/types/linkAnalysis';

	export let title: string;
	export let value: number;
	export let icon: string;
	export let color: LinkCardColor;

	const colorClasses = {
		blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
		green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700',
		purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
		indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700',
		orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700'
	};

	const colorStyles = {
		blue: 'background: #eff6ff; border: 2px solid #bfdbfe; color: #1d4ed8;',
		green: 'background: #f0fdf4; border: 2px solid #bbf7d0; color: #15803d;',
		purple: 'background: #faf5ff; border: 2px solid #c4b5fd; color: #7c3aed;',
		indigo: 'background: #eef2ff; border: 2px solid #c7d2fe; color: #4338ca;',
		orange: 'background: #fff7ed; border: 2px solid #fed7aa; color: #ea580c;'
	};
</script>

<div
	class="cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg {colorClasses[
		color
	]}"
	style="padding: 16px; border-radius: 12px; transition: all 0.3s; cursor: pointer; {colorStyles[
		color
	]}"
>
	<div class="flex items-center space-x-3" style="display: flex; align-items: center; gap: 12px;">
		<span class="text-2xl" style="font-size: 24px;">{icon}</span>
		<div>
			<h3 class="text-sm font-semibold" style="font-weight: 600; font-size: 14px;">{title}</h3>
			<p class="text-2xl font-bold" style="font-size: 24px; font-weight: 700;">{value}</p>
		</div>
	</div>
</div>

<style>
	div:hover {
		transform: scale(1.05);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}
</style>
