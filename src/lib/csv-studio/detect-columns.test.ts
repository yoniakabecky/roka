import { describe, it, expect } from 'vitest';
import {
	isLikelyDate,
	isMatchesDateFilters,
	buildColumnIndex,
	computeFilteredRows,
	computeCrossFilteredValues
} from '$lib/csv-studio/detect-columns';

// Shared fixture used across the three new describe blocks
const rows = [
	{ city: 'New York', state: 'NY', country: 'US', joined: '2024-01-15' },
	{ city: 'Los Angeles', state: 'CA', country: 'US', joined: '2024-03-20' },
	{ city: 'Chicago', state: 'IL', country: 'US', joined: '2024-06-01' },
	{ city: 'Toronto', state: 'ON', country: 'CA', joined: '2023-12-01' },
	{ city: 'Vancouver', state: 'BC', country: 'CA', joined: '2024-08-15' }
];
const columns = ['city', 'state', 'country', 'joined'];

describe('buildColumnIndex', () => {
	it('returns an empty map for empty rows', () => {
		const index = buildColumnIndex([], columns);
		expect(index.size).toBe(columns.length);
		for (const col of columns) {
			expect(index.get(col)?.size).toBe(0);
		}
	});

	it('returns an empty map for empty columns', () => {
		const index = buildColumnIndex(rows, []);
		expect(index.size).toBe(0);
	});

	it('indexes each column', () => {
		const index = buildColumnIndex(rows, columns);
		expect(index.has('city')).toBe(true);
		expect(index.has('state')).toBe(true);
		expect(index.has('country')).toBe(true);
	});

	it('maps each value to the correct row indices', () => {
		const index = buildColumnIndex(rows, columns);
		expect(index.get('country')?.get('US')).toEqual(new Set([0, 1, 2]));
		expect(index.get('country')?.get('CA')).toEqual(new Set([3, 4]));
	});

	it('each unique value gets its own entry', () => {
		const index = buildColumnIndex(rows, columns);
		expect(index.get('city')?.size).toBe(5); // all cities are unique
	});

	it('skips empty string values', () => {
		const sparseRows = [{ name: 'Alice' }, { name: '' }, { name: 'Bob' }];
		const index = buildColumnIndex(sparseRows, ['name']);
		const nameIdx = index.get('name')!;
		expect(nameIdx.size).toBe(2);
		expect(nameIdx.has('')).toBe(false);
		expect(nameIdx.get('Alice')).toEqual(new Set([0]));
		expect(nameIdx.get('Bob')).toEqual(new Set([2]));
	});

	it('handles a missing column key in a row (treats as empty)', () => {
		const incompleteRows = [{ city: 'NY' }, {}];
		const index = buildColumnIndex(incompleteRows as Record<string, string>[], ['city']);
		expect(index.get('city')?.get('NY')).toEqual(new Set([0]));
		expect(index.get('city')?.size).toBe(1);
	});

	it('a value appearing in multiple rows produces a set with all indices', () => {
		const repeatRows = [{ tag: 'A' }, { tag: 'B' }, { tag: 'A' }, { tag: 'A' }];
		const index = buildColumnIndex(repeatRows, ['tag']);
		expect(index.get('tag')?.get('A')).toEqual(new Set([0, 2, 3]));
	});
});

