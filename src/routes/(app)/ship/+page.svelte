<script lang="ts">
	import Dropzone from '$lib/components/Dropzone.svelte';
	import OrdersView from './OrdersView.svelte';
	import SenderSection from './SenderSection.svelte';
	import { useShip } from './ship.svelte';

	const ship = useShip();
</script>

<svelte:head>
	<title>Ship It - Roka</title>
	<meta name="description" content="Generate shipping labels from CSV order data." />
</svelte:head>

<h1 class="sr-only">Ship It</h1>

<div class="flex flex-1 flex-col overflow-y-auto">
	<SenderSection bind:sender={ship.sender} />

	{#if ship.loading}
		<div class="flex flex-1 items-center justify-center gap-3 text-muted-foreground">
			<span class="text-sm">Parsing file…</span>
		</div>
	{:else if ship.orders.length === 0}
		<Dropzone onfile={ship.handleFile} />
	{:else}
		<OrdersView
			orders={ship.orders}
			filename={ship.filename}
			exporting={ship.exporting}
			onexport={ship.exportYupack}
			onclear={ship.clear}
			addressOverrides={ship.addressOverrides}
			onaddressoverride={(name, data) => ship.setAddressOverride(name, data)}
		/>
	{/if}
</div>
