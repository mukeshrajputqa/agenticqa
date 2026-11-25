---
mode: 'agent'
description: 'Read requirements.md, inspect live DOM with MCP, and generate a stable, passing Playwright spec'
---
Read `@requirements.md` and strictly follow all rules in `.github/copilot-instructions.md`.
1. Use Playwright MCP browser tools to inspect the live pages referenced in `requirements.md` and verify exact user-facing locators (`getByRole`, `getByLabel`, `getByText`).
2. Create a serial Playwright TypeScript suite at `tests/${input:specName:Enter spec filename (without .spec.ts)}.spec.ts` with `test.use({ browserName: 'chromium' });` at the top to prevent parallel worker collisions on shared environments.
3. Implement clean test isolation: generate a short, alpha-prefixed unique user (`qa_m_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`) in `test.beforeAll`, and wipe test data inside a `try / finally` block in `test.afterAll`.
4. Use Playwright web-first assertions (`expect(locator).toBeVisible()`, `toHaveText()`)—never use manual retry loops or `Promise.race`.
5. Run `npx playwright test tests/${input:specName}.spec.ts` in the terminal. Fix any locator or timing issues until all tests pass.