describe('computeFilteredRows', () => {
	const index = buildColumnIndex(rows, columns);

	it('returns the same array reference when no filters are active', () => {
		const result = computeFilteredRows(rows, index, [], []);
		expect(result).toBe(rows);
	});

	it('returns all rows when filters are empty arrays', () => {
		const result = computeFilteredRows(rows, index, [], []);
		expect(result).toHaveLength(5);
	});

	it('filters by a single value', () => {
		const result = computeFilteredRows(rows, index, [['country', ['US']]], []);
		expect(result).toHaveLength(3);
		expect(result.every((r) => r.country === 'US')).toBe(true);
	});

	it('filters by multiple values within one column (OR within column)', () => {
		const result = computeFilteredRows(rows, index, [['state', ['NY', 'CA']]], []);
		expect(result).toHaveLength(2);
		expect(result.map((r) => r.state).sort()).toEqual(['CA', 'NY']);
	});

	it('applies multiple column filters with AND semantics', () => {
		// country=US AND state=CA → only Los Angeles
		const result = computeFilteredRows(
			rows,
			index,
			[
				['country', ['US']],
				['state', ['CA']]
			],
			[]
		);
		expect(result).toHaveLength(1);
		expect(result[0].city).toBe('Los Angeles');
	});

	it('returns empty array when no rows match', () => {
		const result = computeFilteredRows(rows, index, [['state', ['ZZ']]], []);
		expect(result).toHaveLength(0);
	});

	it('preserves original row order', () => {
		const result = computeFilteredRows(rows, index, [['country', ['US']]], []);
		expect(result.map((r) => r.city)).toEqual(['New York', 'Los Angeles', 'Chicago']);
	});

	it('applies a date filter only', () => {
		// joined >= 2024-06-01
		const result = computeFilteredRows(rows, index, [], [
			['joined', { from: '2024-06-01', to: '' }]
		]);
		expect(result.map((r) => r.city).sort()).toEqual(['Chicago', 'Vancouver']);
	});

	it('combines value filter and date filter', () => {
		// country=US AND joined <= 2024-03-31
		const result = computeFilteredRows(
			rows,
			index,
			[['country', ['US']]],
			[['joined', { from: '', to: '2024-03-31' }]]
		);
		expect(result.map((r) => r.city).sort()).toEqual(['Los Angeles', 'New York']);
	});

	it('handles an unrecognised column in the filter gracefully', () => {
		// column 'missing' is not in the index — the filter is skipped and all rows are returned
		const result = computeFilteredRows(rows, index, [['missing', ['anything']]], []);
		expect(result).toHaveLength(5);
	});

	it('date predicate skips rows where the date cell is empty', () => {
		const mixed = [
			{ city: 'A', joined: '' },
			{ city: 'B', joined: '2024-06-01' }
		];
		const idx = buildColumnIndex(mixed, ['city', 'joined']);
		const result = computeFilteredRows(mixed, idx, [], [['joined', { from: '2024-01-01', to: '' }]]);
		expect(result).toHaveLength(1);
		expect(result[0].city).toBe('B');
	});

	it('date predicate skips rows where the date column key is absent', () => {
		// row[col] is undefined → ?? '' fallback → treated as empty
		const mixed = [
			{ city: 'A' } as Record<string, string>, // 'joined' key entirely absent
			{ city: 'B', joined: '2024-06-01' }
		];
		const idx = buildColumnIndex(mixed, ['city', 'joined']);
		const result = computeFilteredRows(mixed, idx, [], [['joined', { from: '2024-01-01', to: '' }]]);
		expect(result).toHaveLength(1);
		expect(result[0].city).toBe('B');
	});

	it('date predicate skips rows where the date cell is an invalid date', () => {
		const mixed = [
			{ city: 'A', joined: 'not-a-date' },
			{ city: 'B', joined: '2024-06-01' }
		];
		const idx = buildColumnIndex(mixed, ['city', 'joined']);
		const result = computeFilteredRows(mixed, idx, [], [['joined', { from: '2024-01-01', to: '' }]]);
		expect(result).toHaveLength(1);
		expect(result[0].city).toBe('B');
	});

	it('empty filter treats a missing column key as empty', () => {
		// row[col] is undefined → ?? '' gives '', which is falsy → matches 'empty' mode
		const sparseRows = [
			{ city: 'A' } as Record<string, string>, // note key entirely absent
			{ city: 'B', note: 'hi' }
		];
		const idx = buildColumnIndex(sparseRows, ['city', 'note']);
		const result = computeFilteredRows(sparseRows, idx, [], [], [['note', 'empty']]);
		expect(result).toHaveLength(1);
		expect(result[0].city).toBe('A');
	});

	it('filters to only empty-value rows for a column', () => {
		const sparseRows = [
			{ city: 'Tokyo', note: '' },
			{ city: 'Osaka', note: 'hello' },
			{ city: 'Kyoto', note: '' }
		];
		const idx = buildColumnIndex(sparseRows, ['city', 'note']);
		const result = computeFilteredRows(sparseRows, idx, [], [], [['note', 'empty']]);
		expect(result).toHaveLength(2);
		expect(result.every((r) => r.note === '')).toBe(true);
	});

	it('filters to only nonempty-value rows for a column', () => {
		const sparseRows = [
			{ city: 'Tokyo', note: '' },
			{ city: 'Osaka', note: 'hello' },
			{ city: 'Kyoto', note: '' }
		];
		const idx = buildColumnIndex(sparseRows, ['city', 'note']);
		const result = computeFilteredRows(sparseRows, idx, [], [], [['note', 'nonempty']]);
		expect(result).toHaveLength(1);
		expect(result[0].city).toBe('Osaka');
	});
});

