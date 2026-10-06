<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/circle-check';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { untrack } from 'svelte';
	import type { AddressOverride } from '#lib/ship/yupack.js';
	import {
		SHOPIFY_FIELDS,
		shippingAddressLine1,
		normalizePhone,
		isForeignPhone
	} from '#lib/ship/shopify.js';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '#lib/components/ui/dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import ZipInput from './ZipInput.svelte';

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
	const shippingPhoneRemoved = $derived(isForeignPhone(order[SHOPIFY_FIELDS.SHIPPING_PHONE] ?? ''));

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

	const customComplete = $derived(
		!!(custom.name.trim() && custom.zipcode.trim() && custom.address1.trim())
	);

	const confirm = () => {
		onconfirm(mode === 'shipping' ? null : { ...custom, phone: normalizePhone(custom.phone) });
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
					{#if shippingPhoneRemoved}
						<p class="inline-flex items-start gap-1 text-amber-500">
							<TriangleAlertIcon class="size-3 shrink-0" />
							Overseas number removed — select custom below and enter a Japanese phone number.
						</p>
					{:else}
						<p>{shippingPhone}</p>
					{/if}
				</div>

				{#if mode === 'shipping'}
					<div class="absolute top-3 right-3 text-primary">
						<CheckIcon class="inline-block size-4" />
					</div>
				{/if}
			</button>

			<div
				role="button"
				aria-pressed={mode === 'custom'}
				tabindex="0"
				class={[
					'relative flex-1 cursor-pointer rounded-lg border p-4 text-left transition-colors',
					mode === 'custom' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
				]}
				onclick={() => selectMode('custom')}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') selectMode('custom');
				}}
			>
				<p class="mb-2 text-sm font-semibold">Custom</p>
				{#if mode === 'custom'}
					<div class="absolute top-3 right-3 text-primary">
						<CheckIcon class="inline-block size-4" />
					</div>

					<div class="space-y-2">
						<div class="flex flex-col gap-1">
							<Label for="custom-name" class="text-xs text-muted-foreground">
								Name <span class="text-destructive">*</span>
							</Label>
							<Input
								id="custom-name"
								bind:value={custom.name}
								placeholder={shippingName}
								class="h-7 text-xs"
							/>
						</div>
						<div class="flex flex-col gap-1">
							<Label for="custom-zip" class="text-xs text-muted-foreground">
								Zipcode <span class="text-destructive">*</span>
							</Label>
							<ZipInput
								id="custom-zip"
								bind:value={custom.zipcode}
								placeholder={shippingZip}
								size="sm"
								onlookup={(addr) => (custom.address1 = addr)}
							/>
						</div>
						<div class="flex flex-col gap-1">
							<Label for="custom-address1" class="text-xs text-muted-foreground">
								Address <span class="text-destructive">*</span>
							</Label>
							<Input
								id="custom-address1"
								bind:value={custom.address1}
								placeholder={shippingAddr1}
								class="h-7 text-xs"
							/>
						</div>
						<div class="flex flex-col gap-1">
							<Label for="custom-address2" class="text-xs text-muted-foreground">Address 2</Label>
							<Input
								id="custom-address2"
								bind:value={custom.address2}
								placeholder={shippingAddr2}
								class="h-7 text-xs"
							/>
						</div>
						<div class="flex flex-col gap-1">
							<Label for="custom-phone" class="text-xs text-muted-foreground">Phone Number</Label>
							<Input
								id="custom-phone"
								bind:value={custom.phone}
								placeholder={shippingPhone}
								class="h-7 text-xs"
							/>
						</div>
						{#if isForeignPhone(custom.phone)}
							<p class="text-xs text-destructive">
								Overseas numbers aren't accepted and will be removed.
							</p>
						{/if}
					</div>
				{:else}
					<p class="text-xs text-muted-foreground">Enter a custom address.</p>
				{/if}
			</div>
		</div>

		<DialogFooter>
			<Button variant="ghost" onclick={onclose}>Cancel</Button>
			<Button onclick={confirm} disabled={mode === 'custom' && !customComplete}>Confirm</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
