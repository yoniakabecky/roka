import { SvelteDate } from 'svelte/reactivity';

export type ColIndex = Map<string, Set<number>>; // value → row indices
export type FullIndex = Map<string, ColIndex>; // col → ColIndex

export const buildColumnIndex = (rows: Record<string, string>[], columns: string[]): FullIndex => {
	const index: FullIndex = new Map();
	for (const col of columns) {
		const colIdx: ColIndex = new Map();
		for (let i = 0; i < rows.length; i++) {
			const val = rows[i][col] ?? '';
			if (!val) continue;
			let set = colIdx.get(val);
			if (!set) {
				set = new Set();
				colIdx.set(val, set);
			}
			set.add(i);
		}
		index.set(col, colIdx);
	}
	return index;
};

const intersectOtherFilters = (
	index: FullIndex,
	otherValueFilters: [string, string[]][]
): Set<number> | null => {
	let candidates: Set<number> | null = null;
	for (const [col, vals] of otherValueFilters) {
		const colIdx = index.get(col);
		if (!colIdx) continue;
		const union: Set<number> = new Set();
		for (const v of vals) {
			const s = colIdx.get(v);
			if (s) for (const i of s) union.add(i);
		}
		if (candidates === null) {
			candidates = union;
		} else {
			for (const i of candidates) {
				if (!union.has(i)) candidates.delete(i);
			}
		}
	}
	return candidates;
};

// Pre-parses boundary dates once per filter pass so per-row cost is only the cell parse.
const makeDatePredicate = (
	filters: [string, { from: string; to: string }][]
): ((row: Record<string, string>) => boolean) => {
	const parsed = filters.map(([col, { from, to }]) => {
		const fromDate = from ? new Date(from) : null;
		const toDate = to ? new Date(`${to}T23:59:59.999`) : null;
		return [
			col,
			fromDate && !isNaN(fromDate.getTime()) ? fromDate.getTime() : null,
			toDate && !isNaN(toDate.getTime()) ? toDate.getTime() : null
		] as [string, number | null, number | null];
	});
	return (row) =>
		parsed.every(([col, fromMs, toMs]) => {
			const cellVal = row[col] ?? '';
			if (!cellVal) return false;
			const cellMs = new Date(cellVal).getTime();
			if (isNaN(cellMs)) return false;
			if (fromMs !== null && cellMs < fromMs) return false;
			if (toMs !== null && cellMs > toMs) return false;
			return true;
		});
};

export const computeFilteredRows = (
	rows: Record<string, string>[],
	index: FullIndex,
	activeValueFilters: [string, string[]][],
	activeDateFilters: [string, { from: string; to: string }][]
): Record<string, string>[] => {
	if (activeValueFilters.length === 0 && activeDateFilters.length === 0) return rows;

	const candidates = intersectOtherFilters(index, activeValueFilters);
	let result: Record<string, string>[];
	if (candidates === null) {
		result = rows;
	} else {
		result = [];
		for (let i = 0; i < rows.length; i++) {
			if (candidates.has(i)) result.push(rows[i]);
		}
	}

	if (activeDateFilters.length > 0) {
		result = result.filter(makeDatePredicate(activeDateFilters));
	}
	return result;
};

export const computeCrossFilteredValues = (
	col: string,
	rows: Record<string, string>[],
	index: FullIndex,
	activeValueFilters: [string, string[]][],
	activeDateFilters: [string, { from: string; to: string }][]
): string[] => {
	const otherValueFilters = activeValueFilters.filter(([c]) => c !== col);
	const otherDateFilters = activeDateFilters.filter(([c]) => c !== col);

	const candidates = intersectOtherFilters(index, otherValueFilters);

	let candidateRows: Record<string, string>[];
	if (candidates === null) {
		candidateRows = rows;
	} else {
		candidateRows = [];
		for (let i = 0; i < rows.length; i++) {
			if (candidates.has(i)) candidateRows.push(rows[i]);
		}
	}
	if (otherDateFilters.length > 0) {
		candidateRows = candidateRows.filter(makeDatePredicate(otherDateFilters));
	}

	const seen = new Set<string>();
	for (const row of candidateRows) {
		const v = row[col] ?? '';
		if (v) seen.add(v);
	}
	return [...seen];
};

export const isLikelyDate = (samples: string[]): boolean => {
	const checked = samples.filter(Boolean).slice(0, 50);
	if (checked.length === 0) return false;
	const validCount = checked.filter((v) => {
		if (/^-?\d+(\.\d+)?$/.test(v)) return false;
		const d = new SvelteDate(v);
		return !isNaN(d.getTime());
	}).length;
	return validCount / checked.length >= 0.8;
};

export const isMatchesDateFilters = (
	row: Record<string, string>,
	filters: [string, { from: string; to: string }][]
): boolean =>
	filters.every(([col, { from, to }]) => {
		const cellVal = row[col] ?? '';
		if (!cellVal) return false;
		const cellMs = new Date(cellVal).getTime();
		if (isNaN(cellMs)) return false;
		if (from) {
			const fromMs = new Date(from).getTime();
			if (!isNaN(fromMs) && cellMs < fromMs) return false;
		}
		if (to) {
			const toMs = new Date(`${to}T23:59:59.999`).getTime();
			if (!isNaN(toMs) && cellMs > toMs) return false;
		}
		return true;
	});
