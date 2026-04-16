<script lang="ts">
	import TurtleIcon from '@lucide/svelte/icons/turtle';
	import Dropzone from '$lib/components/Dropzone.svelte';
	import { useCsvStudio } from './csv-studio.svelte';
	import CsvTable from './CsvTable.svelte';
	import CsvToolbar from './CsvToolbar.svelte';
	import CsvSidebar from './CsvSidebar.svelte';

	const studio = useCsvStudio();
</script>

<svelte:head>
	<title>CSV Studio - Roka</title>
	<meta name="description" content="CSV Studio is a tool for exporting filtered CSV data." />
</svelte:head>

<h1 class="sr-only">CSV Studio</h1>

{#if studio.loading}
	<div class="flex flex-1 items-center justify-center gap-3 text-muted-foreground">
		<TurtleIcon class="size-5" />
		<span class="text-sm">Parsing file…</span>
	</div>
{:else if studio.rows.length === 0}
	<Dropzone onfile={studio.handleFile} />
{:else}
	<div class="flex flex-1 flex-col overflow-hidden">
		<CsvToolbar />

		<!-- Stats row -->
		<div class="flex shrink-0 items-center gap-5 border-b border-border px-4 py-2 text-xs">
			<span>Rows: <strong class="text-secondary">{studio.rows.length}</strong></span>
			<span>
				Filtered:
				<strong class="text-secondary">
					{studio.filteredRows.length === studio.rows.length ? '-' : studio.filteredRows.length}
				</strong>
			</span>
			<span>Columns: <strong class="text-secondary">{studio.visibleColumns.length}</strong></span>
			<div class="flex-1"></div>
			{#if studio.filename}
				<span class="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
					{studio.filename}
				</span>
			{/if}
		</div>

		<!-- Main grid -->
		<div class="flex flex-1 overflow-hidden">
			<CsvSidebar />
			<div class="relative flex flex-1 flex-col overflow-hidden">
				{#if studio.filtering}
					<div
						class="absolute inset-0 z-20 flex h-full w-full items-center justify-center text-muted-foreground backdrop-blur-[2px]"
					>
						<span class="inline-block text-sm">Applying filter…</span>
					</div>
				{/if}
				<CsvTable
					rows={studio.sortedRows}
					columns={studio.visibleColumns}
					colRename={studio.colRename}
					sortCol={studio.sortCol}
					sortDir={studio.sortDir}
					handleSort={studio.handleSort}
				/>
			</div>
		</div>
	</div>
{/if}
