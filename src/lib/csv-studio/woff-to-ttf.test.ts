import { describe, it, expect } from 'vitest';
import { deflateSync } from 'node:zlib';
import { woffToBase64Ttf } from '$lib/csv-studio/woff-to-ttf';

// ---------------------------------------------------------------------------
// WOFF1 fixture builder
//
// WOFF header (44 bytes):
//   0  signature  0x774F4646 ('wOFF')
//   4  flavor     sfVersion carried into TTF offset table
//  12  numTables  (uint16)
//  44  table directory starts (20 bytes × numTables)
//
// Table directory entry (20 bytes):
//   0  tag       (uint32)
//   4  offset    byte offset from start of WOFF file (uint32)
//   8  compLen   (uint32)
//  12  origLen   (uint32)
//  16  checksum  (uint32)
// ---------------------------------------------------------------------------
const buildWoff = (
	flavor: number,
	tables: { tag: number; data: Uint8Array; compress?: boolean }[]
): ArrayBuffer => {
	const processed = tables.map(({ tag, data, compress = false }) => {
		const compData = compress
			? new Uint8Array(deflateSync(Buffer.from(data)))
			: data;
		return { tag, compData, origLen: data.length, compLen: compData.length };
	});

	const numTables = processed.length;
	const dataStart = 44 + numTables * 20;

	let cursor = dataStart;
	const woffOffsets: number[] = [];
	for (const t of processed) {
		woffOffsets.push(cursor);
		cursor += t.compLen;
	}

	const buf = new ArrayBuffer(cursor);
	const view = new DataView(buf);
	const bytes = new Uint8Array(buf);

	view.setUint32(0, 0x774f4646); // 'wOFF'
	view.setUint32(4, flavor);
	view.setUint32(8, cursor); // total file length
	view.setUint16(12, numTables);

	for (let i = 0; i < processed.length; i++) {
		const t = processed[i];
		const b = 44 + i * 20;
		view.setUint32(b, t.tag);
		view.setUint32(b + 4, woffOffsets[i]);
		view.setUint32(b + 8, t.compLen);
		view.setUint32(b + 12, t.origLen);
		view.setUint32(b + 16, 0); // checksum
	}

	for (let i = 0; i < processed.length; i++) {
		bytes.set(processed[i].compData, woffOffsets[i]);
	}

	return buf;
};

// Decode the base64 TTF back to DataView + bytes for assertion
const decodeTtf = (b64: string) => {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return { view: new DataView(bytes.buffer), bytes };
};

// TTF offset table field positions
// 0: flavor (uint32), 4: numTables (uint16), 6: searchRange (uint16),
// 8: entrySelector (uint16), 10: rangeShift (uint16)
// Table directory starts at byte 12, each entry is 16 bytes:
// 0: tag, 4: checksum, 8: offset, 12: origLen

const FLAVOR = 0x00010000; // TrueType sfVersion
const TAG_HEAD = 0x68656164;
const TAG_CMAP = 0x636d6170;
const TAG_GLYF = 0x676c7966;

const smallData = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
// 100 repeating bytes — compresses well so compLen < origLen
const compressibleData = new Uint8Array(100).fill(0xaa);

// ---------------------------------------------------------------------------

