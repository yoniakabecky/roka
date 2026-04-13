<script lang="ts">
	import { resolve } from '$app/paths';
	import { buttonVariants } from '$lib/components/ui/button';
</script>

<svelte:head>
	<title>Roka</title>
	<meta name="description" content="Roka is filtration in Japanese." />
</svelte:head>

<div class="flex h-screen flex-1 flex-col items-center justify-center gap-6 p-6">
	<h1>Welcome to Roka 🎉</h1>

	<a href={resolve('/csv-studio')} class={buttonVariants({ variant: 'default', size: 'lg' })}>
		CSV Studio
	</a>
</div>
