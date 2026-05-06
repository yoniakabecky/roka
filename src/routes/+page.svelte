<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { navLinks, type NavLink } from '$lib/nav';
	import { version } from '../../package.json';

	const toolColor = {
		'/csv-studio': {
			shadowClass: 'group-hover:shadow-primary/50'
		},
		'/ship': {
			shadowClass: 'group-hover:shadow-secondary/50'
		}
	} satisfies Record<NavLink['path'], { shadowClass: string }>;
</script>

<svelte:head>
	<title>Roka</title>
	<meta name="description" content="Roka is filtration in Japanese." />
</svelte:head>

<div class="flex h-screen flex-1 flex-col items-center justify-center gap-8 p-6">
	<div class="text-center">
		<h1 class="text-2xl font-bold">Welcome to Roka 🎉</h1>
		<span class="text-xs text-muted-foreground">v{version}</span>
	</div>

	<div class="flex gap-4">
		{#each navLinks as link (link.path)}
			<a href={resolve(link.path)} class="group block w-56">
				<Card.Root
					class={[
						'flex h-36 flex-col justify-between transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-foreground group-hover:shadow-lg',
						toolColor[link.path]
					]}
				>
					<Card.Header>
						<Card.Title class="text-lg font-semibold">{link.label}</Card.Title>
						<Card.Description class="mt-1 text-xs text-muted-foreground">
							<!-- NOTE: to display translations, write description here -->
							{#if link.path === '/csv-studio'}
								Filter, sort, and export CSV files with ease.
							{:else if link.path === '/ship'}
								Generate shipping labels from CSV order data.
							{/if}
						</Card.Description>
					</Card.Header>
					<div
						class="flex justify-end px-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground"
					>
						<ArrowRight size={16} />
					</div>
				</Card.Root>
			</a>
		{/each}
	</div>
</div>
