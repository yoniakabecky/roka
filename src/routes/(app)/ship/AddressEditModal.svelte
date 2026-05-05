<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/circle-check';
	import { untrack } from 'svelte';
	import type { AddressOverride } from '$lib/ship/yupack';
	import { SHOPIFY_FIELDS, shippingAddressLine1, normalizePhone } from '$lib/ship/shopify';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let {
		order,
		currentOverride,
		onconfirm,
		onclose
	}: {
		order: Record<string, string>;
		currentOverride: AddressOverride | undefined;
		onconfirm: (data: AddressOverride | null) => void;
		onclose: () => void;
	} = $props();

	type Mode = 'shipping' | 'custom';

	const shippingName = $derived(order[SHOPIFY_FIELDS.SHIPPING_NAME] ?? '');
	const shippingZip = $derived(order[SHOPIFY_FIELDS.SHIPPING_ZIP] ?? '');
	const shippingAddr1 = $derived(shippingAddressLine1(order));
	const shippingAddr2 = $derived(order[SHOPIFY_FIELDS.SHIPPING_ADDRESS2] ?? '');
	const shippingPhone = $derived(normalizePhone(order[SHOPIFY_FIELDS.SHIPPING_PHONE] ?? ''));

	let mode = $state<Mode>(untrack(() => (currentOverride ? 'custom' : 'shipping')));
	let custom = $state<AddressOverride>(
		untrack(() =>
			currentOverride
				? { ...currentOverride }
				: { name: '', zipcode: '', address1: '', address2: '', phone: '' }
		)
	);

	const selectMode = (next: Mode) => {
		if (next === 'custom' && mode === 'shipping') {
			custom = {
				name: shippingName,
				zipcode: shippingZip,
				address1: shippingAddr1,
				address2: shippingAddr2,
				phone: shippingPhone
			};
		}
		mode = next;
	};

	const confirm = () => {
		onconfirm(mode === 'shipping' ? null : { ...custom });
		onclose();
	};
</script>

<Dialog
	open={true}
	onOpenChange={(v) => {
		if (!v) onclose();
	}}
>
	<DialogContent class="max-w-2xl">
		<DialogHeader>
			<DialogTitle>Edit Delivery Address</DialogTitle>
		</DialogHeader>

		<div class="flex flex-col gap-3">
			<button
				type="button"
				class="relative flex-1 cursor-pointer rounded-lg border p-4 text-left transition-colors {mode ===
				'shipping'
					? 'border-primary bg-primary/5'
					: 'border-border hover:bg-muted/40'}"
				onclick={() => selectMode('shipping')}
			>
				<p class="mb-2 text-sm font-semibold">Shipping Address</p>
				<div class="space-y-0.5 text-xs text-muted-foreground">
					<p>{shippingName}</p>
					<p>〒{shippingZip}</p>
					<p>{shippingAddr1}</p>
					{#if shippingAddr2}
						<p>{shippingAddr2}</p>
					{/if}
					<p>{shippingPhone}</p>
				</div>

				{#if mode === 'shipping'}
					<div class="absolute top-3 right-3 text-primary">
						<CheckIcon class="inline-block size-4" />
					</div>
				{/if}
			</button>

			<button
				type="button"
				class="relative flex-1 cursor-pointer rounded-lg border p-4 text-left transition-colors {mode ===
				'custom'
					? 'border-primary bg-primary/5'
					: 'border-border hover:bg-muted/40'}"
				onclick={() => selectMode('custom')}
			>
				<p class="mb-2 text-sm font-semibold">Custom</p>
				{#if mode === 'custom'}
					<div class="absolute top-3 right-3 text-primary">
						<CheckIcon class="inline-block size-4" />
					</div>

					<div class="space-y-1.5">
						<Input bind:value={custom.name} placeholder={shippingName} class="h-7 text-xs" />
						<Input bind:value={custom.zipcode} placeholder={shippingZip} class="h-7 text-xs" />
						<Input bind:value={custom.address1} placeholder={shippingAddr1} class="h-7 text-xs" />
						<Input bind:value={custom.address2} placeholder={shippingAddr2} class="h-7 text-xs" />
						<Input bind:value={custom.phone} placeholder={shippingPhone} class="h-7 text-xs" />
					</div>
				{:else}
					<p class="text-xs text-muted-foreground">Enter a custom address.</p>
				{/if}
			</button>
		</div>

		<DialogFooter>
			<Button variant="ghost" onclick={onclose}>Cancel</Button>
			<Button onclick={confirm}>Confirm</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
