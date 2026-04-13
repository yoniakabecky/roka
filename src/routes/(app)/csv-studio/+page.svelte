<script lang="ts">
	import Papa from 'papaparse';
	import PawIcon from '@lucide/svelte/icons/paw-print';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import Dropzone from '$lib/components/Dropzone.svelte';
	import CsvTable from './CsvTable.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Combobox } from '$lib/components/ui/combobox';

	let columns = $state<string[]>([]);
	let rows = $state<Record<string, string>[]>([]);
	let colVisible = $state<Record<string, boolean>>({});
	let colFiltersOpen = $state<Record<string, boolean>>({});
	let colFilters = $state<Record<string, string[]>>({});
	let loading = $state(false);
	let filename = $state('');

	const visibleColumns = $derived(columns.filter((c) => colVisible[c]));

	const activeFilters = $derived(Object.entries(colFilters).filter(([, vals]) => vals.length > 0));

	const filteredRows = $derived(
		activeFilters.length === 0
			? rows
			: rows.filter((row) => activeFilters.every(([col, vals]) => vals.includes(row[col] ?? '')))
	);

	const colUniqueValues = $derived(
		Object.fromEntries(
			columns.map((c) => [
				c,
				[...new Set(rows.map((r) => r[c] ?? '').filter(Boolean))].slice(0, 200)
			])
		)
	);

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
				colVisible = Object.fromEntries(columns.map((c) => [c, true]));
				colFiltersOpen = {};
				colFilters = Object.fromEntries(columns.map((c) => [c, []]));
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
			<span>Filtered: <strong class="text-secondary">{filteredRows.length}</strong></span>
			<span>Columns: <strong class="text-secondary">{visibleColumns.length}</strong></span>
			<div class="flex-1"></div>
			<!-- export buttons added later -->
		</div>

		<!-- Main grid -->
		<div class="flex flex-1 overflow-hidden">
			<!-- Left sidebar -->
			<aside class="w-64 overflow-y-auto border-r border-border">
				<div class="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background py-2 pr-2 pl-1">
					<p
						class="grow-1 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
					>
						Columns
					</p>
					<Button
						variant="outline"
						size="xs"
						onclick={() => columns.forEach((c) => (colVisible[c] = true))}>All</Button
					>
					<Button
						variant="outline"
						size="xs"
						onclick={() => columns.forEach((c) => (colVisible[c] = false))}>None</Button
					>
				</div>

				{#each columns as col (col)}
					<!-- Column row -->
					<div class="flex items-center gap-1 px-3 py-1 hover:bg-muted/50">
						<Checkbox bind:checked={colVisible[col]} id={col} class="shrink-0 cursor-pointer" />
						<Label class="min-w-0 truncate text-xs" for={col}>{col}</Label>
						<div class="flex-1"></div>
						<Button
							variant="ghost"
							size="icon-xs"
							class={[
								'cursor-pointer',
								colFilters[col]?.length > 0 ? 'text-primary' : 'text-muted-foreground'
							]}
							onclick={() => (colFiltersOpen[col] = !colFiltersOpen[col])}
						>
							<FilterIcon class="size-3" />
						</Button>
					</div>

					<!-- Filter section -->
					{#if colFiltersOpen[col]}
						<div class="px-2 pb-2">
							<Combobox
								options={colUniqueValues[col] ?? []}
								bind:value={colFilters[col]}
								placeholder="Filter values…"
								searchPlaceholder="Search values…"
							/>
						</div>
					{/if}
				{/each}
			</aside>

			<!-- Right: table pane -->
			<div class="flex flex-1 flex-col overflow-hidden">
				<CsvTable rows={filteredRows} columns={visibleColumns} />
			</div>
		</div>
	</div>
{/if}
