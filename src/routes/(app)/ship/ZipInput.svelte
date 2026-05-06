<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { lookupPostalCode } from '$lib/ship/postal-lookup';

	type Props = {
		value: string;
		placeholder?: string;
		id?: string;
		size?: 'sm' | 'md';
		oninput?: () => void;
		onlookup: (address: string) => void;
	};

	let { value = $bindable(), placeholder, id, size = 'md', oninput, onlookup }: Props = $props();

	let loading = $state(false);
	let error = $state<'not_found' | 'network' | null>(null);

	const handleLookup = async () => {
		const clean = value.replace(/-/g, '');
		if (!/^\d{7}$/.test(clean)) return;
		loading = true;
		const result = await lookupPostalCode(clean);
		loading = false;
		if (result.ok) onlookup(result.address);
		else error = result.error;
	};
</script>

<div class="flex gap-1">
	<Input bind:value {id} {placeholder} oninput={() => { error = null; oninput?.(); }} class={size === 'sm' ? 'h-7 text-xs' : ''} />
	<button
		type="button"
		onclick={handleLookup}
		disabled={loading}
		class={[
			'flex shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50',
			size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
		]}
	>
		{#if loading}
			<span class="text-[10px]">…</span>
		{:else}
			<SearchIcon class={size === 'sm' ? 'size-3' : 'size-3.5'} />
		{/if}
	</button>
</div>
{#if error}
	<p class="text-xs text-destructive">
		{error === 'not_found' ? 'Postal code not found' : 'Network error'}
	</p>
{/if}
