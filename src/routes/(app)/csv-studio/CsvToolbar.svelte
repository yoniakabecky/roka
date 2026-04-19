<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/download';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { useCsvStudio, type SavedFilter } from './csv-studio.svelte';
	import FilterPresetDropdown from './FilterPresetDropdown.svelte';
	import SaveFilterButton from './SaveFilterButton.svelte';

	const studio = useCsvStudio();

	let fileInput = $state<HTMLInputElement | null>(null);

	const hasActiveFilters = $derived(
		studio.activeFilters.length > 0 ||
			studio.activeDateFilters.length > 0 ||
			studio.activeEmptyFilters.length > 0
	);

	const onSelectPreset = (filter: SavedFilter) => {
		const { noMatch } = studio.loadSavedFilter(filter);
		if (noMatch) {
			toast.warning('No columns from this preset exist in the current file.');
		}
	};
</script>

<div class="flex shrink-0 items-center gap-3 px-4 pt-2">
	<input
		bind:this={fileInput}
		type="file"
		accept=".csv"
		class="hidden"
		onchange={(e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) studio.handleFile(file);
			(e.target as HTMLInputElement).value = '';
		}}
	/>
	<Button onclick={() => fileInput?.click()}>
		<UploadIcon class="size-3" />
		Import New CSV
	</Button>
	<Button variant="destructive" onclick={studio.clearData}>
		<Trash2Icon class="size-3" />
		Clear
	</Button>

	<div class="h-5 w-px bg-border"></div>

	<SaveFilterButton
		disabled={!hasActiveFilters && !studio.appliedPresetName && !studio.hasHiddenColumns}
		savedFilters={studio.savedFilters}
		onSave={studio.saveCurrentFilter}
	/>

	<FilterPresetDropdown
		savedFilters={studio.savedFilters}
		appliedPresetName={studio.appliedPresetName}
		isPresetModified={studio.isPresetModified}
		onSelect={onSelectPreset}
		onDelete={studio.deleteSavedFilter}
		onRename={(oldName, newName) => {
			const { error } = studio.renameSavedFilter(oldName, newName);
			if (error) toast.error(error);
		}}
	/>

	<Button
		variant="outline"
		disabled={!hasActiveFilters && !studio.appliedPresetName && !studio.hasHiddenColumns}
		onclick={studio.resetFilters}
	>
		<RotateCcwIcon class="size-3" />
		Reset
	</Button>

	<div class="flex-1"></div>

	<div class="h-5 w-px bg-border"></div>

	<Button variant="secondary" onclick={studio.doExportCsv}>
		<DownloadIcon class="size-3" />
		Export CSV
	</Button>
	<Button variant="secondary" onclick={studio.doExportPdf}>
		<FileTextIcon class="size-3" />
		Export PDF
	</Button>
</div>
