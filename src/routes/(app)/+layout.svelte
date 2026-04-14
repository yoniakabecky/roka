<script>
	import AppHeader from '$lib/components/AppHeader.svelte';

	let { children, data } = $props();
</script>

<div class="flex h-screen flex-col">
	<AppHeader locale={data.locale} />
	<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
		{@render children()}
	</div>
</div>
