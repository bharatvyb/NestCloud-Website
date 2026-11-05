# SettingsWiki — MasterSettings

Status: **implemented in draft PR #6; live activation must be verified separately**. This feature is stacked on the unmerged notification-hardening PR so its durable send-boundary and completion-lock fixes are preserved. No merge or public website deployment is implied.

## Current implementation findings

The prior backend read ten application settings and one bootstrap property. The migration copies the six explicitly configured application values, preserves the four effective numeric defaults, and adds the three owner-approved stock switches as TRUE. V1 adds eight form/banner/maintenance settings (21 application settings total). Rerunning the existing migration adds only missing keys and refreshes the Sheet's SettingsWiki reference. Product prices remain fixed server catalogue values and are unchanged. The eight-key live update requires separate owner approval; the existing TEST version 6 has not been modified by this completion work.

The private spreadsheet retains its three enquiry tabs and Notification Outbox. `migrateMasterSettings_()` adds MasterSettings and SettingsWiki without modifying those existing tabs. It never deletes legacy properties or resets the cutover. Never commit the private spreadsheet ID or a dump of live private configuration.

## Application settings eligible for migration

The Public/private column describes the fixed public projection returned by `GET /exec?resource=settings`. No caller can request arbitrary keys. A value being non-secret does not make it public.

“No” under Redeploy means after the MasterSettings-backed implementation has been explicitly activated. The initial code migration and frontend integration do require reviewed deployments.

| Key | Description | Allowed values | Existing default | Used in | Public/private | Redeploy after migration? |
| --- | --- | --- | --- | --- | --- | --- |
| ALLOW_SUBMISSIONS | Backend and frontend enquiry intake switch | Boolean TRUE/FALSE, case-insensitive; invalid values fail closed | false when absent | `ncConfig_`, all forms | Public | No |
| CONSENT_VERSION | Approved consent wording version required for new submissions | 1–40 letters, digits, dot, underscore or hyphen; required | None; copy the exact configured value | `ncConfig_`, `ncProcess_`, frontend form contract | Public | No; frontend loads the current public value |
| RETURN_URL | Fixed confirmation return destination, never browser-controlled | Exactly `https://bharatvyb.github.io/NestCloud-Website/` or `https://nestcloud.in/` | `https://nestcloud.in/` | `ncReturnUrl_`, `ncSafeReturn_`, confirmation page | Public | No |
| NOTIFICATION_EMAIL | Single staff mailbox receiving notifications, not the sender or customer recipient | One validated mailbox; no display name, comma list, whitespace or injected headers | `nestcloud@bharatvyb.com` only when absent; blank/invalid is rejected | `ncNotificationConfig_`, worker recipient snapshot | Private | No; disable dispatch and allow in-flight work to finish before changes |
| NOTIFICATIONS_ENABLED | Notification kill switch, separate from enquiry availability | Boolean TRUE/FALSE; missing/invalid must never enable sending | false | Worker entry, claim/send gates, operator recovery | Private | No; final send checks must not use stale cached enablement |
| NOTIFICATION_START_UTC | Existing eligibility cutover for reconciliation | Valid configured UTC ISO timestamp ending in Z; required for the existing outbox | **No migration default. Copy the exact existing cutover; never use the current time to replace it.** | `ncNotificationStart_`, reconciliation, enqueue eligibility, setup safety | Private | No; changing eligibility is a deliberate operational action, not routine repair |
| EMAIL_COOLDOWN_SECONDS | Cooldown between different accepted submissions from the same normalized email | Integer 0–86400 seconds | 60 | `ncConfig_`, `ncProcess_` | Private | No |
| GLOBAL_WINDOW_SECONDS | Rolling accepted-submission window | Integer 60–86400 seconds | 600 | `ncConfig_`, `ncProcess_` | Private | No |
| GLOBAL_MAX_SUBMISSIONS | Maximum accepted submissions within that window | Integer 1–1000 | 30 | `ncConfig_`, `ncProcess_` | Private | No |
| MAX_TOTAL_ROWS | Enquiry capacity safety cap across the three data tabs | Integer 1–50000 | 10000 | `ncConfig_`, `ncProcess_` | Private | No; do not raise this as a scaling workaround |
| STOCK_512GB | 512 GB configuration availability for new purchase enquiries | TRUE/FALSE | false if missing; initial migration adds TRUE as approved | Purchase form and `ncProcess_` | Public | No |
| STOCK_1TB | 1 TB configuration availability for new purchase enquiries | TRUE/FALSE | false if missing; initial migration adds TRUE as approved | Purchase form and `ncProcess_` | Public | No |
| STOCK_BACKUP_PLUS | 1 TB + Backup Plus configuration availability for new purchase enquiries | TRUE/FALSE | false if missing; initial migration adds TRUE as approved | Purchase form and `ncProcess_` | Public | No |
| PURCHASE_FORM_ENABLED | Permit new Purchase Enquiries, subject to global intake, maintenance and stock | TRUE/FALSE | TRUE | Purchase React form and `ncProcess_` | Public boolean | No |
| CONTACT_FORM_ENABLED | Permit new General Contact enquiries | TRUE/FALSE | TRUE | Contact React form and `ncProcess_` | Public boolean | No |
| SUPPORT_FORM_ENABLED | Permit new Technical Support enquiries | TRUE/FALSE | TRUE | Support React form and `ncProcess_` | Public boolean | No |
| BANNER_ENABLED | Show the reusable site-wide announcement | TRUE/FALSE | FALSE | `SiteNotices` | Public boolean | No |
| BANNER_MESSAGE | Announcement content, rendered as plain text, never HTML | Text up to 500 characters, no unsupported control characters | `Welcome to NestCloud!` | `SiteNotices` | Public text | No |
| BANNER_LINK | Optional announcement destination | Blank or validated HTTPS URL, max 2048 characters; no credentials, whitespace, backslashes or unsafe schemes | Blank | `SiteNotices`, server/client URL validation | Public URL | No |
| SITE_MAINTENANCE | Show maintenance notice and block new enquiries of all three types | TRUE/FALSE | FALSE | `SiteNotices`, all React forms and `ncProcess_` | Public boolean | No |
| MAINTENANCE_MESSAGE | Maintenance notice, rendered as plain text on website/confirmation | Text up to 500 characters, no unsupported control characters | `Website temporarily unavailable.` | `SiteNotices`, backend maintenance rejection | Public text | No |

