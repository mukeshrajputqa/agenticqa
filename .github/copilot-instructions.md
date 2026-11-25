# QA Agent Instructions
- Always inspect the live page using Playwright MCP tools before writing locators.
- Prefer user-facing locators (`getByRole`, `getByLabel`, `getByText`) over CSS/XPath.
- Save all new tests inside `tests/` using the `*.spec.ts` naming convention.
- After writing a test, always execute `npx playwright test <filename>` to verify it passes before finishing.
