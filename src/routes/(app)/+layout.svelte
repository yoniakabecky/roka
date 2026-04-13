<script>
	import AppHeader from "$lib/components/AppHeader.svelte";

  let { children } = $props();
</script>

<div class="flex flex-col h-screen">
  <AppHeader />
  <div class="flex flex-1 flex-col h-full">
    {@render children()}
  </div>
</div>
