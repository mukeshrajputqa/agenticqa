# Feature: ParaBank End-to-End Customer Banking Lifecycle
Application URL: https://parabank.parasoft.com/parabank/index.htm

## Architectural & Test Isolation Rules
1. **Dynamic Unique User Generation (`beforeAll` / `beforeEach`):** Generate a timestamped username using the exact pattern `qa_mukesh_${Date.now()}` during registration so every test run starts with a brand-new, guaranteed-available user without colliding with other testers.
2. **Post-Run Teardown (`afterAll` / `afterEach`):** Navigate to the ParaBank Admin Page (`https://parabank.parasoft.com/parabank/admin.htm`) and click the `CLEAN` button inside an `afterAll` (or `afterEach`) teardown hook after the suite finishes—even if a test fails—so the database is wiped clean and leaves zero leftover test data behind.

---

## Background / Setup (`beforeAll`): Register a temporary unique user
Given the test suite generates a dynamic username `qa_mukesh_${Date.now()}`
And navigates to the ParaBank home page (`https://parabank.parasoft.com/parabank/index.htm`)
When the user clicks the "Register" link
And submits valid registration details using the generated `qa_mukesh_${Date.now()}` username
Then the welcome screen displays "Your account was created successfully. You are now logged in."
And the authenticated session is preserved for subsequent banking scenarios

## Scenario 1: Open a new Savings Account
Given the temporary `qa_mukesh_<timestamp>` user is logged into ParaBank
When the user navigates to "Open New Account"
And selects "SAVINGS" as the account type
And clicks "Open New Account"
Then a confirmation message "Account Opened!" is displayed
And a new account ID link is generated and captured

## Scenario 2: Transfer funds between accounts
Given the temporary user has a default Checking account and the newly created Savings account
When the user navigates to "Transfer Funds"
And enters an amount of "100"
And selects the Checking account as the source and the new Savings account as the destination
And clicks "Transfer"
Then a confirmation message "Transfer Complete!" is displayed showing "$100.00 has been transferred"

## Teardown / Cleanup (`afterAll`): Wipe temporary user data for a clean run
Given the test scenarios have finished executing (whether passed or failed)
When the `afterAll` teardown hook navigates to `https://parabank.parasoft.com/parabank/admin.htm`
And clicks the "CLEAN" button under Database Management
Then the database resets to its clean default state
And attempting to log in with `qa_mukesh_<timestamp>` fails with an error message
