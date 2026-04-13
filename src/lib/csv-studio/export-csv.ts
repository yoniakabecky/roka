import Papa from 'papaparse';

type ShowSaveFilePicker = (options: {
	suggestedName?: string;
	types?: Array<{ description?: string; accept: Record<string, string[]> }>;
}) => Promise<{
	createWritable: () => Promise<{
		write: (data: Blob) => Promise<void>;
		close: () => Promise<void>;
	}>;
}>;

export const exportCsv = async (
	rows: Record<string, string>[],
	visibleColumns: string[],
	colRename: Record<string, string>,
	stem: string
) => {
	const renamedHeaders = visibleColumns.map((c) => colRename[c] ?? c);
	const exportData = rows.map((row) =>
		Object.fromEntries(visibleColumns.map((c) => [colRename[c] ?? c, row[c] ?? '']))
	);
	const csv = Papa.unparse({ fields: renamedHeaders, data: exportData });
	const blob = new Blob([csv], { type: 'text/csv' });
	const suggestedName = `${stem}.csv`;

	const showSaveFilePicker = (window as Window & { showSaveFilePicker?: ShowSaveFilePicker })
		.showSaveFilePicker;

	if (showSaveFilePicker) {
		try {
			const handle = await showSaveFilePicker({
				suggestedName,
				types: [{ description: 'CSV file', accept: { 'text/csv': ['.csv'] } }]
			});
			const writable = await handle.createWritable();
			await writable.write(blob);
			await writable.close();
			return;
		} catch (e: unknown) {
			if (e instanceof Error && e.name === 'AbortError') return;
		}
	}

	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = suggestedName;
	a.click();
	URL.revokeObjectURL(url);
};
