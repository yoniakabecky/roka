<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import {
		DateFormatter,
		getLocalTimeZone,
		parseDate,
		type DateValue
	} from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { Button, type ButtonSize } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';

	let {
		value = $bindable(''),
		placeholder = 'Pick a date',
		size = 'sm' as ButtonSize
	}: {
		value?: string;
		placeholder?: string;
		size?: ButtonSize;
	} = $props();

	const isIconSize = $derived(
		size === 'icon' || size === 'icon-xs' || size === 'icon-sm' || size === 'icon-lg'
	);

	const df = new DateFormatter('en-US', { dateStyle: 'medium' });

	let calendarValue = $state<DateValue | undefined>(undefined);

	$effect(() => {
		calendarValue = value ? parseDate(value) : undefined;
	});

	const handleSelect = (v: DateValue | undefined) => {
		value = v ? v.toString() : '';
	};
</script>

<Popover>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				{size}
				class={cn(
					!isIconSize && 'w-full justify-start text-left font-normal',
					!value && 'text-muted-foreground'
				)}
				{...props}
			>
				<CalendarIcon class={cn('shrink-0', !isIconSize && 'mr-1 size-3')} />
				{#if !isIconSize}
					{value ? df.format(calendarValue!.toDate(getLocalTimeZone())) : placeholder}
				{/if}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-auto p-0" align="start">
		<Calendar
			type="single"
			bind:value={calendarValue}
			captionLayout="dropdown"
			onValueChange={handleSelect}
		/>
	</PopoverContent>
</Popover>
