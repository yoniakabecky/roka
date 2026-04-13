<script>
	import AppHeader from "$lib/components/AppHeader.svelte";

  let { children } = $props();
</script>

<div class="flex flex-col min-h-screen">
  <AppHeader />
  <div class="flex flex-1 flex-col">
    {@render children()}
  </div>
</div>
