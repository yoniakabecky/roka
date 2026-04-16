<script lang="ts">
	import FilterIcon from '@lucide/svelte/icons/filter';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import { Combobox } from '$lib/components/ui/combobox';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import Label from '$lib/components/ui/label/label.svelte';
	import DateRangeFilter from './DateRangeFilter.svelte';
	import { useCsvStudio } from './csv-studio.svelte';

	const studio = useCsvStudio();
</script>

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
			onclick={() => studio.columns.forEach((c) => (studio.colVisible[c] = true))}>All</Button
		>
		<Button
			variant="outline"
			size="xs"
			onclick={() => studio.columns.forEach((c) => (studio.colVisible[c] = false))}>None</Button
		>
	</div>

	{#each studio.columns as col (col)}
		<!-- Column row -->
		<div class="flex items-center gap-1 px-3 py-1 hover:bg-muted">
			<Checkbox bind:checked={studio.colVisible[col]} id={col} class="shrink-0 cursor-pointer" />
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
								studio.colFilters[col]?.length > 0 ||
								studio.colDateFilters[col]?.from !== '' ||
								studio.colDateFilters[col]?.to !== '' ||
								studio.colEmptyFilters[col] !== null
									? 'text-primary hover:text-primary/60'
									: 'text-muted-foreground'
							]}
							{...props}
							onclick={() => (studio.colFiltersOpen[col] = !studio.colFiltersOpen[col])}
						>
							<FilterIcon class="size-3" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent side="right">Filter</TooltipContent>
			</Tooltip>
		</div>

		<!-- Filter section -->
		{#if studio.colFiltersOpen[col]}
			<div class="gap-1 px-2 py-1">
				<Tabs
					value={studio.colEmptyFilters[col] ?? 'all'}
					onValueChange={(v) => {
						const mode = v === 'all' ? null : (v as 'empty' | 'nonempty');
						studio.colEmptyFilters[col] = mode;
						if (mode !== null) {
							studio.colFilters[col] = [];
							studio.colDateFilters[col] = { from: '', to: '' };
						}
					}}
				>
					<TabsList class="w-full">
						<TabsTrigger value="all" class="flex-1">All</TabsTrigger>
						<TabsTrigger value="empty" class="flex-1">Empty</TabsTrigger>
						<TabsTrigger value="nonempty" class="flex-1">Non-empty</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
			<div class={studio.colEmptyFilters[col] !== null ? 'pointer-events-none opacity-40' : ''}>
				{#if studio.dateColumns.has(col)}
					<DateRangeFilter
						bind:from={studio.colDateFilters[col].from}
						bind:to={studio.colDateFilters[col].to}
					/>
				{:else}
					<div class="px-2 pb-2">
						<Combobox
							options={studio.colAvailableValues[col] ?? []}
							bind:value={studio.colFilters[col]}
							placeholder="Filter values…"
							searchPlaceholder="Search values…"
						/>
					</div>
				{/if}
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
			<Button variant="outline" size="xs" onclick={studio.resetColRename}>Reset</Button>
		</div>
		{#each studio.columns as col (col)}
			<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-3 py-1">
				<span class="truncate text-xs text-muted-foreground" title={col}>{col}</span>
				<span class="text-xs text-muted-foreground">→</span>
				<input
					class="w-full rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-foreground outline-none focus:border-primary"
					type="text"
					value={studio.colRename[col] ?? col}
					placeholder={col}
					oninput={(e) =>
						(studio.colRename[col] = (e.currentTarget as HTMLInputElement).value || col)}
				/>
			</div>
		{/each}
	</div>
</aside>
