<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';

	let { from = $bindable(''), to = $bindable('') }: { from?: string; to?: string } = $props();

	const clear = () => {
		from = '';
		to = '';
	};

	const hasValue = $derived(from !== '' || to !== '');
</script>

<div class="flex flex-col gap-1 px-2 pb-2">
	<div class="grid grid-cols-2 gap-1">
		<div class="flex flex-col">
			<span class="shrink-0 text-xs text-muted-foreground">From</span>
			<DatePicker bind:value={from} placeholder="Start date" valueClass="border-secondary" />
		</div>
		<div class="flex flex-col">
			<span class="shrink-0 text-[0.625rem] text-muted-foreground">To</span>
			<DatePicker bind:value={to} placeholder="End date" valueClass="border-secondary" />
		</div>
	</div>
	{#if hasValue}
		<Button variant="outline" size="xs" onclick={clear} class="w-full">Clear</Button>
	{/if}
</div>
