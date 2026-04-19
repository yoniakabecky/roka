<script lang="ts">
	import BookmarkCheckIcon from '@lucide/svelte/icons/bookmark-check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import type { SavedFilter } from './csv-studio.svelte';

	let {
		savedFilters,
		appliedPresetName,
		isPresetModified,
		onSelect,
		onDelete
	}: {
		savedFilters: SavedFilter[];
		appliedPresetName: string | null;
		isPresetModified: boolean;
		onSelect: (filter: SavedFilter) => void;
		onDelete: (name: string) => void;
	} = $props();

	let open = $state(false);
	let menuOpenFor = $state<string | null>(null);

	const label = $derived(
		appliedPresetName ? `${appliedPresetName}${isPresetModified ? ' *' : ''}` : 'Saved Filters'
	);
</script>

{#snippet filterActions(filter: SavedFilter)}
	<Popover.Root
		open={menuOpenFor === filter.name}
		onOpenChange={(v) => (menuOpenFor = v ? filter.name : null)}
	>
		<Popover.Trigger>
			{#snippet child({ props })}
				<button
					class="shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground"
					aria-label="Options for {filter.name}"
					{...props}
				>
					<EllipsisIcon class="size-3" />
				</button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content align="start" class="w-32 p-1">
			<button
				class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
				onclick={() => {
					menuOpenFor = null;
					onDelete(filter.name);
				}}
			>
				<Trash2Icon class="size-3" />
				Delete
			</button>
		</Popover.Content>
	</Popover.Root>
{/snippet}

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button variant="outline" disabled={savedFilters.length === 0} {...props}>
				<BookmarkCheckIcon class="size-3" />
				<span class="max-w-32 truncate">{label}</span>
				<ChevronDownIcon class="size-3" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content align="start" class="w-56 p-1">
		{#each savedFilters as filter (filter.name)}
			<div class="group flex items-center rounded-sm px-2 hover:bg-muted">
				<button
					class="flex-1 truncate py-1.5 text-left text-xs"
					onclick={() => {
						open = false;
						onSelect(filter);
					}}
				>
					{filter.name}
				</button>
				{@render filterActions(filter)}
			</div>
		{/each}
	</Popover.Content>
</Popover.Root>
