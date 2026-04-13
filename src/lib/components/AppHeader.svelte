<script lang="ts">
	import { resolve } from '$app/paths';

	let { email = '' }: { email?: string } = $props();
</script>

<header
	class="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6"
>
	<a href={resolve('/')}>
		<span class="font-sans text-2xl font-bold text-foreground">Roka</span>
	</a>

	{#if email}
		<span class="text-sm text-muted-foreground">{email}</span>
	{/if}
</header>
