<script lang="ts">
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import type { SavedFilter } from './csv-studio.svelte';

	let {
		disabled = false,
		savedFilters,
		onSave
	}: {
		disabled?: boolean;
		savedFilters: SavedFilter[];
		onSave: (name: string) => { error?: string };
	} = $props();

	let open = $state(false);
	let filterName = $state('');
	let saveError = $state('');

	const nameExists = $derived(savedFilters.some((f) => f.name === filterName.trim()));

	$effect(() => {
		if (open) {
			filterName = '';
			saveError = '';
		}
	});

	const onConfirm = () => {
		const name = filterName.trim();
		if (!name) {
			saveError = 'Name cannot be empty.';
			return;
		}
		const result = onSave(name);
		if (result.error) {
			saveError = result.error;
			return;
		}
		open = false;
	};
</script>

<Button variant="outline" {disabled} onclick={() => (open = true)}>
	<BookmarkIcon class="size-3" />
	Save Filter
</Button>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Save Filter Preset</DialogTitle>
		</DialogHeader>
		<div class="pb-4">
			<Input
				placeholder="Preset name"
				bind:value={filterName}
				onkeydown={(e) => e.key === 'Enter' && onConfirm()}
			/>
			{#if nameExists}
				<p class="mt-1.5 text-xs text-destructive">
					A preset with this name already exists. Saving will overwrite the existing preset.
				</p>
			{/if}
			{#if saveError}
				<p class="mt-1.5 text-xs text-destructive">{saveError}</p>
			{/if}
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button onclick={onConfirm}>
				{nameExists ? 'Overwrite' : 'Save'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
