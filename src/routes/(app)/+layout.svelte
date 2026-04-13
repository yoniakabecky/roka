<script>
	import AppHeader from '$lib/components/AppHeader.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen flex-col">
	<AppHeader />
	<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
		{@render children()}
	</div>
</div>