Defaults in this table are read from existing source code, not invented live values. An absent optional property is not evidence that an explicit value already exists in the spreadsheet. The migration must record whether it copied a configured value or preserved an existing effective default.

## Necessary bootstrap exception

| Key | Description | Allowed values/default | Used in | Exposure | Redeploy? |
| --- | --- | --- | --- | --- | --- |
| SPREADSHEET_ID | Identifies the same private spreadsheet before MasterSettings can be read | Required existing identifier, 20–200 letters/digits/underscore/hyphen; no default | Shared settings reader, setup and spreadsheet adapters | Private; retained in Script Properties, never frontend output | No code deployment, but changing this retargets data and requires separate approval |

No genuine application password, API secret or authentication credential was found among the current referenced properties. Google OAuth authorization scopes and account grants are not ordinary settings and must not be moved into a spreadsheet. Any future genuine secret must stay outside MasterSettings and frontend output.

## Minimal reader and security contract

- Use one shared conceptual `getSetting(key, defaultValue)` path. Its Apps Script implementation should be underscore-suffixed (`getSetting_`) so `google.script.run` cannot call it to retrieve private keys. Do not introduce a public arbitrary-key settings function.
- MasterSettings uses the requested `Key | Value` columns. Validate headers, duplicate/reserved keys, required values, expected types and numeric bounds. Preserve boolean false and numeric zero distinctly from missing values.
- Scope caching to a single request/worker execution, not persistent cross-execution caches. Changes should affect subsequent requests without redeployment. Preserve fresh notification kill-switch checks before sending; execution caching must not turn an old enabled snapshot into permission to send after disablement.
- Once activated, migrated runtime values must come from MasterSettings, not silently fall back to retained legacy properties. Missing/unreadable/malformed MasterSettings must fail safely, not reactivate old intake or notification values.
- The public response contains only `available`, `consentVersion`, `returnUrl`, `stock`, `forms` (purchase/general/support booleans), `banner` (enabled/message/link), and `maintenance` (enabled/message). Never expose notification recipients, cutover, limits, bootstrap IDs, arbitrary rows, enquiry data or outbox metadata. The native form POST and existing idempotency rules remain unchanged. Form/maintenance/stock checks follow duplicate receipt lookup and precede new writes. The original global ALLOW_SUBMISSIONS gate remains unchanged, including its pre-existing effect on retries. General Contact and Support are not stock-controlled.
- Keep `NOTIFICATION_EMAIL` singular for V1. Multi-recipient delivery is outside this minimal migration.

