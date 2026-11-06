# NestCloud enquiry backend

## Current configuration: MasterSettings migration (draft PR #6)

Use [SettingsWiki](../docs/SettingsWiki.md) for the current configuration reference, activation, verification and rollback procedure. The older Phase 2/notification setup instructions below describe the pre-migration backend and are retained as historical design context, **not as the current activation runbook**.

`SPREADSHEET_ID` is the only necessary runtime Script Property. Operational configuration is read from `MasterSettings` (`Key | Value`) in that same private spreadsheet. The private editor helper `migrateMasterSettings_()` validates and copies existing values and effective defaults, preserves the exact notification cutover, adds the three approved stock switches initially TRUE, and creates the `SettingsWiki` reference tab. It retains all legacy Script Properties. Do not delete them without explicit post-verification cleanup approval.

Keep notifications FALSE throughout migration. Preserve the existing project, Web App URL, single worker trigger, enquiry records and notification history. Existing MasterSettings values are preserved on reruns. Missing legacy consent/cutover or schema conflicts stop migration. Do not recreate enquiry/outbox tabs during upgrades.

This migration targets an existing installation with its original outbox and cutover. It deliberately refuses to recreate missing notification history. First-time notification initialization must use the pre-migration setup procedure before migration; never initialize a fresh cutover over an existing history.

`GET /exec?resource=settings` returns only intake availability, current consent version, safe return URL and three stock booleans. Generic GET remains the branded information page, with no enquiry lookup. All other settings stay backend-only. The frontend reads public settings on form mount and browser Back; errors fail closed, not back to stale build values. POST remains native form navigation with the existing receipt/idempotency behavior.

`STOCK_512GB`, `STOCK_1TB`, `STOCK_BACKUP_PLUS` control **new purchase enquiries**, not prices, quantities, General Contact or Technical Support. The backend recovers an existing matching receipt before checking stock. Missing stock switches mean unavailable. Changes apply without code redeployment after initial backend/frontend activation.

V1 completion adds `PURCHASE_FORM_ENABLED`, `CONTACT_FORM_ENABLED`, `SUPPORT_FORM_ENABLED` (TRUE), `BANNER_ENABLED` (FALSE), `BANNER_MESSAGE` (`Welcome to NestCloud!`), `BANNER_LINK` (blank), `SITE_MAINTENANCE` (FALSE), and `MAINTENANCE_MESSAGE` (`Website temporarily unavailable.`). The existing migration adds only these eight missing keys on the current 13-key Sheet and regenerates SettingsWiki. No legacy properties are deleted. Do not run it or update TEST code/deployment without the owner's new approval.

The fixed public projection additionally exposes form booleans, plain-text banner content with an optional validated HTTPS link, and maintenance notice controls. New form/maintenance gates run **after accepted duplicate receipt lookup** and before new writes. Global ALLOW_SUBMISSIONS behavior and notification processing are unchanged. Site maintenance keeps contact/support information accessible, but blocks new enquiry submissions. One shared frontend loader refreshes settings roughly every 60 seconds while mounted; the backend remains authoritative. Final release hardening requires explicit TRUE for each form in both public API and new-write enforcement; missing/malformed keys disable submissions, and a missing frontend forms projection disables every form. Migration's initial TRUE values are explicit provisioning, not runtime fallbacks. Existing accepted receipts remain recoverable. TEST remains on the previously approved version 7 until a new deployment is explicitly approved. See SettingsWiki and the release checklist.

V1 upgrade sequencing matters: deploy the new compatible backend against the existing 13 settings **before** running the eight-key migration; the old version-6 reader rejects unknown keys. Do not roll version 6 back over a 21-key table without an approved settings snapshot restoration. See SettingsWiki's V1 upgrade/rollback notes. No live mutation or deployment is authorized by these instructions alone.

Verification: `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run check:export`. Mock tests do not prove live browser CORS, Google Sheet writes or email delivery. No DNS, Canva, custom domain or public website deployment is part of this feature.

