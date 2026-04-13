<script lang="ts">
  import {
    Table,
    TableHeader,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
  } from '$lib/components/ui/table';

  let {
    rows,
    columns,
  }: {
    rows: Record<string, string>[];
    columns: string[];
  } = $props();

  let sortCol = $state<string | null>(null);
  let sortDir = $state<'asc' | 'desc'>('asc');

  const MAX_ROWS = 5000;

  const sortedRows = $derived.by(() => {
    if (!sortCol) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortCol!] ?? '', bv = b[sortCol!] ?? '';
      const an = parseFloat(av), bn = parseFloat(bv);
      const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  });

  const displayRows = $derived(sortedRows.slice(0, MAX_ROWS));
  const truncated = $derived(sortedRows.length > MAX_ROWS);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = 'asc';
    }
  };
</script>

<div class="flex flex-1 flex-col overflow-auto">
  {#if truncated}
    <div class="px-6 py-2 text-xs bg-amber-950/40 text-amber-400 border-b border-amber-900/50 shrink-0">
      Showing first {MAX_ROWS} of {sortedRows.length} rows
    </div>
  {/if}

  <Table>
    <TableHeader class="sticky top-0 z-10 bg-card">
      <TableRow class="hover:bg-transparent border-b-2">
        {#each columns as col (col)}
          <TableHead
            class="cursor-pointer select-none uppercase tracking-wider text-xs font-semibold whitespace-nowrap border-r border-border last:border-r-0 hover:text-foreground transition-colors {sortCol === col ? 'text-primary' : ''}"
            onclick={() => handleSort(col)}
          >
            {col}{#if sortCol === col}<span class="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>{/if}
          </TableHead>
        {/each}
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each displayRows as row, i (i)}
        <TableRow>
          {#each columns as col (col)}
            <TableCell
              class="max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground border-r border-border/50 last:border-r-0"
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
