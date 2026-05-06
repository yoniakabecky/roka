<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import TruckIcon from '@lucide/svelte/icons/truck';

	let open = $state(false);
</script>

<div class="border-b border-border">
	<button
		type="button"
		class="flex w-full items-center justify-between px-6 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
		onclick={() => (open = !open)}
	>
		<span class="flex items-center gap-2">
			<TruckIcon class="size-4" />
			Shipping Settings
		</span>
		{#if open}
			<ChevronUpIcon class="size-4 text-muted-foreground" />
		{:else}
			<ChevronDownIcon class="size-4 text-muted-foreground" />
		{/if}
	</button>

	{#if open}
		<div class="grid grid-cols-2 gap-4 px-6 py-4">
			<div class="flex flex-col gap-1.5">
				<Label for="shipping-company" class="text-xs">Shipping Company</Label>
				<Input id="shipping-company" value="Japan Post" disabled />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="invoice-type" class="text-xs">Invoice Type</Label>
				<Input id="invoice-type" value="ゆうパックシート(A4･2宛分)" disabled />
			</div>
		</div>
	{/if}
</div>
