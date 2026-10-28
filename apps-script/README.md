# NestCloud enquiry backend — Phase 2

Backend only. The React website, legal policies, catalogue prices, payment integration, DNS and GitHub Pages deployment are unchanged. No live deployment or Google account access was performed.

## Files and execution

- `Code.gs`: public `doPost(e)`/`doGet(e)`, private validation, catalogue, lock/write adapter and editor-only setup helper.
- `Confirmation.html`: self-contained NestCloud HTML result page. Dynamic output is escaped; no external images/scripts, personal contact details, spreadsheet ID or stack traces are rendered.
- `appsscript.json`: V8, India time zone, spreadsheet authorization scope.
- `../tests/apps-script.test.mjs`: Node built-in tests loading the actual `.gs` source in a VM with mocked Google services. Run `node --test tests/apps-script.test.mjs` from the repository root; existing `npm test` also discovers these tests. No packages added.

A normal HTML form submits `application/x-www-form-urlencoded` by **POST**, navigating to the production Web App `/exec` URL. The result is a Google-hosted branded HTML confirmation/error page, not JSON. Success appears only after the row write and flush complete. No fetch, JSONP, opaque `no-cors` result, iframe or cross-window handshake is required. No frontend is provided in this phase.

Google's wrapper may display its own application banner. Google-controlled authorization/platform failures may show a Google error rather than our template. HTMLService does not provide a normal configurable HTTP status/header API; the HTML explicitly states the outcome. Do not use HTTP 200 or page load alone as proof of success.

## Exact manual Google setup

1. Sign into the Google account that will own the service. Create a **new blank Google Sheet** named `NestCloud Enquiries`. Keep General access **Restricted**; share only with authorized staff. Do not publish the Sheet or enable link sharing. Use a separate test spreadsheet first.
2. Copy the spreadsheet ID from the URL segment between `/d/` and `/edit`. Keep it out of the GitHub repository and frontend.
3. At `script.google.com`, create a **standalone** Apps Script project named `NestCloud Enquiries`. Replace the default `Code.gs` with this folder's `Code.gs`.
4. Add an HTML file named **Confirmation** and paste `Confirmation.html`. In **Project Settings**, enable **Show appsscript.json manifest file in editor**; replace the manifest with `appsscript.json`. No external libraries, Advanced Services or paid services are needed.
5. Under **Project Settings → Script Properties**, add the properties in the table below. Initially keep `ALLOW_SUBMISSIONS` set to `false`.
6. In the editor, select and run `setupEnquirySheets_`. Authorize access to Google Sheets using the owner account. Review requested permissions. This editor function creates the three named tabs and exact header rows without overwriting existing data. A blank default `Sheet1` may be deleted manually. If an existing tab has a different schema, setup stops; resolve it rather than replacing customer data.
7. Verify all three tabs and the frozen headers. Restrict access to the Apps Script project itself as well; Script Properties are accessible to project editors.
8. For the test environment, set `ALLOW_SUBMISSIONS` to `true`. Choose **Deploy → New deployment → Web app**. Set **Execute as: Me (owner)** and **Who has access: Anyone**, including visitors without a Google login. Authorize the deployment if requested. Workspace policy may prevent this setting; do not substitute “Anyone with a Google account” for an anonymous customer form.
9. Copy the deployed **`https://script.google.com/macros/s/.../exec`** URL. This is a public endpoint, not a secret. Do not use `/dev`, a redirected `googleusercontent.com` URL, an OAuth token, or a spreadsheet URL in the website.
10. Test in an incognito browser: GET should show a generic start-at-NestCloud page with no stored data. Using a temporary local HTML form with the contract below, POST all three types to the test `/exec` endpoint. Confirm the exact rows, server catalogue price and receipt; submit the identical ID/details again and verify one row. Test a wrong price, missing consent, invalid PIN and formula-like text. Do not send real customer details during testing.
11. Run simultaneous same-ID test submissions and confirm a single row. Test disabled submissions, inaccessible Sheet, limits and a recoverable retry. Quota exhaustion/platform outages may require separate observation rather than artificial production traffic. Check desktop and mobile confirmation pages, Back/retry behavior and the fixed return link. Never infer delivery from a successful HTTP response alone.
12. After reviewing results, create a separate production Sheet/project or carefully switch the private properties. Set the production consent version, limits and return URL. Deploy a production Web App explicitly. Frontend integration and publication belong to a later phase; this phase neither changes the live website nor installs the endpoint there.
13. For code changes, use **Deploy → Manage deployments → Edit → New version → Deploy** to retain the existing `/exec` URL. Script Property changes apply to the project without a new code version. Keep test and production projects separate to avoid changing production settings during tests.

