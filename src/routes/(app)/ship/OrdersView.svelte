<script lang="ts">
	import { formatShopifyDate, SHOPIFY_FIELDS } from '$lib/ship/shopify';
	import { resolveAddress, type AddressOverride } from '$lib/ship/yupack';
	import { Button } from '$lib/components/ui/button';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import AddressEditModal from './AddressEditModal.svelte';

	let {
		orders,
		filename,
		exporting,
		onexport,
		onclear,
		addressOverrides,
		onaddressoverride
	}: {
		orders: Record<string, string>[];
		filename: string;
		exporting: boolean;
		onexport: () => void;
		onclear: () => void;
		addressOverrides: Map<string, AddressOverride>;
		onaddressoverride: (orderName: string, data: AddressOverride | null) => void;
	} = $props();

	let editingOrder = $state<Record<string, string> | null>(null);
</script>

<div class="flex shrink-0 items-center gap-4 border-b border-border px-6 py-2 text-xs">
	<span>Orders: <strong class="text-secondary">{orders.length}</strong></span>
	<div class="flex-1"></div>
	{#if filename}
		<span class="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{filename}</span>
	{/if}
	<Button variant="ghost" size="sm" onclick={onclear}>
		<Trash2Icon class="mr-1 size-3" />
		Clear
	</Button>
	<Button onclick={onexport} disabled={exporting || orders.length === 0}>
		<DownloadIcon class="mr-1 size-3" />
		{exporting ? 'Exporting…' : 'Export CSV'}
	</Button>
</div>

<div class="flex-1 overflow-auto px-6 py-4">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border text-left text-xs text-muted-foreground">
				<th class="pr-4 pb-2 font-medium">Order #</th>
				<th class="pr-4 pb-2 font-medium">Order Date</th>
				<th class="pr-4 pb-2 font-medium">Customer Name</th>
				<th class="pr-4 pb-2 font-medium">Zipcode</th>
				<th class="pr-4 pb-2 font-medium">Phone Number</th>
				<th class="pr-4 pb-2 font-medium">Address</th>
				<th class="pb-2 font-medium">Address 2</th>
				<th class="w-8 pb-2"></th>
			</tr>
		</thead>
		<tbody>
			{#each orders as order (order[SHOPIFY_FIELDS.NAME])}
				{@const override = addressOverrides.get(order[SHOPIFY_FIELDS.NAME])}
				{@const display = resolveAddress(order, override)}
				<tr class="border-b border-border/50 text-xs hover:bg-muted/30">
					<td class="py-1.5 pr-4">
						{order[SHOPIFY_FIELDS.NAME]}
						{#if override}
							<span class="ml-1 inline-block size-1.5 rounded-full bg-amber-400"></span>
						{/if}
					</td>
					<td class="py-1.5 pr-4 tabular-nums">
						{formatShopifyDate(order[SHOPIFY_FIELDS.CREATED_AT] ?? '')}
					</td>
					<td class="py-1.5 pr-4"> {display.name}</td>
					<td class="py-1.5 pr-4">{display.zipcode}</td>
					<td class="py-1.5 pr-4">{display.phone}</td>
					<td class="py-1.5 pr-4">{display.address1}</td>
					<td class="py-1.5 pr-4">{display.address2}</td>
					<td class="py-1.5">
						<Button
							variant="ghost"
							size="icon"
							class="size-6"
							onclick={() => (editingOrder = order)}
						>
							<PencilIcon class="size-3" />
						</Button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if editingOrder}
	<AddressEditModal
		order={editingOrder}
		currentOverride={addressOverrides.get(editingOrder[SHOPIFY_FIELDS.NAME])}
		onconfirm={(data) => {
			onaddressoverride(editingOrder![SHOPIFY_FIELDS.NAME], data);
		}}
		onclose={() => {
			editingOrder = null;
		}}
	/>
{/if}
