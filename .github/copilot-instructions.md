@'
# QA Agent Instructions

## Browser Inspection & Locators
- Always inspect the live page using Playwright MCP tools before writing locators.
- Prefer user-facing locators (`getByRole`, `getByLabel`, `getByText`) over CSS/XPath.
- Save all new tests inside `tests/` using the `*.spec.ts` naming convention.

## Stability & Anti-Flakiness Rules (Learned Best Practices)
- **Unique Test Data:** Always generate short, alpha-prefixed UUIDs for usernames/identifiers (e.g., `qa_m_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`). Never start usernames with digits or exceed 20 characters.
- **Web-First Assertions Only:** Always use Playwright's built-in auto-retrying assertions (`await expect(locator).toBeVisible()`, `toHaveText()`, `toContainText()`). Never build manual retry loops, `Promise.race` timeout wrappers, or `page.waitForTimeout()`.
- **Shared-State Isolation:** For stateful E2E suites that mutate or reset shared backend databases (such as ParaBank `admin.htm`), add `test.use({ browserName: 'chromium' });` at the top of the spec so parallel browser workers do not collide with each other.
- **Clean Lifecycle:** Create temporary test users in `test.beforeAll` and clean up test data inside a `try / finally` block in `test.afterAll`.

## Verification Loop
- After writing or editing any test, always execute `npx playwright test <filename>` in the terminal to verify it passes before finishing.
'@ | Set-Content -Path ".github\copilot-instructions.md" -Encoding UTF8
