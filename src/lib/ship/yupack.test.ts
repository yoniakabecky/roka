import { describe, it, expect } from 'vitest';
import type { SenderProfile } from './sender';
import { SHOPIFY_FIELDS } from './shopify';
import { extractSize, mapToYupack, HEADERS } from './yupack';

const SENDER: SenderProfile = {
	zipcode: '123-4567',
	address: '東京都渋谷区1-2-3',
	address2: 'ビル4F',
	name: '株式会社ロカ',
	phone: '03-1234-5678',
	email: 'sender@example.com'
};

const makeOrder = (overrides: Partial<Record<string, string>> = {}): Record<string, string> => ({
	[SHOPIFY_FIELDS.NAME]: '#1001',
	[SHOPIFY_FIELDS.SHIPPING_ZIP]: '150-0001',
	[SHOPIFY_FIELDS.SHIPPING_PHONE]: '+81 90-9876-5432',
	[SHOPIFY_FIELDS.SHIPPING_NAME]: '山田 太郎',
	[SHOPIFY_FIELDS.SHIPPING_ADDRESS1]: '道玄坂1-2-3',
	[SHOPIFY_FIELDS.SHIPPING_ADDRESS2]: '',
	[SHOPIFY_FIELDS.SHIPPING_CITY]: '渋谷区',
	[SHOPIFY_FIELDS.SHIPPING_PROVINCE]: 'JP-13',
	[SHOPIFY_FIELDS.SHIPPING_METHOD]: 'ゆうパック 60サイズ 冷蔵',
	[SHOPIFY_FIELDS.EMAIL]: 'customer@example.com',
	[SHOPIFY_FIELDS.SUBTOTAL]: '3000',
	[SHOPIFY_FIELDS.TOTAL]: '3500',
	...overrides
});

describe('extractSize', () => {
	it('extracts two-digit size and pads to three digits', () => {
		expect(extractSize('60サイズ')).toBe('060');
		expect(extractSize('80サイズ')).toBe('080');
	});

	it('extracts three-digit size as-is', () => {
		expect(extractSize('100サイズ')).toBe('100');
	});

	it('extracts size from a longer shipping method string', () => {
		expect(extractSize('ゆうパック 60サイズ 冷蔵')).toBe('060');
	});

	it('returns empty string when no size pattern is found', () => {
		expect(extractSize('通常配送')).toBe('');
		expect(extractSize('')).toBe('');
	});
});

describe('mapToYupack', () => {
	it('produces a row with all HEADERS keys', () => {
		const row = mapToYupack(makeOrder(), SENDER);
		for (const header of HEADERS) {
			expect(row).toHaveProperty(header);
		}
	});

	it('maps order name to お客様側管理番号', () => {
		const row = mapToYupack(makeOrder(), SENDER);
		expect(row['お客様側管理番号']).toBe('#1001');
	});

	it('strips hyphen from shipping zip', () => {
		const row = mapToYupack(makeOrder(), SENDER);
		expect(row['お届け先 郵便番号']).toBe('1500001');
	});

	it('normalizes +81 phone to domestic format', () => {
		const row = mapToYupack(makeOrder(), SENDER);
		expect(row['お届け先 電話番号']).toBe('090-9876-5432');
	});

	it('builds address line 1 from province + city + address1', () => {
		const row = mapToYupack(makeOrder(), SENDER);
		expect(row['お届け先 住所１']).toBe('東京都渋谷区道玄坂1-2-3');
	});

	it('extracts size from shipping method', () => {
		const row = mapToYupack(makeOrder(), SENDER);
		expect(row['商品サイズ区分']).toBe('060');
	});

	it('populates sender fields from SenderProfile', () => {
		const row = mapToYupack(makeOrder(), SENDER);
		expect(row['ご依頼主 郵便番号']).toBe('1234567');
		expect(row['ご依頼主 住所１']).toBe(SENDER.address);
		expect(row['ご依頼主 名称１']).toBe(SENDER.name);
		expect(row['ご依頼主 電話番号']).toBe(SENDER.phone);
		expect(row['ご依頼主 メールアドレス１']).toBe(SENDER.email);
	});

	it('maps subtotal and total to 単価 and 金額', () => {
		const row = mapToYupack(makeOrder(), SENDER);
		expect(row['単価']).toBe('3000');
		expect(row['金額']).toBe('3500');
	});

	it('leaves 商品サイズ区分 empty when shipping method has no size', () => {
		const row = mapToYupack(makeOrder({ [SHOPIFY_FIELDS.SHIPPING_METHOD]: '通常配送' }), SENDER);
		expect(row['商品サイズ区分']).toBe('');
	});
});
