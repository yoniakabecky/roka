<script lang="ts">
	import BookmarkCheckIcon from '@lucide/svelte/icons/bookmark-check';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import type { SavedFilter } from './csv-studio.svelte';

	let {
		savedFilters,
		appliedPresetName,
		isPresetModified,
		onSelect,
		onDelete,
		onRename
	}: {
		savedFilters: SavedFilter[];
		appliedPresetName: string | null;
		isPresetModified: boolean;
		onSelect: (filter: SavedFilter) => void;
		onDelete: (name: string) => void;
		onRename: (oldName: string, newName: string) => void;
	} = $props();

	let open = $state(false);
	let menuOpenFor = $state<string | null>(null);
	let editingFor = $state<string | null>(null);
	let editingName = $state('');

	const label = $derived(
		appliedPresetName ? `${appliedPresetName}${isPresetModified ? ' *' : ''}` : 'Saved Filters'
	);

	const confirmRename = () => {
		if (!editingFor) return;
		onRename(editingFor, editingName);
		editingFor = null;
	};
</script>

{#snippet editingRow()}
	<input
		class="flex-1 truncate border-b border-border bg-transparent py-1.5 text-xs outline-none"
		bind:value={editingName}
		onkeydown={(e) => {
			if (e.key === 'Enter') confirmRename();
			if (e.key === 'Escape') editingFor = null;
		}}
	/>
	<button
		class="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
		aria-label="Confirm rename"
		onclick={confirmRename}
	>
		<CheckIcon class="size-3" />
	</button>
	<button
		class="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
		aria-label="Cancel rename"
		onclick={() => (editingFor = null)}
	>
		<XIcon class="size-3" />
	</button>
{/snippet}

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
		<Popover.Content align="start" class="w-32 gap-1 p-1">
			<button
				class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
				onclick={() => {
					menuOpenFor = null;
					editingFor = filter.name;
					editingName = filter.name;
				}}
			>
				<PencilIcon class="size-3" />
				Rename
			</button>
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
	<Popover.Content align="start" class="w-56 gap-1 p-1">
		{#each savedFilters as filter (filter.name)}
			<div class="group flex items-center rounded-sm px-2 hover:bg-muted">
				{#if editingFor === filter.name}
					{@render editingRow()}
				{:else}
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
				{/if}
			</div>
		{/each}
	</Popover.Content>
</Popover.Root>
