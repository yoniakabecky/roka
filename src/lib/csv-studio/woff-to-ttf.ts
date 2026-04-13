/**
 * Converts a WOFF1 font buffer to a TTF ArrayBuffer, using the browser's
 * built-in DecompressionStream to expand zlib-compressed tables.
 *
 * jsPDF only accepts TTF (SFNT) data via addFileToVFS/addFont.
 * WOFF is the same format with an extra header and optional per-table
 * zlib compression, so we parse, decompress, and reassemble as TTF.
 */

const decompressZlib = async (data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> => {
	const ds = new DecompressionStream('deflate');
	const writer = ds.writable.getWriter();
	const reader = ds.readable.getReader();
	writer.write(data);
	writer.close();
	const chunks: Uint8Array<ArrayBuffer>[] = [];
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
	}
	const total = chunks.reduce((n, c) => n + c.length, 0);
	const out = new Uint8Array(total);
	let pos = 0;
	for (const c of chunks) {
		out.set(c, pos);
		pos += c.length;
	}
	return out;
};

export const woffToBase64Ttf = async (woffBuffer: ArrayBuffer): Promise<string> => {
	const src = new DataView(woffBuffer);
	const raw = new Uint8Array(woffBuffer);

	const flavor = src.getUint32(4); // sfVersion to carry over to TTF
	const numTables = src.getUint16(12);

	// WOFF table directory: starts at byte 44, each entry is 20 bytes
	const woffTables: {
		tag: number;
		offset: number;
		compLen: number;
		origLen: number;
		checksum: number;
	}[] = [];
	for (let i = 0; i < numTables; i++) {
		const b = 44 + i * 20;
		woffTables.push({
			tag: src.getUint32(b),
			offset: src.getUint32(b + 4),
			compLen: src.getUint32(b + 8),
			origLen: src.getUint32(b + 12),
			checksum: src.getUint32(b + 16)
		});
	}

	// Decompress each table (uncompressed when compLen === origLen)
	const tableData: Uint8Array[] = [];
	for (const t of woffTables) {
		const slice = raw.slice(t.offset, t.offset + t.compLen);
		tableData.push(t.compLen === t.origLen ? slice : await decompressZlib(slice));
	}

	// TTF layout: 12-byte offset table + (numTables × 16)-byte dir + padded table data
	const pad4 = (n: number) => (n + 3) & ~3;
	const dirStart = 12;
	const dataStart = dirStart + numTables * 16;
	const offsets: number[] = [];
	let cursor = dataStart;
	for (let i = 0; i < numTables; i++) {
		offsets.push(cursor);
		cursor += pad4(woffTables[i].origLen);
	}

	const ttfBuf = new ArrayBuffer(cursor);
	const out = new DataView(ttfBuf);
	const outBytes = new Uint8Array(ttfBuf);

	// Offset table (12 bytes)
	const maxPow2 = 1 << Math.floor(Math.log2(numTables));
	out.setUint32(0, flavor);
	out.setUint16(4, numTables);
	out.setUint16(6, maxPow2 * 16); // searchRange
	out.setUint16(8, Math.log2(maxPow2)); // entrySelector
	out.setUint16(10, numTables * 16 - maxPow2 * 16); // rangeShift

	// Table directory (16 bytes per table)
	for (let i = 0; i < numTables; i++) {
		const b = dirStart + i * 16;
		out.setUint32(b, woffTables[i].tag);
		out.setUint32(b + 4, woffTables[i].checksum);
		out.setUint32(b + 8, offsets[i]);
		out.setUint32(b + 12, woffTables[i].origLen);
	}

	// Table data
	for (let i = 0; i < numTables; i++) {
		outBytes.set(tableData[i], offsets[i]);
	}

	// Convert to base64 in chunks to avoid call-stack limits on large buffers
	const CHUNK = 8192;
	let b64 = '';
	for (let i = 0; i < outBytes.length; i += CHUNK) {
		b64 += String.fromCharCode(...outBytes.subarray(i, Math.min(i + CHUNK, outBytes.length)));
	}
	return btoa(b64);
};
