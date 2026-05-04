<script lang="ts">
	import {
		formatShopifyDate,
		normalizePhone,
		shippingAddressLine1,
		SHOPIFY_FIELDS
	} from '$lib/ship/shopify';
	import { Button } from '$lib/components/ui/button';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let {
		orders,
		filename,
		exporting,
		onexport,
		onclear
	}: {
		orders: Record<string, string>[];
		filename: string;
		exporting: boolean;
		onexport: () => void;
		onclear: () => void;
	} = $props();
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
				<th class="pr-4 pb-2 font-medium">Zip Code</th>
				<th class="pr-4 pb-2 font-medium">Phone Number</th>
				<th class="pr-4 pb-2 font-medium">Address</th>
				<th class="pb-2 font-medium">Address 2</th>
			</tr>
		</thead>
		<tbody>
			{#each orders as order (order[SHOPIFY_FIELDS.NAME])}
				<tr class="border-b border-border/50 hover:bg-muted/30">
					<td class="py-1.5 pr-4 font-mono text-xs">{order[SHOPIFY_FIELDS.NAME]}</td>
					<td class="py-1.5 pr-4 tabular-nums">
						{formatShopifyDate(order[SHOPIFY_FIELDS.CREATED_AT] ?? '')}
					</td>
					<td class="py-1.5 pr-4">{order[SHOPIFY_FIELDS.SHIPPING_NAME]}</td>
					<td class="py-1.5 pr-4 font-mono text-xs">{order[SHOPIFY_FIELDS.SHIPPING_ZIP]}</td>
					<td class="py-1.5 pr-4 font-mono text-xs">
						{normalizePhone(order[SHOPIFY_FIELDS.SHIPPING_PHONE] ?? '')}
					</td>
					<td class="py-1.5 pr-4">{shippingAddressLine1(order)}</td>
					<td class="py-1.5">{order[SHOPIFY_FIELDS.SHIPPING_ADDRESS2] ?? ''}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
