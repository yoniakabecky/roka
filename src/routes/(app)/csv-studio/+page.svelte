<script lang="ts">
	import Papa from 'papaparse';
	import TurtleIcon from '@lucide/svelte/icons/turtle';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import { Combobox } from '$lib/components/ui/combobox';
	import Label from '$lib/components/ui/label/label.svelte';
	import Dropzone from '$lib/components/Dropzone.svelte';
	import { exportCsv } from '$lib/csv-studio/export-csv';
	import { exportPdf } from '$lib/csv-studio/export-pdf';
	import CsvTable from './CsvTable.svelte';

	let columns = $state<string[]>([]);
	let rows = $state<Record<string, string>[]>([]);
	let colVisible = $state<Record<string, boolean>>({});
	let colFiltersOpen = $state<Record<string, boolean>>({});
	let colFilters = $state<Record<string, string[]>>({});
	let colRename = $state<Record<string, string>>({});
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

	const exportStem = $derived(
		(() => {
			const base = filename.replace(/\.[^.]+$/, '');
			return base ? `${base}_roka` : 'export_roka';
		})()
	);

	let fileInput = $state<HTMLInputElement | null>(null);

	const clearData = () => {
		columns = [];
		rows = [];
		colVisible = {};
		colFiltersOpen = {};
		colFilters = {};
		colRename = {};
		filename = '';
	};

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
				colRename = Object.fromEntries(columns.map((c) => [c, c]));
				rows = result.data;
				loading = false;
			}
		});
	};
</script>

<svelte:head>
	<title>CSV Studio - Roka</title>
	<meta name="description" content="CSV Studio is a tool for exporting filtered CSV data." />
</svelte:head>

<h1 class="sr-only">CSV Studio</h1>

{#if loading}
	<div class="flex flex-1 items-center justify-center gap-3 text-muted-foreground">
		<TurtleIcon class="size-5" />
		<span class="text-sm">Parsing file…</span>
	</div>
{:else if rows.length === 0}
	<Dropzone onfile={handleFile} />
{:else}
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Toolbar row -->
		<div class="flex shrink-0 items-center gap-3 px-4 pt-2">
			<input
				bind:this={fileInput}
				type="file"
				accept=".csv"
				class="hidden"
				onchange={(e) => {
					const file = (e.target as HTMLInputElement).files?.[0];
					if (file) handleFile(file);
					(e.target as HTMLInputElement).value = '';
				}}
			/>
			<Button onclick={() => fileInput?.click()}>
				<UploadIcon class="size-3" />
				Import New CSV
			</Button>
			<Button variant="destructive" onclick={clearData}>
				<Trash2Icon class="size-3" />
				Clear
			</Button>
			<div class="flex-1"></div>
			<Button
				variant="secondary"
				onclick={() => exportCsv(filteredRows, visibleColumns, colRename, exportStem)}
			>
				<DownloadIcon class="size-3" />
				Export CSV
			</Button>
			<Button
				variant="secondary"
				onclick={() => exportPdf(filteredRows, visibleColumns, colRename, exportStem)}
			>
				<FileTextIcon class="size-3" />
				Export PDF
			</Button>
		</div>

		<!-- Stats row -->
		<div class="flex shrink-0 items-center gap-5 border-b border-border px-4 py-2 text-xs">
			<span>Rows: <strong class="text-secondary">{rows.length}</strong></span>
			<span>
				Filtered:
				<strong class="text-secondary">
					{filteredRows.length === rows.length ? '-' : filteredRows.length}
				</strong>
			</span>
			<span>Columns: <strong class="text-secondary">{visibleColumns.length}</strong></span>
			<div class="flex-1"></div>
			{#if filename}
				<span class="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{filename}</span>
			{/if}
		</div>

		<!-- Main grid -->
		<div class="flex flex-1 overflow-hidden">
			<!-- Left sidebar -->
			<aside class="w-64 overflow-y-auto border-r border-border bg-muted/50">
				<div
					class="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-muted py-2 pr-2 pl-1"
				>
					<p class="grow px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
					<div class="flex items-center gap-1 px-3 py-1 hover:bg-muted">
						<Checkbox bind:checked={colVisible[col]} id={col} class="shrink-0 cursor-pointer" />
						<Label class="min-w-0 truncate text-xs" for={col}>{col}</Label>
						<div class="flex-1"></div>
						<Tooltip>
							<TooltipTrigger>
								{#snippet child({ props })}
									<Button
										variant="ghost"
										size="icon-xs"
										class={[
											'cursor-pointer',
											colFilters[col]?.length > 0
												? 'text-primary hover:text-primary/60'
												: 'text-muted-foreground'
										]}
										{...props}
										onclick={() => (colFiltersOpen[col] = !colFiltersOpen[col])}
									>
										<FilterIcon class="size-3" />
									</Button>
								{/snippet}
							</TooltipTrigger>
							<TooltipContent side="right">Filter</TooltipContent>
						</Tooltip>
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
				<!-- Rename Columns section -->
				<div class="border-t border-border">
					<div
						class="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-muted py-2 pr-2 pl-4"
					>
						<p class="grow text-xs font-semibold tracking-wider text-muted-foreground uppercase">
							Rename Columns
						</p>
						<Button
							variant="outline"
							size="xs"
							onclick={() => (colRename = Object.fromEntries(columns.map((c) => [c, c])))}
						>
							Reset
						</Button>
					</div>
					{#each columns as col (col)}
						<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-3 py-1">
							<span class="truncate text-xs text-muted-foreground" title={col}>{col}</span>
							<span class="text-xs text-muted-foreground">→</span>
							<input
								class="w-full rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-foreground outline-none focus:border-primary"
								type="text"
								value={colRename[col] ?? col}
								placeholder={col}
								oninput={(e) =>
									(colRename[col] = (e.currentTarget as HTMLInputElement).value || col)}
							/>
						</div>
					{/each}
				</div>
			</aside>

			<!-- Right: table pane -->
			<div class="flex flex-1 flex-col overflow-hidden">
				<CsvTable rows={filteredRows} columns={visibleColumns} {colRename} />
			</div>
		</div>
	</div>
{/if}
