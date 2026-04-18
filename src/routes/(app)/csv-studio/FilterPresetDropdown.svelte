<script lang="ts">
	import BookmarkCheckIcon from '@lucide/svelte/icons/bookmark-check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
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

	const label = $derived(
		appliedPresetName ? `${appliedPresetName}${isPresetModified ? ' *' : ''}` : 'Saved Filters'
	);
</script>

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
	<Popover.Content align="start" class="w-56 p-0">
		<Command.Root>
			<Command.List>
				<Command.Group>
					{#each savedFilters as filter (filter.name)}
						<Command.Item
							value={filter.name}
							onSelect={() => {
								open = false;
								onSelect(filter);
							}}
						>
							<span class="flex-1 truncate text-xs">{filter.name}</span>
							<button
								class="ml-auto shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
								onclick={(e) => {
									e.stopPropagation();
									onDelete(filter.name);
								}}
								aria-label="Delete {filter.name}"
							>
								<Trash2Icon class="size-3" />
							</button>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
