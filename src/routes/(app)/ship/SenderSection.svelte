<script lang="ts">
	import { isSenderComplete, saveSender, type SenderProfile } from '$lib/ship/sender';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import PackageIcon from '@lucide/svelte/icons/package';

	let { sender = $bindable() }: { sender: SenderProfile } = $props();

	let complete = $derived(isSenderComplete(sender));
	let open = $state(!isSenderComplete(sender));
</script>

<div class="border-b border-border">
	<button
		class="flex w-full items-center justify-between px-6 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
		onclick={() => (open = !open)}
	>
		<span class="flex items-center gap-2">
			<PackageIcon class="size-4" />
			Sender Info
			{#if !complete}
				<span class="rounded bg-destructive/15 px-1.5 py-0.5 text-xs font-normal text-destructive">
					Required
				</span>
			{/if}
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
				<Label for="sender-zip" class="text-xs">
					Zip Code <span class="text-destructive">*</span>
				</Label>
				<Input
					id="sender-zip"
					placeholder="123-4567"
					bind:value={sender.zipcode}
					oninput={() => saveSender(sender)}
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="sender-phone" class="text-xs">
					Phone Number<span class="text-destructive">*</span>
				</Label>
				<Input
					id="sender-phone"
					placeholder="090-1234-5678"
					bind:value={sender.phone}
					oninput={() => saveSender(sender)}
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="sender-name" class="text-xs">
					Name <span class="text-destructive">*</span>
				</Label>
				<Input
					id="sender-name"
					placeholder="Roka Corp"
					bind:value={sender.name}
					oninput={() => saveSender(sender)}
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="sender-email" class="text-xs">Email</Label>
				<Input
					id="sender-email"
					type="email"
					placeholder="orders@example.com (optional)"
					bind:value={sender.email}
					oninput={() => saveSender(sender)}
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="sender-address" class="text-xs">
					Address <span class="text-destructive">*</span>
				</Label>
				<Input
					id="sender-address"
					placeholder="123 Main St"
					bind:value={sender.address}
					oninput={() => saveSender(sender)}
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="sender-address2" class="text-xs">Address 2</Label>
				<Input
					id="sender-address2"
					placeholder="Apt, suite, etc. (optional)"
					bind:value={sender.address2}
					oninput={() => saveSender(sender)}
				/>
			</div>
		</div>
	{/if}
</div>