describe('computeCrossFilteredValues', () => {
	const index = buildColumnIndex(rows, columns);

	it('returns all unique values for a column when no filters are active', () => {
		const values = computeCrossFilteredValues('country', rows, index, [], []);
		expect(values.sort()).toEqual(['CA', 'US']);
	});

	it('excludes the target column from filtering (own filter is ignored)', () => {
		// filter country=US should NOT reduce country's own available values
		const values = computeCrossFilteredValues('country', rows, index, [['country', ['US']]], []);
		expect(values.sort()).toEqual(['CA', 'US']);
	});

	it('restricts values based on a filter on another column', () => {
		// filter country=US → state options should only include states from US rows
		const values = computeCrossFilteredValues('state', rows, index, [['country', ['US']]], []);
		expect(values.sort()).toEqual(['CA', 'IL', 'NY']);
	});

	it('restricts values when multiple other-column filters are active', () => {
		// country=US AND state=CA → only cities matching both
		const values = computeCrossFilteredValues(
			'city',
			rows,
			index,
			[
				['country', ['US']],
				['state', ['CA']]
			],
			[]
		);
		expect(values).toEqual(['Los Angeles']);
	});

	it('returns empty array when other filters exclude all rows', () => {
		const values = computeCrossFilteredValues('city', rows, index, [['country', ['ZZ']]], []);
		expect(values).toHaveLength(0);
	});

	it('excludes empty string values from results', () => {
		const sparseRows = [{ tag: 'A', cat: '' }, { tag: 'B', cat: 'X' }];
		const idx = buildColumnIndex(sparseRows, ['tag', 'cat']);
		const values = computeCrossFilteredValues('cat', sparseRows, idx, [], []);
		expect(values).toEqual(['X']); // empty string excluded
	});

	it('restricts values based on a date filter on another column', () => {
		// joined >= 2024-06-01 → country options should only include rows from that period
		// Chicago (US, 2024-06-01) and Vancouver (CA, 2024-08-15)
		const values = computeCrossFilteredValues('country', rows, index, [], [
			['joined', { from: '2024-06-01', to: '' }]
		]);
		expect(values.sort()).toEqual(['CA', 'US']);
	});

	it('ignores a date filter on the target column itself', () => {
		// date filter on 'joined' should not reduce joined's own available values
		const values = computeCrossFilteredValues('joined', rows, index, [], [
			['joined', { from: '2024-06-01', to: '' }]
		]);
		// All 5 joined dates should be available
		expect(values).toHaveLength(5);
	});

	it('restricts values based on an empty filter on another column', () => {
		const sparseRows = [
			{ city: 'Tokyo', note: '' },
			{ city: 'Osaka', note: 'hello' },
			{ city: 'Kyoto', note: '' }
		];
		const idx = buildColumnIndex(sparseRows, ['city', 'note']);
		// Only rows where note is empty → cities Tokyo and Kyoto
		const values = computeCrossFilteredValues('city', sparseRows, idx, [], [], [
			['note', 'empty']
		]);
		expect(values.sort()).toEqual(['Kyoto', 'Tokyo']);
	});

	it('empty filter on another column treats a missing key as empty', () => {
		// row[c] is undefined → ?? '' gives '' → falsy → matches 'empty' mode
		const sparseRows = [
			{ city: 'A' } as Record<string, string>, // note key entirely absent
			{ city: 'B', note: 'hi' }
		];
		const idx = buildColumnIndex(sparseRows, ['city', 'note']);
		const values = computeCrossFilteredValues('city', sparseRows, idx, [], [], [['note', 'empty']]);
		expect(values).toEqual(['A']);
	});

	it('nonempty filter on another column restricts values correctly', () => {
		// exercises the !!val branch of the empty/nonempty ternary
		const sparseRows = [
			{ city: 'A', note: '' },
			{ city: 'B', note: 'hi' }
		];
		const idx = buildColumnIndex(sparseRows, ['city', 'note']);
		const values = computeCrossFilteredValues('city', sparseRows, idx, [], [], [['note', 'nonempty']]);
		expect(values).toEqual(['B']);
	});

	it('target column key absent in a candidate row is excluded from results', () => {
		// row[col] is undefined → ?? '' fallback in the seen loop → empty → excluded
		const sparseRows = [
			{ note: 'x' } as Record<string, string>, // 'city' key absent
			{ city: 'B', note: 'y' }
		];
		const idx = buildColumnIndex(sparseRows, ['city', 'note']);
		const values = computeCrossFilteredValues('city', sparseRows, idx, [], []);
		expect(values).toEqual(['B']);
	});

	it('ignores an empty filter on the target column itself', () => {
		const sparseRows = [
			{ city: 'Tokyo', note: '' },
			{ city: 'Osaka', note: 'hello' },
			{ city: 'Kyoto', note: '' }
		];
		const idx = buildColumnIndex(sparseRows, ['city', 'note']);
		// Empty filter on 'city' itself should not reduce city's own available values
		const values = computeCrossFilteredValues('city', sparseRows, idx, [], [], [
			['city', 'nonempty']
		]);
		expect(values.sort()).toEqual(['Kyoto', 'Osaka', 'Tokyo']);
	});
});

