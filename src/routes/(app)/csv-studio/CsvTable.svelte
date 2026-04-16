<script lang="ts">
	import {
		Table,
		TableHeader,
		TableHead,
		TableBody,
		TableRow,
		TableCell
	} from '$lib/components/ui/table';

	let {
		rows,
		columns,
		colRename = {},
		sortCol,
		sortDir,
		handleSort
	}: {
		rows: Record<string, string>[];
		columns: string[];
		colRename?: Record<string, string>;
		sortCol: string | null;
		sortDir: 'asc' | 'desc';
		handleSort: (col: string) => void;
	} = $props();

	const MAX_ROWS = 5000;

	const displayRows = $derived(rows.slice(0, MAX_ROWS));
	const truncated = $derived(rows.length > MAX_ROWS);
</script>

<div class="flex flex-1 flex-col overflow-auto">
	{#if truncated}
		<div
			class="shrink-0 border-b border-amber-900/50 bg-amber-950/40 px-6 py-2 text-xs text-amber-400"
		>
			Showing first {MAX_ROWS} of {rows.length} rows
		</div>
	{/if}

	<Table class="border-b border-border">
		<TableHeader class="sticky top-0 z-10 bg-card">
			<TableRow class="border-b-2 hover:bg-transparent">
				{#each columns as col (col)}
					<TableHead
						class="cursor-pointer border-r border-border text-xs font-semibold tracking-wider whitespace-nowrap uppercase transition-colors select-none last:border-r-0 {sortCol ===
						col
							? 'text-primary hover:text-primary'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => handleSort(col)}
					>
						{colRename[col] ?? col}{#if sortCol === col}<span class="ml-1"
								>{sortDir === 'asc' ? '↑' : '↓'}</span
							>{/if}
					</TableHead>
				{/each}
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each displayRows as row, i (i)}
				<TableRow>
					{#each columns as col (col)}
						<TableCell
							class="max-w-60 overflow-hidden border-r border-border/50 text-ellipsis whitespace-nowrap text-muted-foreground last:border-r-0"
							title={row[col] ?? ''}
						>
							{row[col] ?? ''}
						</TableCell>
					{/each}
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