## Migration safeguards and verification

1. Scope is approved: three boolean stock switches, no quantities, and SettingsWiki in both repository and Sheet. Do not add other stock keys or change prices.
2. Audit the actual existing properties and the same private spreadsheet. Do not create another project, spreadsheet or deployment URL. Keep genuine TEST names unchanged.
3. While notifications remain disabled, copy eligible values into MasterSettings without resetting the cutover. Never overwrite a conflicting existing settings table or existing values blindly.
4. Read and validate the complete candidate settings through the new reader before activating it. Preserve all old Script Properties as a rollback reference; **no cleanup until the owner explicitly approves it after verification**.
5. Verify exact values, effective defaults, missing/malformed cases, fresh execution behavior, private/public separation, backend intake enforcement, duplicate receipts, original prices and notification claim/recovery semantics.
6. Keep all existing enquiry/outbox schemas and data intact. No test emails or history resets are implied by a settings migration; live sending tests require their own controlled authorization.
7. Document activation and rollback order. Once activated, legacy property edits must not unexpectedly affect migrated settings. Rollback must preserve history and avoid replaying notifications.

## Resource naming recommendations — not rename actions

| Resource | Actual operational recommendation | Genuine TEST resource |
| --- | --- | --- |
| Apps Script project | NestCloud Enquiries | Keep NestCloud Enquiries - TEST |
| Private spreadsheet | NestCloud Enquiries | Keep NestCloud Enquiries - TEST |
| HTML template file | Preserve `Confirmation.html`; code resolves the template by this filename | Same filename; do not rename it independently |
| Confirmation page title/branding | Keep NestCloud and the truthful enquiry outcome; no payment/order claim | Keep existing branding and safe result messages |
| Deployment description | NestCloud Enquiries — reviewed release reference | Keep an explicit TEST description and release reference |

No renames, URL changes, new public sharing, Google Pages custom-domain settings, DNS or Canva changes are authorized by these recommendations.

## Activation and rollback

