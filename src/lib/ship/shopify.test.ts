import { describe, it, expect } from 'vitest';
import { deduplicateOrders, formatShopifyDate, normalizePhone, SHOPIFY_FIELDS } from './shopify';

describe('normalizePhone', () => {
	it('converts +81 with space to leading zero', () => {
		expect(normalizePhone('+81 90-1234-5678')).toBe('090-1234-5678');
	});

	it('converts +81 without space', () => {
		expect(normalizePhone('+8190-1234-5678')).toBe('090-1234-5678');
	});

	it('strips leading single quote before +81', () => {
		expect(normalizePhone("'+81 90-1234-5678")).toBe('090-1234-5678');
	});

	it('leaves domestic numbers unchanged', () => {
		expect(normalizePhone('090-1234-5678')).toBe('090-1234-5678');
	});

	it('returns empty string unchanged', () => {
		expect(normalizePhone('')).toBe('');
	});
});

describe('formatShopifyDate', () => {
	it('extracts date from ISO timestamp', () => {
		expect(formatShopifyDate('2024-03-15T09:00:00+09:00')).toBe('20240315');
	});

	it('extracts date from plain date string', () => {
		expect(formatShopifyDate('2023-01-07')).toBe('20230107');
	});

	it('returns empty string for invalid input', () => {
		expect(formatShopifyDate('invalid')).toBe('');
	});

	it('returns empty string for empty input', () => {
		expect(formatShopifyDate('')).toBe('');
	});
});

describe('deduplicateOrders', () => {
	const makeOrder = (name: string, extra = {}): Record<string, string> => ({
		[SHOPIFY_FIELDS.NAME]: name,
		...extra
	});

	it('keeps one row per order name', () => {
		const rows = [makeOrder('#1001'), makeOrder('#1001'), makeOrder('#1002')];
		expect(deduplicateOrders(rows)).toHaveLength(2);
	});

	it('keeps the first occurrence when duplicated', () => {
		const rows = [
			makeOrder('#1001', { [SHOPIFY_FIELDS.EMAIL]: 'first@example.com' }),
			makeOrder('#1001', { [SHOPIFY_FIELDS.EMAIL]: 'second@example.com' })
		];
		expect(deduplicateOrders(rows)[0][SHOPIFY_FIELDS.EMAIL]).toBe('first@example.com');
	});

	it('excludes rows with no Name field', () => {
		const rows = [{ [SHOPIFY_FIELDS.EMAIL]: 'no-name@example.com' }, makeOrder('#1001')];
		const result = deduplicateOrders(rows);
		expect(result).toHaveLength(1);
		expect(result[0][SHOPIFY_FIELDS.NAME]).toBe('#1001');
	});

	it('returns empty array for empty input', () => {
		expect(deduplicateOrders([])).toEqual([]);
	});

	it('preserves all rows when all names are unique', () => {
		const rows = [makeOrder('#1001'), makeOrder('#1002'), makeOrder('#1003')];
		expect(deduplicateOrders(rows)).toHaveLength(3);
	});
});
