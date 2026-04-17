<script lang="ts">
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { cn } from '$lib/utils.js';

	let {
		options,
		value = $bindable([]),
		placeholder = 'Select…',
		searchPlaceholder = 'Search…',
		class: className
	}: {
		options: string[];
		value?: string[];
		placeholder?: string;
		searchPlaceholder?: string;
		class?: string;
	} = $props();

	let open = $state(false);

	const label = $derived(
		value.length === 0 ? placeholder : value.length === 1 ? value[0] : `${value.length} selected`
	);

	const toggle = (opt: string) => {
		value = value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt];
	};
</script>

<Popover.Root bind:open>
	<Popover.Trigger class={cn('w-full', className)}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				size="sm"
				class={cn(
					'w-full justify-between font-normal',
					value.length > 0 && 'border-secondary! text-foreground'
				)}
			>
				<span class="truncate">{label}</span>
				<ChevronsUpDownIcon class="shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[var(--bits-popover-anchor-width)] p-0" align="start">
		<Command.Root>
			<Command.Input placeholder={searchPlaceholder} />
			<Command.List>
				<Command.Empty>No results</Command.Empty>
				<Command.Group>
					{#each options as opt (opt)}
						<Command.Item value={opt} onSelect={() => toggle(opt)}>
							<Checkbox
								checked={value.includes(opt)}
								variant="secondary"
								size="sm"
								class="pointer-events-none"
							/>
							<span class="text-xs">{opt}</span>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
			{#if options.length > 0}
				<div class="flex gap-1 border-t border-border p-1">
					<Button variant="ghost" size="xs" class="flex-1" onclick={() => (value = [...options])}>
						All
					</Button>
					<Button variant="ghost" size="xs" class="flex-1" onclick={() => (value = [])}>
						None
					</Button>
				</div>
			{/if}
		</Command.Root>
	</Popover.Content>
</Popover.Root>
