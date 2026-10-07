import { test, expect } from './fixtures';

test('switches the language to Japanese and keeps it after a reload', async ({ page }) => {
	await page.goto('/ship');
	await expect(page.getByRole('button', { name: 'Sender Info' })).toBeVisible();

	await page.getByRole('tab', { name: 'JA' }).click();
	await expect(page.getByRole('button', { name: 'Sender Info' })).toBeHidden();
	await expect(page.locator('#sender-address')).toHaveAttribute('placeholder', '東京都渋谷区1-2-3');

	await page.reload();
	await expect(page.getByRole('tab', { name: 'JA' })).toHaveAttribute('data-state', 'active');
	await expect(page.locator('#sender-address')).toHaveAttribute('placeholder', '東京都渋谷区1-2-3');
});