describe('isLikelyDate', () => {
	it('returns false for empty array', () => {
		expect(isLikelyDate([])).toBe(false);
	});

	it('returns false for all-empty strings', () => {
		expect(isLikelyDate(['', '', ''])).toBe(false);
	});

	it('empty strings are skipped and do not count against the ratio', () => {
		const samples = ['2024-01-01', '2024-02-01', '', '', ''];
		expect(isLikelyDate(samples)).toBe(true);
	});

	it('returns true for ISO date strings', () => {
		const samples = ['2024-01-01', '2024-06-15', '2023-12-31'];
		expect(isLikelyDate(samples)).toBe(true);
	});

	it('returns true for datetime strings', () => {
		const samples = ['2024-01-01T12:00:00', '2024-06-15T08:30:00Z'];
		expect(isLikelyDate(samples)).toBe(true);
	});

	it('returns true for human-readable date strings', () => {
		const samples = ['January 1, 2024', 'June 15 2023', 'Dec 31, 2022'];
		expect(isLikelyDate(samples)).toBe(true);
	});

	it('returns false for pure numeric strings', () => {
		const samples = ['12345', '67890', '11111'];
		expect(isLikelyDate(samples)).toBe(false);
	});

	it('returns false for arbitrary text', () => {
		const samples = ['foo', 'bar', 'baz', 'hello', 'world'];
		expect(isLikelyDate(samples)).toBe(false);
	});

	it('returns false for numeric-looking identifiers', () => {
		const samples = ['001', '002', '100', '200', '300'];
		expect(isLikelyDate(samples)).toBe(false);
	});

	it('returns false for float numbers', () => {
		const samples = ['1.5', '3.14', '0.001', '100.0', '42.7'];
		expect(isLikelyDate(samples)).toBe(false);
	});

	it('returns false for negative float numbers', () => {
		const samples = ['-1.5', '-3.14', '-0.5'];
		expect(isLikelyDate(samples)).toBe(false);
	});

	it('returns false for negative integers', () => {
		const samples = ['-1', '-100', '-42'];
		expect(isLikelyDate(samples)).toBe(false);
	});

	it('returns true when ≥80% of samples are valid dates', () => {
		// 8 valid out of 10 = 80% — should pass
		const samples = [
			'2024-01-01',
			'2024-02-01',
			'2024-03-01',
			'2024-04-01',
			'2024-05-01',
			'2024-06-01',
			'2024-07-01',
			'2024-08-01',
			'not-a-date',
			'also-not'
		];
		expect(isLikelyDate(samples)).toBe(true);
	});

	it('returns false when <80% of samples are valid dates', () => {
		// 7 valid out of 10 = 70% — should fail
		const samples = [
			'2024-01-01',
			'2024-02-01',
			'2024-03-01',
			'2024-04-01',
			'2024-05-01',
			'2024-06-01',
			'2024-07-01',
			'not-a-date',
			'also-not',
			'nope'
		];
		expect(isLikelyDate(samples)).toBe(false);
	});

	it('only checks the first 50 samples', () => {
		// First 50 are all valid dates; the rest (51–100) are garbage — should still return true
		const dates = Array.from(
			{ length: 50 },
			(_, i) => `2024-01-${String((i % 28) + 1).padStart(2, '0')}`
		);
		const garbage = Array.from({ length: 50 }, (_, i) => `garbage${i}`);
		expect(isLikelyDate([...dates, ...garbage])).toBe(true);
	});

	it('returns false for a mix where garbage dominates within first 50', () => {
		const garbage = Array.from({ length: 50 }, (_, i) => `garbage${i}`);
		const dates = Array.from(
			{ length: 50 },
			(_, i) => `2024-01-${String((i % 28) + 1).padStart(2, '0')}`
		);
		expect(isLikelyDate([...garbage, ...dates])).toBe(false);
	});
});