## Historical Phase 2 design and setup (pre-migration only)

The following describes the original implementation. Operational property references are superseded by MasterSettings above. Catalogue prices, payment integration and DNS remain unchanged.

## Files and execution

- `Code.gs`: public `doPost(e)`/`doGet(e)`, private validation, catalogue, lock/write adapter and editor-only setup helper.
- `Confirmation.html`: self-contained NestCloud HTML result page. Dynamic output is escaped; no external images/scripts, personal contact details, spreadsheet ID or stack traces are rendered.
- `appsscript.json`: V8, India time zone, spreadsheet, MailApp send-mail and trigger-management authorization scopes.
- `../tests/apps-script.test.mjs`: Node built-in tests loading the actual `.gs` source in a VM with mocked Google services. Run `node --test tests/apps-script.test.mjs` from the repository root; existing `npm test` also discovers these tests. No packages added.

A normal HTML form submits `application/x-www-form-urlencoded` by **POST**, navigating to the production Web App `/exec` URL. The result is a Google-hosted branded HTML confirmation/error page, not JSON. Success appears only after the row write and flush complete. No fetch, JSONP, opaque `no-cors` result, iframe or cross-window handshake is required. No frontend is provided in this phase.

Google's wrapper may display its own application banner. Google-controlled authorization/platform failures may show a Google error rather than our template. HTMLService does not provide a normal configurable HTTP status/header API; the HTML explicitly states the outcome. Do not use HTTP 200 or page load alone as proof of success.

## Exact manual Google setup

1. Sign into the Google account that will own the service. Create a **new blank Google Sheet** named `NestCloud Enquiries`. Keep General access **Restricted**; share only with authorized staff. Do not publish the Sheet or enable link sharing. Use a separate test spreadsheet first.
2. Copy the spreadsheet ID from the URL segment between `/d/` and `/edit`. Keep it out of the GitHub repository and frontend.
3. At `script.google.com`, create a **standalone** Apps Script project named `NestCloud Enquiries`. Replace the default `Code.gs` with this folder's `Code.gs`.
4. Add an HTML file named **Confirmation** and paste `Confirmation.html`. In **Project Settings**, enable **Show appsscript.json manifest file in editor**; replace the manifest with `appsscript.json`. No external libraries, Advanced Services or paid services are needed.
5. Under **Project Settings → Script Properties**, add the properties in the table below. Initially keep `ALLOW_SUBMISSIONS` set to `false`.
6. Apps Script's editor function selector may hide underscore-suffixed helpers. In the **undeployed** project, temporarily append `function setupTestEnquirySheets() { setupEnquirySheets_(); }` to `Code.gs`, save, select `setupTestEnquirySheets`, and run it. Authorize access to Google Sheets using the owner account. Review requested permissions: the manifest's spreadsheet scope is account-wide, not limited to the test Sheet. The existing private helper creates the three named tabs and exact header rows without overwriting existing data. After execution completes, **remove the temporary wrapper and save before any Web App deployment**, restoring the repository's exact `Code.gs`; do not rename or expose the private helper permanently. A blank default `Sheet1` may be deleted manually. If an existing tab has a different schema, setup stops; resolve it rather than replacing customer data.
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

## Optional email notifications — durable outbox

This feature is **implemented and mock-tested only**. It has not been copied into the staging project, deployed, authorized for MailApp, or used to send live email. The earlier Phase 5B Google Sheet results do not validate this new email path. No live notification is enabled by this repository change.

The customer-facing validation, UUIDs, catalogue, receipts, retries, three enquiry schemas and confirmation template are unchanged. Customer success still depends on the enquiry row and its flush. The outbox is best effort on that request; notification failures never change a saved success into a customer error. MailApp is never called from `doPost`.

### Configuration and ownership

