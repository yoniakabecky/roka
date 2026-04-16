<script lang="ts">
	import UpIcon from '@lucide/svelte/icons/arrow-up';
	import DownIcon from '@lucide/svelte/icons/arrow-down';
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
			class="shrink-0 border-b border-destructive/30 bg-destructive/10 px-6 py-2 text-xs text-destructive"
		>
			Showing first {MAX_ROWS} of {rows.length} rows
		</div>
	{/if}

	<Table class="border-b border-border">
		<TableHeader class="sticky top-0 z-10 bg-card">
			<TableRow class="border-b-2 hover:bg-transparent">
				{#each columns as col (col)}
					<TableHead
						class={[
							'cursor-pointer border-r border-border text-xs font-semibold tracking-wider whitespace-nowrap uppercase transition-colors select-none last:border-r-0',
							sortCol === col
								? 'text-primary hover:text-primary'
								: 'text-muted-foreground hover:text-foreground'
						]}
						role="columnheader"
						tabindex={0}
						aria-sort={sortCol === col ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
						onclick={() => handleSort(col)}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort(col)}
					>
						<span class="inline-flex">
							{colRename[col] ?? col}
							{#if sortCol === col}
								<span class="ml-1">
									{#if sortDir === 'asc'}
										<UpIcon size={12} />
									{:else}
										<DownIcon size={12} />
									{/if}
								</span>
							{/if}
						</span>
					</TableHead>
				{/each}
			</TableRow>
		</TableHeader>
		<TableBody>
			{#if displayRows.length === 0}
				<TableRow class="hover:bg-transparent">
					<TableCell
						class="py-4 text-center text-xs text-muted-foreground"
						colspan={columns.length}
					>
						No data to display
					</TableCell>
				</TableRow>
			{/if}
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
