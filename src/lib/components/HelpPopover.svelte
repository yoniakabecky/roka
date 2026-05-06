<script lang="ts">
	import { onDestroy } from 'svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import HelpIcon from '@lucide/svelte/icons/circle-question-mark';
	import { page } from '$app/state';

	type HelpContent = (typeof helpContent)[keyof typeof helpContent];
	const helpContent = {
		'/csv-studio': {
			title: 'CSV Studio',
			description: 'Import, filter, and export CSV data.',
			steps: [
				'Drop a CSV file (or click to pick one)',
				'Use the sidebar to filter, hide columns, or rename',
				'Sort columns by clicking the header',
				'Export the filtered data as CSV or PDF'
			],
			tips: [
				'Save a filter to quickly restore your view later',
				'Date columns are auto-detected',
				'Hidden columns are excluded from exports',
				'Reloading the page will clear data and filters, but not your saved filters'
			]
		},
		'/ship': {
			title: 'Ship It',
			description: 'Generate shipping labels from Shopify order data.',
			steps: [
				'Fill in your sender information (one-time setup)',
				'Drop (or click to select) a Shopify orders CSV',
				'Check imported orders',
				'Edit any delivery addresses if needed',
				'Export shipping labels'
			],
			tips: [
				'Sender info is saved in your browser',
				'If address is English, click edit and select custom. Use zip code lookup to auto-fill city and town in Japanese'
			]
		}
	};

	const getHelpForPath = (pathname: string): HelpContent | null => {
		for (const [prefix, content] of Object.entries(helpContent)) {
			if (pathname.startsWith(prefix)) return content;
		}
		return null;
	};

	const help = $derived(getHelpForPath(page.url.pathname));

	let open = $state(false);
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	const openHelp = () => {
		clearTimeout(closeTimer);
		open = true;
	};
	const closeHelp = () => {
		closeTimer = setTimeout(() => (open = false), 500);
	};

	onDestroy(() => clearTimeout(closeTimer));
</script>

{#if help}
	<Popover.Root bind:open>
		<Popover.Trigger
			class="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
			aria-label="Help"
			onmouseenter={openHelp}
			onmouseleave={closeHelp}
		>
			<HelpIcon class="h-4 w-4" />
		</Popover.Trigger>
		<Popover.Content align="end" class="w-80" onmouseenter={openHelp} onmouseleave={closeHelp}>
			<Popover.Header>
				<Popover.Title>{help.title}</Popover.Title>
				<Popover.Description>{help.description}</Popover.Description>
			</Popover.Header>
			<ol class="list-decimal space-y-1 pl-4">
				{#each help.steps as step (step)}
					<li>{step}</li>
				{/each}
			</ol>
			{#if help.tips?.length}
				<div class="border-t border-border pt-3">
					<ul class="space-y-1 pl-4 text-muted-foreground">
						{#each help.tips as tip (tip)}
							<li class="list-disc">{tip}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</Popover.Content>
	</Popover.Root>
{/if}
