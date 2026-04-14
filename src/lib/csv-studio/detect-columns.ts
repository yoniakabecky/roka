import { SvelteDate } from 'svelte/reactivity';

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
		const cellDate = new SvelteDate(cellVal);
		if (isNaN(cellDate.getTime())) return false;
		if (from) {
			const fromDate = new SvelteDate(from);
			if (!isNaN(fromDate.getTime()) && cellDate < fromDate) return false;
		}
		if (to) {
			const endOfDay = new SvelteDate(`${to}T23:59:59.999`);
			if (!isNaN(endOfDay.getTime()) && cellDate > endOfDay) return false;
		}
		return true;
	});
