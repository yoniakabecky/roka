import { test, expect, uploadCsv, toast, FRUITS_CSV } from './fixtures';

test.beforeEach(async ({ page }) => {
	await page.goto('/csv-studio');
	await uploadCsv(page, 'fruits.csv', FRUITS_CSV);
	await expect(toast(page, 'Imported fruits.csv')).toBeVisible();
});

test('shows the rows of the CSV', async ({ page }) => {
	for (const fruit of ['Apple', 'Banana', 'Cherry']) {
		await expect(page.getByRole('cell', { name: fruit })).toBeVisible();
	}
});

test('filters rows by a column value', async ({ page }) => {
	await page.getByRole('button', { name: 'Filter city' }).click();
	await page.getByRole('button', { name: 'Filter values…' }).click();
	await page.getByRole('option', { name: 'Tokyo' }).click();
	await page.keyboard.press('Escape');

	await expect(page.getByRole('cell', { name: 'Apple' })).toBeVisible();
	await expect(page.getByRole('cell', { name: 'Cherry' })).toBeVisible();
	await expect(page.getByRole('cell', { name: 'Banana' })).toBeHidden();
});

test('exports the table as CSV', async ({ page }) => {
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export CSV' }).click();
	const download = await downloadPromise;

	expect(download.suggestedFilename()).toBe('fruits_roka.csv');
	const bytes = await (await download.createReadStream()).toArray();
	const text = Buffer.concat(bytes).toString('utf8');
	expect(text).toContain('Apple');
	await expect(toast(page, 'Exported fruits_roka.csv')).toBeVisible();
});
