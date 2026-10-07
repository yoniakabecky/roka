import { test, expect, uploadCsv, toast, SHOPIFY_CSV } from './fixtures';

test.beforeEach(async ({ page }) => {
	await page.goto('/ship');
});

test('shows the orders from a Shopify CSV', async ({ page }) => {
	await uploadCsv(page, 'orders.csv', SHOPIFY_CSV);
	await expect(page.getByText('Orders: 2')).toBeVisible();
	await expect(page.getByRole('cell', { name: '山田 太郎' })).toBeVisible();
	await expect(page.getByRole('cell', { name: '佐藤 花子' })).toBeVisible();
});

test('warns and does not download when the sender is empty', async ({ page }) => {
	await uploadCsv(page, 'orders.csv', SHOPIFY_CSV);

	let downloaded = false;
	page.on('download', () => (downloaded = true));
	await page.getByRole('button', { name: 'Export CSV' }).click();

	await expect(toast(page, 'The sender information is incomplete')).toBeVisible();
	expect(downloaded).toBe(false);
});

test('downloads a Yupack CSV when the sender is filled in', async ({ page }) => {
	await page.locator('#sender-zip').fill('150-0001');
	await page.getByRole('button', { name: 'Look up address' }).click();
	await expect(page.locator('#sender-address')).toHaveValue('東京都渋谷区神宮前');
	await page.locator('#sender-phone').fill('03-1234-5678');
	await page.locator('#sender-name').fill('株式会社ロカ');

	await uploadCsv(page, 'orders.csv', SHOPIFY_CSV);
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export CSV' }).click();
	const download = await downloadPromise;

	expect(download.suggestedFilename()).toMatch(/^yupack_\d{8}\.csv$/);
	const bytes = await (await download.createReadStream()).toArray();
	const text = new TextDecoder('shift-jis').decode(Buffer.concat(bytes));
	expect(text).toContain('山田 太郎');
	expect(text).toContain('株式会社ロカ');
	await expect(toast(page, 'Exported yupack_')).toBeVisible();
});

test('keeps the sender after a reload', async ({ page }) => {
	await page.locator('#sender-name').fill('株式会社ロカ');
	await page.reload();
	await expect(page.locator('#sender-name')).toHaveValue('株式会社ロカ');
});
