import { describe, it, expect } from 'vitest';
import {
	deduplicateOrders,
	formatShopifyDate,
	isForeignPhone,
	normalizePhone,
	parseNoteAttributes,
	SHOPIFY_FIELDS
} from './shopify';

describe('normalizePhone', () => {
	it('converts +81 with space to leading zero', () => {
		expect(normalizePhone('+81 90-1234-5678')).toBe('090-1234-5678');
	});

	it('converts +81 without space', () => {
		expect(normalizePhone('+8190-1234-5678')).toBe('090-1234-5678');
	});

	it('converts +81 followed by a hyphen', () => {
		expect(normalizePhone('+81-90-1234-5678')).toBe('090-1234-5678');
	});

	it('strips leading single quote before +81', () => {
		expect(normalizePhone("'+81 90-1234-5678")).toBe('090-1234-5678');
	});

	it('strips spaces separating the groups of a +81 number', () => {
		expect(normalizePhone('+81 90 1234 5678')).toBe('09012345678');
	});

	it('leaves domestic numbers unchanged', () => {
		expect(normalizePhone('090-1234-5678')).toBe('090-1234-5678');
	});

	it('strips spaces from domestic numbers', () => {
		expect(normalizePhone('090 1234 5678')).toBe('09012345678');
	});

	it('keeps parentheses used for area codes', () => {
		expect(normalizePhone('(03) 1234-5678')).toBe('(03)1234-5678');
	});

	it('folds full-width digits and dashes to half-width', () => {
		expect(normalizePhone('０９０－１２３４－５６７８')).toBe('090-1234-5678');
	});

	it('removes numbers with a non-Japanese country code', () => {
		expect(normalizePhone('+1 555-123-4567')).toBe('');
	});

	it('removes non-Japanese numbers written with a leading quote', () => {
		expect(normalizePhone("'+44 20 7946 0958")).toBe('');
	});

	it('returns empty string unchanged', () => {
		expect(normalizePhone('')).toBe('');
	});
});

describe('isForeignPhone', () => {
	it('flags a non-Japanese country code', () => {
		expect(isForeignPhone('+1 555-123-4567')).toBe(true);
	});

	it('flags a non-Japanese country code behind a leading quote', () => {
		expect(isForeignPhone("'+44 20 7946 0958")).toBe(true);
	});

	it('does not flag +81 numbers', () => {
		expect(isForeignPhone('+81 90-1234-5678')).toBe(false);
	});

	it('does not flag domestic numbers', () => {
		expect(isForeignPhone('090-1234-5678')).toBe(false);
	});

	it('does not flag an empty string', () => {
		expect(isForeignPhone('')).toBe(false);
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

describe('parseNoteAttributes', () => {
	it('parses delivery-date and delivery-time from a combined attribute string', () => {
		const result = parseNoteAttributes('delivery-date: 2026-05-15\ndelivery-time: 14-16');
		expect(result['delivery-date']).toBe('2026-05-15');
		expect(result['delivery-time']).toBe('14-16');
	});

	it('returns empty object for empty string', () => {
		expect(parseNoteAttributes('')).toEqual({});
	});

	it('parses a single key-value pair without a comma', () => {
		expect(parseNoteAttributes('delivery-date: 2026-06-01')).toEqual({
			'delivery-date': '2026-06-01'
		});
	});

	it('ignores segments with no colon', () => {
		const result = parseNoteAttributes('no-colon\ndelivery-time: AM');
		expect(result).not.toHaveProperty('no-colon');
		expect(result['delivery-time']).toBe('AM');
	});
});
