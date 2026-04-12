<script lang="ts">
	import { resolve } from "$app/paths";

  let { email = '' }: { email?: string } = $props();
</script>

<header class="flex items-center justify-between h-14 px-6 bg-background border-b border-border">
  <a href={resolve('/')}>
    <span class="font-sans font-bold text-2xl text-foreground">Roka</span>
  </a>

  {#if email}
    <span class="text-sm text-muted-foreground">{email}</span>
  {/if}
</header>