describe('woffToBase64Ttf — output format', () => {
	it('returns a valid base64 string', async () => {
		const woff = buildWoff(FLAVOR, [{ tag: TAG_HEAD, data: smallData }]);
		const result = await woffToBase64Ttf(woff);
		expect(() => atob(result)).not.toThrow();
		expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
	});

	it('decoded TTF starts with the WOFF flavor bytes', async () => {
		const woff = buildWoff(FLAVOR, [{ tag: TAG_HEAD, data: smallData }]);
		const result = await woffToBase64Ttf(woff);
		const { view } = decodeTtf(result);
		expect(view.getUint32(0)).toBe(FLAVOR);
	});

	it('numTables in TTF header matches the WOFF source', async () => {
		const woff = buildWoff(FLAVOR, [
			{ tag: TAG_HEAD, data: smallData },
			{ tag: TAG_CMAP, data: smallData }
		]);
		const result = await woffToBase64Ttf(woff);
		const { view } = decodeTtf(result);
		expect(view.getUint16(4)).toBe(2);
	});

	it('TTF table directory is 16 bytes per table — first data offset = 12 + N×16', async () => {
		const numTables = 3;
		const woff = buildWoff(FLAVOR, [
			{ tag: TAG_HEAD, data: smallData },
			{ tag: TAG_CMAP, data: smallData },
			{ tag: TAG_GLYF, data: smallData }
		]);
		const result = await woffToBase64Ttf(woff);
		const { view } = decodeTtf(result);
		// First table's data offset is at TTF dir entry 0, field offset 8
		const firstDataOffset = view.getUint32(12 + 8);
		expect(firstDataOffset).toBe(12 + numTables * 16);
	});

	it('searchRange, entrySelector, rangeShift correct for N=3', async () => {
		// N=3: maxPow2=2, searchRange=32, entrySelector=1, rangeShift=16
		const woff = buildWoff(FLAVOR, [
			{ tag: TAG_HEAD, data: smallData },
			{ tag: TAG_CMAP, data: smallData },
			{ tag: TAG_GLYF, data: smallData }
		]);
		const result = await woffToBase64Ttf(woff);
		const { view } = decodeTtf(result);
		expect(view.getUint16(6)).toBe(32); // searchRange
		expect(view.getUint16(8)).toBe(1); // entrySelector
		expect(view.getUint16(10)).toBe(16); // rangeShift
	});
});

describe('woffToBase64Ttf — uncompressed table', () => {
	it('passes uncompressed table data through unchanged', async () => {
		const woff = buildWoff(FLAVOR, [{ tag: TAG_HEAD, data: smallData }]);
		const result = await woffToBase64Ttf(woff);
		const { view, bytes } = decodeTtf(result);

		const dataOffset = view.getUint32(12 + 8); // first dir entry, offset field
		const origLen = view.getUint32(12 + 12); // first dir entry, origLen field
		const tableBytes = bytes.slice(dataOffset, dataOffset + origLen);

		expect(Array.from(tableBytes)).toEqual(Array.from(smallData));
	});
});

describe('woffToBase64Ttf — compressed table', () => {
	it('decompresses zlib-compressed table to original bytes', async () => {
		const woff = buildWoff(FLAVOR, [{ tag: TAG_CMAP, data: compressibleData, compress: true }]);
		const result = await woffToBase64Ttf(woff);
		const { view, bytes } = decodeTtf(result);

		const dataOffset = view.getUint32(12 + 8);
		const origLen = view.getUint32(12 + 12);
		const tableBytes = bytes.slice(dataOffset, dataOffset + origLen);

		expect(origLen).toBe(compressibleData.length);
		expect(Array.from(tableBytes)).toEqual(Array.from(compressibleData));
	});
});

describe('woffToBase64Ttf — alignment', () => {
	it('all table offsets in the TTF directory are 4-byte aligned', async () => {
		// Use data lengths that are not multiples of 4 to exercise padding
		const oddData = new Uint8Array([1, 2, 3, 4, 5]); // length 5
		const woff = buildWoff(FLAVOR, [
			{ tag: TAG_HEAD, data: oddData },
			{ tag: TAG_CMAP, data: oddData },
			{ tag: TAG_GLYF, data: oddData }
		]);
		const result = await woffToBase64Ttf(woff);
		const { view } = decodeTtf(result);

		for (let i = 0; i < 3; i++) {
			const offset = view.getUint32(12 + i * 16 + 8);
			expect(offset % 4, `table ${i} offset ${offset} not 4-byte aligned`).toBe(0);
		}
	});
});
