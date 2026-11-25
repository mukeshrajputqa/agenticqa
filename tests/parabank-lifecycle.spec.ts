import { test, expect, type Page, type BrowserContext } from '@playwright/test';

test.describe.serial('ParaBank end-to-end customer banking lifecycle', () => {
  let context: BrowserContext;
  let page: Page;
  let username = `${Date.now()}_mukesh_qa-raj`;
  const password = 'Password123!';
  let newAccountId = '';

  async function registerUser(): Promise<void> {
    for (let attempt = 0; attempt < 5; attempt++) {
      username = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_mukesh_qa-raj`;
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

      const success = page.getByText('Your account was created successfully. You are now logged in.');
      const usernameError = page.locator('#customer\\.username\\.errors');
      const anyError = page.locator('#rightPanel .error');
      const welcomeHeading = page.locator('#rightPanel h1', { hasText: `Welcome ${username}` });

      const outcome = await Promise.race([
        success.waitFor({ timeout: 15000 }).then(() => 'success' as const),
        usernameError.waitFor({ timeout: 15000 }).then(() => 'username-error' as const),
        anyError.first().waitFor({ timeout: 15000 }).then(() => 'error' as const),
        welcomeHeading.waitFor({ timeout: 15000 }).then(() => 'welcome' as const),
      ]).catch(() => 'timeout' as const);

      if (outcome === 'success' || outcome === 'welcome') {
        await expect(page.locator('#rightPanel h1')).toHaveText(`Welcome ${username}`);
        await expect(success).toBeVisible();
        return;
      }

      if (outcome === 'timeout') {
        const heading = await page.locator('#rightPanel h1').textContent().catch(() => '');
        if (heading?.includes(`Welcome ${username}`)) {
          return;
        }
      }
    }

    throw new Error(`Registration failed for ${username} after retries`);
  }

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    await page.goto('https://parabank.parasoft.com/parabank/admin.htm');
    await page.getByRole('button', { name: 'Clean' }).click();
    await expect(page.locator('#rightPanel')).toContainText('Database Cleaned');

    await registerUser();
  });

  test.afterAll(async () => {
    try {
      await page.goto('https://parabank.parasoft.com/parabank/admin.htm');
      await page.getByRole('button', { name: 'Clean' }).click();
      await expect(page.locator('#rightPanel')).toContainText('Database Cleaned');

      await page.goto('https://parabank.parasoft.com/parabank/index.htm');
      await page.locator('input[name="username"]').fill(username);
      await page.locator('input[name="password"]').fill(password);
      await page.getByRole('button', { name: 'Log In' }).click();
      await expect(page.locator('#rightPanel .error')).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('Scenario 1: Open a new Savings Account', async () => {
    await page.getByRole('link', { name: 'Open New Account' }).click();
    await expect(page.locator('#rightPanel h1')).toHaveText('Open New Account');

    await page.locator('#type').selectOption('SAVINGS');
    await expect(page.locator('#fromAccountId option')).not.toHaveCount(0);
    await page.getByRole('button', { name: 'Open New Account' }).click();

    await expect(page.locator('#openAccountResult h1')).toHaveText('Account Opened!');
    const newAccountLink = page.locator('#newAccountId');
    await expect(newAccountLink).toBeVisible();
    newAccountId = (await newAccountLink.textContent())?.trim() ?? '';
    expect(newAccountId).not.toEqual('');
  });

  test('Scenario 2: Transfer funds between accounts', async () => {
    expect(newAccountId).not.toEqual('');

    await page.getByRole('link', { name: 'Transfer Funds' }).click();
    await expect(page.locator('#rightPanel h1')).toHaveText('Transfer Funds');

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

    await expect(page.locator('#showResult h1')).toHaveText('Transfer Complete!');
    await expect(page.locator('#showResult')).toContainText('$100.00 has been transferred');
  });
});
