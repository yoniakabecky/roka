import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toast } from 'svelte-sonner';
import { loadLocale } from 'wuchale/load-utils';
import { downloadBlob } from '#lib/download.js';
import type { SenderProfile } from '#lib/ship/sender.js';

vi.mock('svelte-sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() }
}));
vi.mock('#lib/download.js', () => ({ downloadBlob: vi.fn() }));

const SENDER: SenderProfile = {
	zipcode: '123-4567',
	address: '東京都渋谷区1-2-3',
	address2: '',
	name: '株式会社ロカ',
	phone: '03-1234-5678',
	email: ''
};

const HEADER =
	'Name,Shipping Name,Shipping Zip,Shipping Phone,Shipping Address1,Shipping City,Shipping Province,Shipping Method,Subtotal,Total';
const order = (name: string, phone = '090-1234-5678') =>
	`${name},山田 太郎,150-0001,${phone},道玄坂1-2-3,渋谷区,JP-13,ゆうパック 60サイズ,3000,3500`;
const csvFile = (lines: string[], name = 'orders.csv') =>
	new File([[HEADER, ...lines].join('\n')], name, { type: 'text/csv' });

// ship.svelte.ts exports one shared state. A unique query makes Vite load a new copy of the
// module, so each test gets its own state.
let fresh = 0;
const freshShip = async () => {
	// +layout.ts loads the catalog in the app; without it toasts show "[i18n-404:…]".
	await loadLocale('en');
	const mod: typeof import('./ship.svelte') = await import(
		/* @vite-ignore */ `${new URL('./ship.svelte.ts', import.meta.url).pathname}?fresh=${fresh++}`
	);
	return mod.useShip();
};

const loadFile = async (ship: Awaited<ReturnType<typeof freshShip>>, file: File) => {
	ship.handleFile(file);
	await vi.waitFor(() => expect(ship.loading).toBe(false));
};

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
});

describe('handleFile', () => {
	it('loads orders and the file name', async () => {
		const ship = await freshShip();
		await loadFile(ship, csvFile([order('#1001'), order('#1002')]));
		expect(ship.orders.map((o) => o.Name)).toEqual(['#1001', '#1002']);
		expect(ship.filename).toBe('orders.csv');
	});

	it('removes duplicate order rows (Shopify writes one row per line item)', async () => {
		const ship = await freshShip();
		await loadFile(ship, csvFile([order('#1001'), order('#1001'), order('#1002')]));
		expect(ship.orders).toHaveLength(2);
	});

	it('warns when overseas phone numbers are found', async () => {
		const ship = await freshShip();
		await loadFile(ship, csvFile([order('#1001', '+1 555-0100'), order('#1002')]));
		expect(toast.warning).toHaveBeenCalledOnce();
		expect(vi.mocked(toast.warning).mock.calls[0][0]).toContain('1');
	});

	it('does not warn when all phone numbers are Japanese', async () => {
		const ship = await freshShip();
		await loadFile(ship, csvFile([order('#1001', '+81 90-1234-5678')]));
		expect(toast.warning).not.toHaveBeenCalled();
	});
});

describe('exportYupack', () => {
	it('shows a warning and does not download when the sender is incomplete', async () => {
		const ship = await freshShip();
		await loadFile(ship, csvFile([order('#1001')]));
		ship.exportYupack();
		expect(toast.warning).toHaveBeenCalledWith(expect.stringMatching(/sender/i));
		expect(downloadBlob).not.toHaveBeenCalled();
	});

	it('downloads a Shift-JIS yupack CSV when the sender is complete', async () => {
		const ship = await freshShip();
		ship.sender = SENDER;
		await loadFile(ship, csvFile([order('#1001')]));
		ship.exportYupack();

		expect(downloadBlob).toHaveBeenCalledOnce();
		const [blob, filename] = vi.mocked(downloadBlob).mock.calls[0];
		expect(filename).toMatch(/^yupack_\d{8}\.csv$/);
		expect(blob.type).toBe('text/csv;charset=shift_jis');
		const text = new TextDecoder('shift-jis').decode(await blob.arrayBuffer());
		expect(text).toContain('山田 太郎');
		expect(toast.success).toHaveBeenCalledWith(expect.stringContaining(filename));
		expect(ship.exporting).toBe(false);
	});

	it('uses the address override for an order', async () => {
		const ship = await freshShip();
		ship.sender = SENDER;
		await loadFile(ship, csvFile([order('#1001')]));
		ship.setAddressOverride('#1001', {
			zipcode: '100-0001',
			address1: '東京都千代田区千代田1-1',
			address2: '',
			name: '佐藤 花子',
			phone: '03-0000-0000'
		});
		ship.exportYupack();

		const [blob] = vi.mocked(downloadBlob).mock.calls[0];
		const text = new TextDecoder('shift-jis').decode(await blob.arrayBuffer());
		expect(text).toContain('佐藤 花子');
		expect(text).not.toContain('山田 太郎');
	});

	it('shows an error toast when the export throws', async () => {
		const ship = await freshShip();
		ship.sender = SENDER;
		await loadFile(ship, csvFile([order('#1001')]));
		vi.mocked(downloadBlob).mockImplementationOnce(() => {
			throw new Error('blocked');
		});
		ship.exportYupack();
		expect(toast.error).toHaveBeenCalledOnce();
		expect(ship.exporting).toBe(false);
	});
});

describe('setAddressOverride and clear', () => {
	it('adds and removes an override', async () => {
		const ship = await freshShip();
		const data = { zipcode: '1', address1: 'a', address2: '', name: 'n', phone: 'p' };
		ship.setAddressOverride('#1001', data);
		expect(ship.addressOverrides.get('#1001')).toEqual(data);
		ship.setAddressOverride('#1001', null);
		expect(ship.addressOverrides.has('#1001')).toBe(false);
	});

	it('clear removes orders, file name and overrides', async () => {
		const ship = await freshShip();
		await loadFile(ship, csvFile([order('#1001')]));
		ship.setAddressOverride('#1001', {
			zipcode: '1',
			address1: 'a',
			address2: '',
			name: 'n',
			phone: 'p'
		});
		ship.clear();
		expect(ship.orders).toEqual([]);
		expect(ship.filename).toBe('');
		expect(ship.addressOverrides.size).toBe(0);
	});
});
