import { describe, it, expect } from 'vitest';
import { isLikelyDate, isMatchesDateFilters } from '$lib/csv-studio/detect-columns';

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