| Script Property | Default / setting | Effect |
| --- | --- | --- |
| `NOTIFICATIONS_ENABLED` | Absent or `false` | Only exact `true` permits the worker to send. Separate from `ALLOW_SUBMISSIONS`. |
| `NOTIFICATION_EMAIL` | `nestcloud@bharatvyb.com` when absent | A single valid mailbox; no display name, multiple recipients, whitespace or injected headers. Set a controlled staff **test inbox** before staging enablement. An explicitly blank/invalid value fails closed. |
| `NOTIFICATION_START_UTC` | Set once by the setup helper | UTC eligibility cutover for reconciliation, e.g. an ISO timestamp ending in `Z`. Do not delete/reset it during upgrades. Historical enquiries before the initial cutover are not automatically emailed. |

Recipient changes require no code or website deployment. A worker snapshots configuration for its bounded run, and stores the recipient for each claim; the next run uses a changed address. Sent notifications never resend because the recipient changes. Do not put these properties, a Sheet ID or any Google credentials in frontend variables or public URLs.

Notifications disabled or misconfigured: enquiry saving and receipts continue. New eligible outbox entries remain Pending while disabled. If outbox creation failed, the worker reconciles missing entries after enablement, or an operator may run reconciliation without sending. Disabling cannot recall an email already in flight.

Use exactly one script project as writer and one trigger-owning account. Separate projects do not share a script lock. Trigger discovery only sees the current user's triggers; do not install duplicate workers using multiple accounts. The Sheet and script remain restricted to authorized staff. Mail is sent as the Google owner, with display name `NestCloud Enquiries`; the configurable staff recipient is not a spoofed sender address and requires no DNS change. Emailing adds a copy of customer data to the recipient mailbox: include that mailbox in staff-access and retention/deletion procedures.

### First setup / authorization (manual, approval required)

