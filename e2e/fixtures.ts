import { test as base, expect, type Page } from '@playwright/test';

export { expect };

export const SHOPIFY_CSV = [
	'Name,Created at,Shipping Name,Shipping Zip,Shipping Phone,Shipping Address1,Shipping Address2,Shipping City,Shipping Province,Shipping Method,Email,Subtotal,Total,Note Attributes',
	'#1001,2026-10-01 10:00:00 +0900,山田 太郎,150-0001,090-1234-5678,神宮前1-1,,渋谷区,JP-13,ゆうパック 60サイズ,a@example.com,3000,3500,',
	'#1002,2026-10-02 11:00:00 +0900,佐藤 花子,530-0001,080-9876-5432,梅田1-1,,大阪市北区,JP-27,ゆうパック 80サイズ,b@example.com,5000,5800,'
].join('\n');

export const FRUITS_CSV = [
	'name,city,qty',
	'Apple,Tokyo,10',
	'Banana,Osaka,2',
	'Cherry,Tokyo,100'
].join('\n');

export const csvFile = (name: string, text: string) => ({
	name,
	mimeType: 'text/csv',
	buffer: Buffer.from(text)
});

/** Picks a file through the drop zone's hidden file input. */
export const uploadCsv = async (page: Page, name: string, text: string) => {
	await page.locator('input[type=file]').setInputFiles(csvFile(name, text));
};

/** A toast with this text. Several toasts can be on screen at once. */
export const toast = (page: Page, text: string) =>
	page.locator('[data-sonner-toast]', { hasText: text });

export const test = base.extend({
	page: async ({ page }, use) => {
		await page.addInitScript(() => {
			// Each test starts in English, with no saved sender or presets.
			if (!sessionStorage.getItem('e2e-init')) {
				localStorage.clear();
				localStorage.setItem('locale', 'en');
				sessionStorage.setItem('e2e-init', '1');
			}
			// Use the normal download fallback instead of the native "Save as" dialog.
			delete (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker;
		});
		// The postal lookup is a Cloudflare Pages Function, which `vite preview` does not serve.
		await page.route('**/api/postal-lookup?zip=*', (route) =>
			route.fulfill({ json: { address: '東京都渋谷区神宮前' } })
		);
		await use(page);
	}
});
