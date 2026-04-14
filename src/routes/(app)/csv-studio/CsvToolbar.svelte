<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/download';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button';
	import { useCsvStudio } from './csv-studio.svelte';

	const { handleFile, clearData, doExportCsv, doExportPdf } = useCsvStudio();

	let fileInput = $state<HTMLInputElement | null>(null);
</script>

<div class="flex shrink-0 items-center gap-3 px-4 pt-2">
	<input
		bind:this={fileInput}
		type="file"
		accept=".csv"
		class="hidden"
		onchange={(e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) handleFile(file);
			(e.target as HTMLInputElement).value = '';
		}}
	/>
	<Button onclick={() => fileInput?.click()}>
		<UploadIcon class="size-3" />
		Import New CSV
	</Button>
	<Button variant="destructive" onclick={clearData}>
		<Trash2Icon class="size-3" />
		Clear
	</Button>
	<div class="flex-1"></div>
	<Button variant="secondary" onclick={doExportCsv}>
		<DownloadIcon class="size-3" />
		Export CSV
	</Button>
	<Button variant="secondary" onclick={doExportPdf}>
		<FileTextIcon class="size-3" />
		Export PDF
	</Button>
</div>