1. Work in a separate TEST project and Sheet first. Keep `NOTIFICATIONS_ENABLED=false`. For staging, set `NOTIFICATION_EMAIL` to an inbox you own/control, **not a customer address**, before ever enabling. Preserve existing `SPREADSHEET_ID`, `CONSENT_VERSION` and enquiry tabs.
2. Copy this reviewed `Code.gs`, unchanged `Confirmation.html`, and the updated manifest into the Apps Script editor. New scopes are `https://www.googleapis.com/auth/script.send_mail` (send email as the owner) and `https://www.googleapis.com/auth/script.scriptapp` (manage the owner's project triggers), in addition to account-wide Sheets access. Owner review/reauthorization is required before deployment; no credentials should be shared in chat or committed. No Gmail read scope, SMTP password or external service is required.
3. **Before deploying the new backend**, temporarily append `function notificationSetupForEditor() { setupNotificationOutbox_(); }`, save, run it and review permissions. It creates only `Notification Outbox`, with 13 frozen header columns, and sets the initial cutover to the current UTC time. It does not modify enquiry records, install a trigger or enable email. Existing headers must match exactly or setup stops. Remove the wrapper and save.
4. Verify the new tab and cutover. If deploying before setup was mistakenly allowed, saved enquiries still exist but may precede the new cutover: with notifications disabled, an operator must deliberately choose an earlier `NOTIFICATION_START_UTC` covering that gap and reconcile. Review the resulting Pending list before enablement. Moving the cutover backward deliberately backfills historical enquiries; never do that as an automatic repair.
5. Only after separate deployment approval, update the TEST Web App via Manage deployments → Edit → New version → Deploy to preserve its `/exec` URL. Saving editor code alone does not update the versioned Web App. Time-driven triggers, however, use saved project code rather than that Web App version; disable notifications and stop/remove the owned trigger before future code upgrades.
6. Temporarily add/run `function notificationTriggerForEditor() { installNotificationWorker_(); }`. It checks setup, requests MailApp authorization with a quota lookup, and installs at most one `processNotificationOutbox_` time-driven trigger using `everyMinutes(1)`. It sends no email and never sets `NOTIFICATIONS_ENABLED=true`. Remove the wrapper and save before any subsequent Web App deployment. Scheduling is approximate and subject to Google quotas/delays, not a one-minute delivery guarantee.
7. While disabled, submit a synthetic enquiry and independently verify its normal receipt/row and one Pending outbox entry. Run reconciliation using a temporary editor wrapper around `reconcileNotificationOutbox_()` if needed; this sends nothing. Verify that pre-cutover historical rows were not queued. Then explicitly approve and set `NOTIFICATIONS_ENABLED=true` for the controlled test inbox only.

If the outbox disappears after setup, the setup helper **refuses to recreate empty history**. Restore the original tab/backup first. Recreating it or deleting Sent rows could resend historical notifications; do not remove history to clear an operational error.

### Outbox state and reconciliation

The 13 columns are: `Submission ID`, `Enquiry reference`, `Created UTC`, `Status`, `Attempts`, `Total attempts`, `Last attempt UTC`, `Next retry UTC`, `Sent UTC`, `Error category`, `Claim ID`, `Claim expires UTC`, `Recipient`. This tab stores metadata only; the worker reads the existing saved enquiry row for email content, including the stored server-authoritative price. It never rewrites customer enquiry records.

The original script lock covers enquiry append/flush and outbox append/flush. If only the enquiry persists, reconciliation scans the three existing tabs and creates the missing logical notification keyed by submission UUID. Existing entries, including Sent/Failed/Uncertain, are never replaced by reconciliation. Persisted append with a lost acknowledgement is discovered rather than appended again. Duplicate IDs, conflicting references or unexpected schemas fail closed; restore data rather than guessing.

Each worker run reconciles at most 100 missing entries under the shared lock (no deletion or second customer ledger); it does not repeat that full reconciliation scan for each email. A run handles at most five claims and checks a 45-second budget between claims. It reads all three source tabs once for reconciliation and again before each attempted email: at most six full source reads per batch. Fresh preflight reads intentionally detect deleted/changed records rather than trusting a cached snapshot. Outbox history is also scanned for claim, lease and completion checks; up to 100 individual append/flush pairs during reconciliation can hold the shared lock and delay submissions. Even an idle enabled worker scans source/outbox history each invocation. These costs grow with retained history, including Sent entries, not just the Pending count. The current row cap/modest-volume usage is essential; do not raise it or delete Sent history as a scaling strategy. Slow individual Google calls and reconciliation can exceed the 45-second between-claims budget. Reconciliation progresses over subsequent runs when more than 100 gaps exist. It cannot reconstruct erased Sent history.

| Status | Meaning / action |
| --- | --- |
| Pending | Not sent by this attempt; wait for Next retry and a valid enabled configuration. |
| Sending | A durable claim with unique token and 10-minute lease. The Error category column temporarily holds `pre_send` until the final locked check persists and flushes `send_started`. Only then may MailApp run, outside the script lock. Other workers cannot claim an active lease. |
| Sent | MailApp returned successfully and status was persisted, or an operator explicitly verified a prior send. **Not proof of inbox delivery**; spam filtering, bounces and provider behavior remain outside this system. |
| Failed | Five safe pre-send attempts exhausted, or a claimed enquiry is missing/corrupt. Inspect the safe error category, fix the underlying issue and use the explicit recovery procedure. |
| Uncertain | MailApp raised after invocation, or a Sending lease expired. It may already have sent. No automatic resend. |

Safe pre-send failures (e.g. quota exhausted, quota lookup/source read failure) retry with 1, 2, 4 and 8-minute exponential delays, maximum five attempts per automatic cycle. Quota is checked before each send; concurrent unrelated scripts can still consume it afterward. Exhaustion may require operator retry after the daily quota resets rather than unbounded daily sending. `Attempts` counts the current cycle; `Total attempts` survives an explicit operator retry.

Source faults are not email delivery failures. `source_missing` means a required enquiry tab or the claimed saved record is absent. `source_corrupt` means an unexpected source schema, malformed identity/type, duplicate/conflicting reference or missing/invalid required email content (including a blank saved purchase price). The worker never reconstructs or edits these records, substitutes a current catalogue price, or sends incomplete customer details. A fault detected during reconciliation stops that invocation before claiming; a fault detected for an already-claimed record holds it Failed immediately, without automatic delivery retries. Restore independently verified source data and follow explicit recovery; simply restoring a row does not automatically requeue a Failed entry. An unreadable source (`source_unavailable`, e.g. a Google read exception) stops pre-claim reconciliation without consuming an attempt, or uses the existing bounded backoff if a claim was already made. Failed preflight status persistence is reported as storage/outcome failure, never a successful send.

Generic MailApp exceptions are **not classified as definitely unsent from their text**. They become Uncertain rather than blindly retrying a potentially accepted email. If MailApp succeeds but status write/flush or the execution fails, durable Sending remains (or Sent may already have persisted). Expired `send_started` and legacy/unrecognized Sending claims become Uncertain, never Pending, even if the subsequent source reconciliation fails (provided the outbox can be read/written). Claim tokens fence status updates, and active leases cannot be overridden by recovery.

Temporary lock contention at the final send check is distinct from a stale claim. Because MailApp has not been invoked, the worker attempts to return its claim to Pending with `pre_send_busy` and the existing bounded backoff. If that status write is also blocked, it reports `pre_send_deferred`; the durable `pre_send` claim can safely recover after its lease expires (`pre_send_interrupted`), subject to the same five-attempt limit. Expiry clears the old token before another worker may claim it. A failure/ambiguous acknowledgement while persisting `send_started` never calls MailApp: a persisted boundary still requires conservative Uncertain handling. This adds one write/flush at the send boundary, without adding columns or changing enquiry schemas. Never manually assign `pre_send` to legacy Sending or Uncertain records to force automatic recovery.

Status completion waits up to 10 seconds for the shared lock, matching the customer writer's existing bounded wait, instead of abandoning a successful send after only one second of contention. Waiting does not hold the lock or repeat MailApp. A genuine timeout or ambiguous storage failure still reports an unrecorded outcome and retains conservative possibly-sent handling; it never retries the email merely to obtain a successful status write.

Exactly-once email delivery is impossible across MailApp and Sheets. The system provides one logical notification and no automatic resend of marked Sent/Uncertain outcomes, not an exactly-once delivery guarantee. An interruption after the durable send boundary but before the actual MailApp call can also become Uncertain; conservative holding is intentional. Earlier `pre_send` interruptions are provably outside MailApp and can safely retry.

### Monitoring, recovery and rollback

Inspect the private outbox status, timestamps, recipient and safe error categories. The trigger execution log contains only a safe worker status and count of recorded MailApp acceptances (for example `disabled`, `invalid_configuration`, `source_missing`, `source_corrupt`, `source_unavailable`, `storage_unavailable`, `outcome_unrecorded` or `processed`), so a completed trigger execution is not automatically proof that mail was sent. No public status/retry endpoint or customer notification-delivery claim is added. The code does not log customer payloads, recipient addresses, MailApp exception details or customer contact data; Google execution metadata still exists.

For Failed or Uncertain entries:

1. Set **only** `NOTIFICATIONS_ENABLED=false`; keep `ALLOW_SUBMISSIONS` as required for ordinary enquiries. Stop the owner trigger with a temporary editor wrapper around `removeNotificationWorker_()` (only that owner's matching notification triggers are removed). This does not kill a running execution or recall mail; wait for active executions and the full 10-minute claim lease to finish.
2. Independently inspect the controlled recipient mailbox/provider evidence using the enquiry reference and recorded recipient/time. Absence from one inbox view alone is not proof of non-delivery. Do not add Gmail-reading permissions just for this feature.
3. If evidence confirms it was sent, temporarily run `resolveNotification_('SUBMISSION_UUID', 'mark_sent', 'CONFIRMED_SENT')` through an editor wrapper. This records the operator's confirmation time and sends nothing.
4. Only if evidence confirms it was **not** sent, fix the cause and temporarily run `resolveNotification_('SUBMISSION_UUID', 'retry', 'CONFIRMED_NOT_SENT')`. This resets the bounded cycle, retains Total attempts and returns it to Pending. No new logical entry/UUID is created. Remove all wrappers, reinstall the single worker if needed, and explicitly re-enable. Existing Sent entries cannot be requeued by this helper.
5. If the outcome cannot be established, leave Uncertain and investigate; do not guess or edit its status to Pending. The confirmation literals enforce an operator acknowledgement, not automatic proof. Human mailbox/provider verification is mandatory.

Rollback: set `NOTIFICATIONS_ENABLED=false`, remove the owner notification trigger, wait for in-flight work/leases, and retain the outbox plus cutover/history for audit and future reconciliation. Existing enquiries/receipts remain usable. If reverting Apps Script code, separately select the previously deployed Web App version; preserve Sheet schemas/data and do not delete Script Properties or outbox rows to simulate a clean install. The broader OAuth grant persists until the owner revokes it through Google; revocation can also affect the enquiry service, so review that separately. No rollback or deployment is executed automatically.

### Controlled staging verification (not yet performed for email)

- Phase 1 is code hardening only. No TEST/production Apps Script deployment, authorization, trigger installation or notification enablement is approved by this phase. Production website publication remains **BLOCKED** pending a separately approved hosting migration: `nestcloud.in` serves Canva, while GitHub Pages uses the repository-relative `/NestCloud-Website/` path. These changes do not migrate hosting or change either deployment.
- Obtain explicit approval before updating the TEST Apps Script project/deployment, granting the new scopes, installing the trigger, changing its properties or enabling sends. Do not use a real customer recipient or submit real customer data.
- Keep notifications off; independently verify Purchase (all configurations), General and Support rows/receipts and exactly one Pending entry per submission. Verify missing/invalid email configuration cannot turn a saved enquiry into failure.
- Deliberately retry one unchanged enquiry: same receipt, same logical outbox row. Introduce an outbox-creation failure in an isolated disposable test setup; restore it and run reconciliation, observing a single entry without changing the original enquiry.
- Explicitly enable only the controlled staff test inbox. Independently observe each actual email, reference, IST time, correct HTML/plain-text content, saved catalogue price/capacities and optional support fields, then correlate its Sent metadata. A mock or Sent row alone is not proof of inbox delivery. Google Gmail/Outlook/mobile rendering requires real mailbox checks.
- Check overlapping workers, disabled/enabled backlog retention and stale-claim handling. Do not exhaust real MailApp quotas, delete enquiry/outbox history, or inject ambiguous production sends to manufacture failures. Quota/write/interruption simulations remain MOCK unless separately executed under a safe approved staging procedure.
- Verify operator recovery with evidence; never automatically resend an ambiguous live email just to complete a test. Finish by disabling notifications again, preserving evidence, and reporting PASS/MOCK/BLOCKED/FAIL honestly. No live email acceptance is claimed by the automated tests below.

Run `node --test tests/apps-script-notifications.test.mjs` for the mocked notification tests, then the complete backend/frontend suites, TypeScript, build and export checks. All runtime notification helpers, installer, reconciliation and recovery functions remain underscore-suffixed/private. Temporary public editor wrappers must never be left in a deployed Web App.

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
- MailApp send/quota authorization: https://developers.google.com/apps-script/reference/mail/mail-app
- Time-driven scheduling: https://developers.google.com/apps-script/reference/script/clock-trigger-builder
- Trigger management authorization: https://developers.google.com/apps-script/reference/script/script-app