### Script Properties

| Property | Value / default | Meaning |
|---|---|---|
| `SPREADSHEET_ID` | Required, private | Spreadsheet URL identifier; never put it in source. |
| `ALLOW_SUBMISSIONS` | Required: `true` to accept; otherwise disabled | Operational kill switch. Disabled responses are unavailable, including retries. |
| `CONSENT_VERSION` | Required, e.g. `enquiry-v1` | Version of the consent wording approved for the future form. Letters, digits, `.`, `_`, `-`; max 40. |
| `RETURN_URL` | `https://nestcloud.in/` | May alternatively be exactly `https://bharatvyb.github.io/NestCloud-Website/`. Other values fall back to nestcloud.in; customer input never controls it. |
| `EMAIL_COOLDOWN_SECONDS` | Optional: `60` | Minimum interval between **different** accepted submissions from the same normalized email; 0 disables this control. Max 86400. |
| `GLOBAL_WINDOW_SECONDS` | Optional: `600` | Rolling accepted-submission window; 60–86400 seconds. |
| `GLOBAL_MAX_SUBMISSIONS` | Optional: `30` | Accepted rows per global rolling window; 1–1000. |
| `MAX_TOTAL_ROWS` | Optional: `10000` | Safety cap across all three data tabs; 1–50000. Rejects new enquiries at capacity. Successful retries still recover receipts. |

Do not set blank optional properties: omit them to use defaults. Malformed settings fail closed. No runtime secret is required; if adding one later, store it only in Script Properties, never in a public form.

## Request contract for the later frontend

One scalar value per field; duplicate/unknown fields are rejected. Do not send Google-reserved `c` or `sid` parameters. Do not attach a query string containing personal information. Body maximum: 20,000 bytes.

| Field | Rules |
|---|---|
| `submission_id` | Required UUID v4 generated once per logical enquiry. Reuse unchanged across retries; generate a new ID for a deliberately different enquiry. Not an email-derived ID. |
| `enquiry_type` | Exactly `purchase`, `general`, or `support`. |
| `full_name` | Required, 2–100 characters. |
| `email` | Required, max 254; practical syntax validation, not mailbox verification. Normalized to lowercase. |
| `mobile` | Required Indian mobile: 10 digits starting 6–9, optional `+91`/`91`; spaces, parentheses and hyphens accepted. Stored normalized with `+91`. International mobile numbers are not supported by this version. |
| `consent` | Required literal `yes`, emitted by a checked checkbox; missing/unchecked rejected. |
| `consent_version` | Required approved server version. Timestamp is generated server-side, never trusted from the browser. |
| `message` | Max 3000 characters; optional for purchase, required otherwise. |
| `delivery_pin` | Purchase only: six digits, first digit 1–9. Syntax validation does not prove delivery serviceability. |
| `configuration_id` | Purchase only: `512gb`, `1tb`, or `backup`. |
| `displayed_price` | Purchase only: integer INR digits, e.g. `59900`, not a formatted currency string. Used only to detect disagreement; never used as the authoritative stored price. |
| `order_reference`, `device_serial` | Support only, optional, max 80 characters each. |
| `issue_category` | Support only, optional: `setup`, `photos`, `files`, `remote-access`, `backup`, `hardware`, `other`. |
| `website` | Honeypot: must be empty or omitted. Future frontend should hide it from people and assistive technology. |

The later React implementation must retain the submission ID and matching draft across result-page navigation and retries, until the customer explicitly starts a new enquiry. Do not generate a fresh ID on every submit or place contact details in URLs/analytics. Draft retention and privacy handling are frontend work for the next phase.

Fields that do not apply must be omitted or empty. Non-message fields reject newlines. Control characters are rejected. No files, attachments or arbitrary metadata are accepted.

### Server catalogue (not operational properties)

| ID | Label | Product price INR | Usable personal storage | Separate backup SSD |
|---|---|---:|---|---|
| `512gb` | 512 GB | 49900 | 512 GB | — |
| `1tb` | 1 TB | 59900 | 1 TB | — |
| `backup` | 1 TB + Backup Plus | 81900 | 1 TB | 1 TB |

The catalogue is fixed server code; changing an operational property cannot change product pricing. A mismatched displayed price writes **no row**, returns the current product price, and requires the customer to return, review and explicitly resubmit. The backend never silently substitutes an agreed price. A prior successful exact retry returns its original receipt even if catalogue prices or the consent version later change. Prices are product prices, not an agreed payable total; no order/payment is created.