1. Back up the reviewed code/version and privately record the existing Script Properties. Verify notifications are FALSE and no active Sending lease remains. Do not remove the single existing trigger or reset history.
2. Copy reviewed `Code.gs` into the SAME TEST project. Triggers use saved code, so keep notifications disabled throughout. No additional scopes are needed.
3. Run `migrateMasterSettings_()` from the editor. If the selector hides private helpers, use a temporary editor wrapper, then remove it before deployment. Migration validates all candidate values before writes. Legacy switches must use their original lowercase literals (`true`/`false`), with notifications `false`; malformed/uppercase legacy flags stop migration rather than silently enabling previously disabled behavior. MasterSettings itself accepts typed booleans and case-insensitive TRUE/FALSE. Existing MasterSettings values win on reruns; schema conflicts stop rather than overwrite data. A missing legacy consent/cutover stops migration rather than inventing either.
4. After explicit Google mutation/deployment approval, independently inspect MasterSettings (21 settings), SettingsWiki (21 settings plus bootstrap), original enquiry/outbox records, unchanged properties/cutover, notifications FALSE and single trigger. Validate the new reader before deploying a new version of the existing Web App, retaining its URL. Do not mutate TEST or its deployment under a code-only approval.
5. Check `?resource=settings` from an anonymous browser and the staging frontend origin. The JSON uses Google's ContentService redirect; fetch follows redirects. Browser/CORS behavior is a required live gate, not proven by unit mocks. Never use `no-cors` or infer success from opaque responses.
6. After separately approved frontend publication, `usePublicSettings` shares one initial GET and one approximately 60-second refresh timer per endpoint across all mounted consumers. Browser Back (`pageshow`) also refreshes. The timer/listener and pending request are cleaned up after the last consumer unmounts; overlapping old requests are aborted and cannot overwrite newer results. Failed refreshes disable submissions until recovery; drafts are preserved. Backend checks remain authoritative on every POST regardless of the latest frontend refresh. No private settings enter the bundle.
7. For controlled tests, toggle each stock flag and intake switch, refresh, confirm frontend/backend rejection, then restore exact values. Do not send live email or create new enquiries without separate test authorization. Use automated fixtures for rejection, idempotency, price and outbox fault cases.
8. Rollback: keep notifications FALSE in both stores, restore the previous reviewed project code and existing deployment version, and verify the retained legacy properties still match intended operational values. Roll back frontend integration together if needed. Do not delete settings tabs, enquiry rows, outbox history or cutover. Retained properties are NOT synchronized after migration: deliberately reconcile any subsequent settings edits before a legacy rollback.

MasterSettings is a small two-column table scanned once per execution. Notification enablement intentionally rereads the small table at existing final send/claim gates. No enquiry scans, persistent cache, extra triggers, inventory ledger or configuration framework were added. Invalid notification-only values do not block enquiry saving.

Reference: [Google Content Service](https://developers.google.com/apps-script/guides/content) documents the JSON response and one-time `script.googleusercontent.com` redirect.

## V1 behavior and compatibility

- V1 upgrade order after approval: save the reviewed code with notifications disabled, deploy the new backward-compatible backend version against the existing 13-key table, then rerun `migrateMasterSettings_()` to add eight defaults and refresh the Sheet wiki. The old version-6 reader rejects unknown keys, so do **not** add the new keys while that older Web App version is still active. Verify the public projection before and after migration; only then consider a separately approved frontend publication.
- Global intake AND the matching form switch must allow a new enquiry; maintenance blocks all new enquiry types. Stock additionally applies only to Purchase. An exact already-accepted backend retry still recovers its original receipt when a new form/maintenance/stock control is disabled; no new row or email is generated.
- Maintenance is a notice and submission gate, not a replacement website or schedule. Header/footer, Contact and Support pages, and existing device-support links remain accessible. No enquiry form submits during maintenance.
- Banner/maintenance strings are always text, never HTML. Blank BANNER_LINK produces no link. Unsafe links/malformed new fields fail public-settings validation rather than becoming clickable.
- For an existing 13-key deployment, missing new form switches default TRUE, banner and maintenance default FALSE. The frontend also understands the existing version-6 public projection. Malformed fields are not treated as missing. Defaults are code compatibility defaults, never a fallback to legacy Script Properties. Run the approved migration to materialize all eight requested settings.
- All seven legacy properties remain untouched. Notifications remain disabled. Sheet SettingsWiki is generated from `NC_SETTING_SPECS_`, including all new keys, types, defaults, consumers, public/private status and no-redeployment guidance. Its actual live refresh is pending owner approval for the eight-key update.
- For V1 feature rollback, set the three form switches TRUE, banner FALSE and maintenance FALSE while keeping the compatible backend. Do not blindly restore version 6 with a 21-key table: its strict reader rejects the eight new keys. A full rollback needs an approved restoration of the saved 13-key settings snapshot (never enquiry/outbox data), or a reviewed compatible backend. Legacy Script Properties and the historical cutover must remain intact.
