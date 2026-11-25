import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import crypto from 'node:crypto';

// Prevent parallel cross-browser workers from colliding on the shared server
test.use({ browserName: 'chromium' });

test.describe.serial('ParaBank end-to-end customer banking lifecycle', () => {
  let context: BrowserContext;
  let page: Page;
  // 13-char alpha-prefixed unique username (fits DB schema, avoids collisions)
  const username = `qa_m_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
  const password = 'Password123!';
  let newAccountId = '';

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    await page.goto('https://parabank.parasoft.com/parabank/register.htm');
    await page.locator('#customer\\.firstName').fill('QA');
    await page.locator('#customer\\.lastName').fill('Mukesh');
    await page.locator('#customer\\.address\\.street').fill('123 Test St');
    await page.locator('#customer\\.address\\.city').fill('TestCity');
    await page.locator('#customer\\.address\\.state').fill('TS');
    await page.locator('#customer\\.address\\.zipCode').fill('12345');
    await page.locator('#customer\\.phoneNumber').fill('5555555555');
    await page.locator('#customer\\.ssn').fill('123-45-6789');
    await page.locator('#customer\\.username').fill(username);
    await page.locator('#customer\\.password').fill(password);
    await page.locator('#repeatedPassword').fill(password);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByRole('heading', { name: `Welcome ${username}` })).toBeVisible();
    await expect(
      page.getByText('Your account was created successfully. You are now logged in.')
    ).toBeVisible();
  });

  test.afterAll(async () => {
    try {
      await page.goto('https://parabank.parasoft.com/parabank/admin.htm');
      await page.getByRole('button', { name: 'Clean' }).click();
      await expect(page.locator('#rightPanel')).toContainText('Database Cleaned');
    } finally {
      await context.close();
    }
  });

  test('Scenario 1: Open a new Savings Account', async () => {
    await page.getByRole('link', { name: 'Open New Account' }).click();
    await expect(page.getByRole('heading', { name: 'Open New Account' })).toBeVisible();

    await page.locator('#type').selectOption('SAVINGS');
    await expect(page.locator('#fromAccountId option')).not.toHaveCount(0);
    await page.getByRole('button', { name: 'Open New Account' }).click();

    await expect(page.getByRole('heading', { name: 'Account Opened!' })).toBeVisible();
    const newAccountLink = page.locator('#newAccountId');
    await expect(newAccountLink).toBeVisible();
    newAccountId = (await newAccountLink.textContent())?.trim() ?? '';
    expect(newAccountId).not.toEqual('');
  });

  test('Scenario 2: Transfer funds between accounts', async () => {
    expect(newAccountId).not.toEqual('');

    await page.getByRole('link', { name: 'Transfer Funds' }).click();
    await expect(page.getByRole('heading', { name: 'Transfer Funds' })).toBeVisible();

    await page.locator('#amount').fill('100');
    await page.locator('#toAccountId').selectOption(newAccountId);

    const fromOptions = page.locator('#fromAccountId option');
    await expect(fromOptions).not.toHaveCount(0);
    const fromValue = await fromOptions.first().getAttribute('value');
    if (fromValue && fromValue !== newAccountId) {
      await page.locator('#fromAccountId').selectOption(fromValue);
    } else {
      const count = await fromOptions.count();
      for (let i = 0; i < count; i++) {
        const value = await fromOptions.nth(i).getAttribute('value');
        if (value && value !== newAccountId) {
          await page.locator('#fromAccountId').selectOption(value);
          break;
        }
      }
    }

    await page.getByRole('button', { name: 'Transfer' }).click();

    await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).toBeVisible();
    await expect(page.locator('#showResult')).toContainText('$100.00 has been transferred');
  });
});
