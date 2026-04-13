<script>
	import AppHeader from '$lib/components/AppHeader.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen flex-col">
	<AppHeader />
	<div class="flex h-full flex-1 flex-col">
		{@render children()}
	</div>
</div>
