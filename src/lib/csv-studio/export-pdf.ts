import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { woffToBase64Ttf } from './woff-to-ttf';
import notoSansJpWoffUrl from '@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff?url';

type ShowSaveFilePicker = (options: {
	suggestedName?: string;
	types?: Array<{ description?: string; accept: Record<string, string[]> }>;
}) => Promise<{
	createWritable: () => Promise<{
		write: (data: Blob) => Promise<void>;
		close: () => Promise<void>;
	}>;
}>;

const FONT_NAME = 'NotoSansJP';
let cachedFontBase64: string | null = null;

const loadFont = async (): Promise<string> => {
	if (cachedFontBase64) return cachedFontBase64;
	const response = await fetch(notoSansJpWoffUrl);
	const woffBuffer = await response.arrayBuffer();
	cachedFontBase64 = await woffToBase64Ttf(woffBuffer);
	return cachedFontBase64;
};

export const exportPdf = async (
	rows: Record<string, string>[],
	visibleColumns: string[],
	colRename: Record<string, string>,
	stem: string
) => {
	const headers = visibleColumns.map((c) => colRename[c] ?? c);
	const body = rows.map((row) => visibleColumns.map((c) => row[c] ?? ''));

	const fontBase64 = await loadFont();

	const doc = new jsPDF({ orientation: 'landscape' });
	doc.addFileToVFS(`${FONT_NAME}.ttf`, fontBase64);
	doc.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal');

	autoTable(doc, {
		head: [headers],
		body,
		theme: 'grid',
		styles: { font: FONT_NAME, fontSize: 8, cellPadding: 2 },
		headStyles: { font: FONT_NAME, fontStyle: 'normal', fillColor: [206, 126, 0] },
		horizontalPageBreak: true,
		horizontalPageBreakRepeat: 0
	});

	const suggestedName = `${stem}.pdf`;

	const showSaveFilePicker = (window as Window & { showSaveFilePicker?: ShowSaveFilePicker })
		.showSaveFilePicker;

	if (showSaveFilePicker) {
		try {
			const handle = await showSaveFilePicker({
				suggestedName,
				types: [{ description: 'PDF file', accept: { 'application/pdf': ['.pdf'] } }]
			});
			const blob = doc.output('blob');
			const writable = await handle.createWritable();
			await writable.write(blob);
			await writable.close();
			return;
		} catch (e: unknown) {
			if (e instanceof Error && e.name === 'AbortError') return;
		}
	}

	doc.save(suggestedName);
};