## Sheet schema and privacy

Tabs: `Purchase Enquiries`, `General Contact`, `Technical Support`. All have the same 23-column schema, with non-applicable cells empty:

`Submission ID`, `Enquiry reference`, `Received UTC`, `Payload SHA256`, `Email SHA256`, `Type`, `Full name`, `Email`, `Mobile`, `Delivery PIN`, `Message`, `Consent version`, `Consent received UTC`, `Configuration ID`, `Configuration`, `Product price INR`, `Currency`, `Personal storage`, `Backup SSD`, `Order reference`, `Device serial`, `Issue category`, `Status`.

Only the first five metadata columns are read for idempotency/rate checks. Customer text is written with plain-text cell formatting; formula-like prefixes (`=`, `+`, `-`, `@`, including leading whitespace) receive an apostrophe. Numeric catalogue prices remain server numbers. Phone, PIN, UUIDs, order references and serials are strings; leading zeros survive. The extra apostrophe may be visible when reading/exporting text; it is intentional protection, not a formula. Preserve this safety when staff export to CSV.

Receipt IDs are server-generated `NC-` plus a UUID. Status starts at `New`. No customer name, email, phone, PIN, message or device details appear on result pages. `doGet` does not read Sheets, reflect parameters, search by ID, or expose enquiries. All helpers end in `_`, preventing invocation through `google.script.run`. No other public handler or retrieval endpoint is supplied. Exception details/customer payloads are not logged by this code; Google platform execution metadata still exists.

Define staff access, consent wording, retention and deletion procedures before production. Do not edit header names or the first five metadata columns. Keep archived rows/IDs private: deleting a saved row removes its idempotency and rate history. Do not promise permanent duplicate prevention after data deletion.

## Concurrency, retries and limitations

- `LockService.getScriptLock()` covers schema/read checks, duplicate lookup, rate checks, row write and `SpreadsheetApp.flush()`. The private setup helper uses the same lock. Use **one script project** as writer; independent projects do not share its lock. Human edits are not lock-protected.
- The enquiry row itself contains submission ID, normalized-payload digest and receipt. There is no separate ledger whose failure could orphan an accepted enquiry. Exact successful retries return the stored receipt before checking current price, consent version, cooldown or capacity. Same ID with different normalized details returns a conflict, not a new enquiry. A different ID from the same email is a separate enquiry, subject to cooldown.
- Write/flush errors can be ambiguous: the row may have persisted even if the response failed. The error page says **could not confirm**, not “not saved”. Retry the same ID/details; if the row exists, recover its original receipt. No automatic retry with a new ID. Browser refresh of a POST can resubmit; idempotency covers this.
- Sheets is not a transactional database. A partial/corrupted row, manual edits/deletions, platform failures or external writers can defeat guarantees; the handler fails closed on schema/read failures but cannot repair corrupted data automatically. Locking does not provide ACID transactions or unlimited availability.
- Accepted rows supply durable rate history, avoiding a second counter write. Email cooldown and global caps limit accepted traffic, not attempted executions. Bots can rotate email addresses, bypass the honeypot and exhaust Google execution quotas; no trusted client IP or browser-origin authentication is available through this request contract. These are **basic abuse controls, not strong bot protection**. CAPTCHA/authentication or a more capable backend would be a later architectural decision.
- Metadata scanning grows with Sheet size. The row cap bounds routine operation; use this for modest enquiry volume only. Raising the cap increases execution cost. Apps Script quotas, owner account restrictions and outages can block service; no SLA or guaranteed delivery is claimed.
- HTML form navigation bypasses the need for cross-origin JavaScript response access; it does not authenticate the caller. Anyone knowing the public endpoint can POST. CORS/origin fields and public frontend “API keys” are not spam protection. No GET mutation or data retrieval exists.
- Automated tests mock Google services. Live anonymous deployment, actual Sheets formatting, Google HTML sandbox rendering, platform quotas and simultaneous real executions require the manual checks above. No Google deployment, form delivery or production availability has been verified in this phase.

## References

- Web apps and POST parameters: https://developers.google.com/apps-script/guides/web
- Script Properties: https://developers.google.com/apps-script/guides/properties
- Lock and flush guidance: https://developers.google.com/apps-script/reference/lock/lock
- Spreadsheet formula interpretation: https://developers.google.com/apps-script/reference/spreadsheet/range
- Quotas: https://developers.google.com/apps-script/guides/services/quotas
