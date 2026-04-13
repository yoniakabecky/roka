<script lang="ts">
	import Papa from 'papaparse';
	import PawIcon from '@lucide/svelte/icons/paw-print';
	import Dropzone from '$lib/components/Dropzone.svelte';
	import CsvTable from './CsvTable.svelte';

	let columns = $state<string[]>([]);
	let rows = $state<Record<string, string>[]>([]);
	let loading = $state(false);
	let filename = $state('');

	const handleFile = (file: File) => {
		filename = file.name;
		loading = true;
		Papa.parse<Record<string, string>>(file, {
			header: true,
			skipEmptyLines: true,
			dynamicTyping: false,
			worker: true,
			complete: (result) => {
				columns = result.meta.fields ?? [];
				rows = result.data;
				loading = false;
			}
		});
	};
</script>

<h1 class="sr-only">CSV Studio</h1>

{#if loading}
	<div class="flex flex-1 items-center justify-center gap-3 text-muted-foreground">
		<PawIcon class="size-5" />
		<span class="text-sm">Parsing file…</span>
	</div>
{:else if rows.length === 0}
	<Dropzone onfile={handleFile} />
{:else}
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Toolbar row -->
		<div class="flex shrink-0 items-center gap-2 px-4 py-2">
			<!-- buttons added later -->
			<div class="flex-1"></div>
			{#if filename}
				<span class="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{filename}</span>
			{/if}
		</div>

		<!-- Stats row -->
		<div class="flex shrink-0 items-center gap-6 border-b border-border px-4 py-2 text-xs">
			<span>Rows: <strong class="text-secondary">{rows.length}</strong></span>
			<span>Filtered: <strong class="text-secondary">{rows.length}</strong></span>
			<span>Columns: <strong class="text-secondary">{columns.length}</strong></span>
			<div class="flex-1"></div>
			<!-- export buttons added later -->
		</div>

		<!-- Main grid -->
		<div class="flex flex-1 overflow-hidden">
			<!-- Left sidebar -->
			<aside class="w-52 shrink-0 overflow-y-auto border-r border-border">
				<p class="px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
					Columns
				</p>
				<!-- column list added later -->
			</aside>

			<!-- Right: table pane -->
			<div class="flex flex-1 flex-col overflow-hidden">
				<CsvTable {rows} {columns} />
			</div>
		</div>
	</div>
{/if}
