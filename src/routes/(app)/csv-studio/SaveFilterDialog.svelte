<script lang="ts">
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
		open = $bindable(false),
		savedFilters,
		onSave
	}: {
		open: boolean;
		savedFilters: SavedFilter[];
		onSave: (name: string) => { error?: string };
	} = $props();

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