describe('isMatchesDateFilters', () => {
	it('returns true when filters array is empty', () => {
		expect(isMatchesDateFilters({ date: '2024-06-15' }, [])).toBe(true);
	});

	it('returns false when cell value is empty', () => {
		expect(
			isMatchesDateFilters({ date: '' }, [['date', { from: '2024-01-01', to: '2024-12-31' }]])
		).toBe(false);
	});

	it('returns false when column is missing from row', () => {
		expect(isMatchesDateFilters({}, [['date', { from: '2024-01-01', to: '' }]])).toBe(false);
	});

	it('returns false when cell value is not a valid date', () => {
		expect(
			isMatchesDateFilters({ date: 'not-a-date' }, [['date', { from: '2024-01-01', to: '' }]])
		).toBe(false);
	});

	it('returns true when date is within from–to range', () => {
		expect(
			isMatchesDateFilters({ date: '2024-06-15' }, [
				['date', { from: '2024-01-01', to: '2024-12-31' }]
			])
		).toBe(true);
	});

	it('returns false when date is before from', () => {
		expect(
			isMatchesDateFilters({ date: '2023-12-31' }, [['date', { from: '2024-01-01', to: '' }]])
		).toBe(false);
	});

	it('returns false when date is after to (end of day)', () => {
		expect(
			isMatchesDateFilters({ date: '2024-12-31' }, [['date', { from: '', to: '2024-06-30' }]])
		).toBe(false);
	});

	it('includes the to date itself (end of day boundary)', () => {
		expect(
			isMatchesDateFilters({ date: '2024-06-30' }, [['date', { from: '', to: '2024-06-30' }]])
		).toBe(true);
	});

	it('includes the from date itself', () => {
		expect(
			isMatchesDateFilters({ date: '2024-01-01' }, [['date', { from: '2024-01-01', to: '' }]])
		).toBe(true);
	});

	it('returns true when both from and to are empty', () => {
		expect(isMatchesDateFilters({ date: '2024-06-15' }, [['date', { from: '', to: '' }]])).toBe(
			true
		);
	});

	it('applies multiple column filters — all must pass', () => {
		const row = { start: '2024-03-01', end: '2024-09-01' };
		const filters: [string, { from: string; to: string }][] = [
			['start', { from: '2024-01-01', to: '2024-06-30' }],
			['end', { from: '2024-07-01', to: '2024-12-31' }]
		];
		expect(isMatchesDateFilters(row, filters)).toBe(true);
	});

	it('returns false when one of multiple filters fails', () => {
		const row = { start: '2024-03-01', end: '2024-03-01' };
		const filters: [string, { from: string; to: string }][] = [
			['start', { from: '2024-01-01', to: '2024-06-30' }],
			['end', { from: '2024-07-01', to: '2024-12-31' }]
		];
		expect(isMatchesDateFilters(row, filters)).toBe(false);
	});
});
