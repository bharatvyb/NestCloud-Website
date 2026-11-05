# SettingsWiki — MasterSettings migration audit

Status: **audit and migration contract; runtime implementation and live migration are not yet applied**. This separate feature is stacked on the unmerged notification-hardening PR so its durable send-boundary and completion-lock fixes are preserved. Do not merge or deploy this feature until the pending scope decisions and migration verification are complete.

## Current implementation findings

The backend currently reads ten application settings and one bootstrap property. The existing TEST project has six of those application values explicitly configured; four optional rate/capacity controls currently use code defaults. No current runtime product-stock keys, MasterSettings reader, public settings response or SettingsWiki implementation were found. Product prices are fixed server catalogue values, not settings, and must remain unchanged.

The current private spreadsheet contains three enquiry tabs and Notification Outbox. MasterSettings has not been created or modified by this audit. Existing properties, enquiry rows, notification history and the cutover must be retained. Never commit the actual private spreadsheet ID or a dump of live private configuration.

## Application settings eligible for migration

The Public/private column describes the proposed exposure contract, not an existing public API. No caller may request arbitrary keys. Only the fixed public allowlist may be returned to the frontend. A value being non-secret does not make it public.

“No” under Redeploy means after the MasterSettings-backed implementation has been explicitly activated. The initial code migration and frontend integration do require reviewed deployments.

| Key | Description | Allowed values | Existing default | Used in | Public/private | Redeploy after migration? |
| --- | --- | --- | --- | --- | --- | --- |
| ALLOW_SUBMISSIONS | Backend enquiry intake switch; also suitable for frontend availability feedback | Boolean TRUE/FALSE; normalize to the existing literal true/false contract; invalid values fail closed | false when absent | `ncConfig_`, all form submissions; proposed public form availability | Public allowlist candidate | No |
| CONSENT_VERSION | Approved consent wording version required for new submissions | 1–40 letters, digits, dot, underscore or hyphen; required | None; copy the exact configured value | `ncConfig_`, `ncProcess_`, frontend form contract | Public allowlist candidate | No; frontend must load the current public value rather than depend only on a stale build-time version |
| RETURN_URL | Fixed confirmation return destination, never browser-controlled | Exactly `https://bharatvyb.github.io/NestCloud-Website/` or existing safe fallback `https://nestcloud.in/` | `https://nestcloud.in/` | `ncReturnUrl_`, `ncSafeReturn_`, confirmation page | Public allowlist candidate; already visible as a link | No |
| NOTIFICATION_EMAIL | Single staff mailbox receiving notifications, not the sender or customer recipient | One validated mailbox; no display name, comma list, whitespace or injected headers | `nestcloud@bharatvyb.com` only when absent; blank/invalid is rejected | `ncNotificationConfig_`, worker recipient snapshot | Private | No; disable dispatch and allow in-flight work to finish before changes |
| NOTIFICATIONS_ENABLED | Notification kill switch, separate from enquiry availability | Boolean TRUE/FALSE; missing/invalid must never enable sending | false | Worker entry, claim/send gates, operator recovery | Private | No; final send checks must not use stale cached enablement |
| NOTIFICATION_START_UTC | Existing eligibility cutover for reconciliation | Valid configured UTC ISO timestamp ending in Z; required for the existing outbox | **No migration default. Copy the exact existing cutover; never use the current time to replace it.** | `ncNotificationStart_`, reconciliation, enqueue eligibility, setup safety | Private | No; changing eligibility is a deliberate operational action, not routine repair |
| EMAIL_COOLDOWN_SECONDS | Cooldown between different accepted submissions from the same normalized email | Integer 0–86400 seconds | 60 | `ncConfig_`, `ncProcess_` | Private | No |
| GLOBAL_WINDOW_SECONDS | Rolling accepted-submission window | Integer 60–86400 seconds | 600 | `ncConfig_`, `ncProcess_` | Private | No |
| GLOBAL_MAX_SUBMISSIONS | Maximum accepted submissions within that window | Integer 1–1000 | 30 | `ncConfig_`, `ncProcess_` | Private | No |
| MAX_TOTAL_ROWS | Enquiry capacity safety cap across the three data tabs | Integer 1–50000 | 10000 | `ncConfig_`, `ncProcess_` | Private | No; do not raise this as a scaling workaround |

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
- A proposed public response may expose only a fixed projection of intake availability, consent version and the already-public return URL. Never expose notification recipients, cutover, limits, bootstrap IDs, arbitrary rows, enquiry data or outbox metadata. The native form POST and existing idempotency rules remain unchanged.
- Keep `NOTIFICATION_EMAIL` singular for V1. Multi-recipient delivery is outside this minimal migration.

## Migration safeguards and verification

1. Resolve stock-control scope and SettingsWiki location with the owner before inventing keys/tabs or backend behavior.
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
