# Phase 3A — reusable enquiry forms

Historical Phase 3A checkpoint. Phase 3B now integrates the forms; see `PHASE-3B-ENQUIRY-JOURNEYS.md` for the current routes, setup and validation.

This draft is stacked on PR #3 (`feat/apps-script-enquiry-backend`), not `main`. It adds a reusable component only. Existing Home, Order, Support, navigation, copyable purchase enquiries, pricing, legal policies, backend source and deployment workflows are unchanged. No endpoint is configured, no live submission is made, and no merge/deployment/DNS change is included.

## New files

- `src/EnquiryForm.tsx`: accessible purchase/general/support form and native POST lifecycle.
- `src/enquiry.ts`: typed fields, UUID generation, validation, endpoint configuration, normalized retry fingerprint and session draft loading.
- `src/enquiry.css`: component-scoped responsive styles matching the current site.
- `tests/enquiry-form.test.mjs`: actual React component tests plus real Apps Script contract/processor checks.
- This document and review screenshots in `docs/review/phase3a/`.

No packages added. Temporary local preview files used for visual checks are not part of the PR.

## Future consumer API (not integrated in Phase 3A)

Import the named `EnquiryForm` export. It accepts:

- `type`: `purchase`, `general`, or `support` (exact backend values).
- `configuration`: required for purchase, disallowed by TypeScript for the other types. Pass the current `Configuration` returned by the existing `useConfiguration()` hook. The form does not introduce a new product-selection store, mutate purchase URLs, or default every Support enquiry to a purchase.
- `draftKey`: optional stable identifier, default `default`. Each concurrently mounted form of the same type must have a distinct key. Keep a consumer's key stable across retries, remounts and return navigation.
- `endpoint` and `consentVersion`: optional explicit configuration overrides. Otherwise read public Vite configuration below.

For purchase, the card shows the selected storage, personal/backup capacity and unchanged product price from `src/config.ts`. Its hidden `configuration_id` and integer `displayed_price` match that selection. All three configurations are tested against the actual backend catalogue; server pricing remains authoritative.

## Configuration and safe disabled state

Set the build-time public variables `VITE_ENQUIRY_ENDPOINT` and `VITE_ENQUIRY_CONSENT_VERSION` only after the owner has deployed and verified the backend. Both default to empty. No live URL or consent version has been invented in the application.

The endpoint must be a canonical HTTPS `script.google.com/macros/s/<deployment-id>/exec` URL, without credentials, query or fragment. `/dev`, alternate hosts and HTTP are rejected. The consent version must match the owner's `CONSENT_VERSION` Script Property and its 1–40-character allowlist. These values are public configuration; never put Sheet IDs, Google tokens or secrets into any `VITE_` variable.

Until both settings are valid, the Send button is disabled and a submit-handler guard prevents Enter/programmatic submit from navigating. A browser without secure UUID generation also cannot submit. Real anonymous Google submission, confirmation rendering and storage must still be verified after manual backend deployment.

## Exact POST contract

Submission is a normal `method="post"`, `enctype="application/x-www-form-urlencoded"`, `target="_self"` form navigation. No fetch/XHR, JSONP, `no-cors`, iframe, automatic success callback or payment processing exists. The configured Google result page is the only delivery confirmation; the local UI only says that confirmation is opening.

Common fields: `submission_id`, `enquiry_type`, `full_name`, `email`, `mobile`, `message`, `consent` (checked checkbox value `yes`), `consent_version`, and empty honeypot `website`.

Purchase only: `delivery_pin`, `configuration_id`, `displayed_price`.

Support only: optional `order_reference`, `device_serial`, `issue_category` (`setup`, `photos`, `files`, `remote-access`, `backup`, `hardware`, `other`). General enquiries never include support/device or purchase fields. Buyers are never asked for a serial number.

Client checks match the backend's names, raw length bounds, invalid controls, email/mobile syntax, consent and six-digit nonzero-leading PIN requirement. The optional purchase message and required general/support messages match the backend. A check on the actual URL-encoded form payload (including browser CRLF newline encoding) enforces the 20,000-byte cap; Unicode and trimmed whitespace cannot bypass it. Backend validation still decides acceptance.

## Retry and privacy behavior

1. Generate a cryptographic UUID v4 when preparing the form (`crypto.randomUUID`, or secure `getRandomValues` fallback; never `Math.random`).
2. On a valid explicit submit, compare the normalized payload with the last submitted snapshot. A genuine unchanged retry reuses its UUID. A different submitted message/contact field, purchase configuration/price or consent version gets a new UUID. Equivalent normalized case/phone formatting/outer whitespace remains the same logical enquiry; edits reverted before sending also remain the same enquiry.
3. Save the raw draft, UUID, normalized fingerprint and timestamp to `sessionStorage` **before** allowing navigation. Flush the new hidden UUID into the DOM, then use the native form submit method. The submitted UUID is not left one render behind.
4. Restore the submitted draft on remount/refresh. A `pageshow` handler releases the pending guard when browser Back restores a page from its back-forward cache. A busy guard prevents double clicks.
5. If session storage is blocked/full, do not POST: explain that a safe retry cannot be retained. No memory-only fallback pretends to preserve a draft across Google navigation.
6. Clear details & start a new enquiry deletes the stored draft, empties fields, unchecks consent and generates a fresh ID. Storage-removal failure is reported honestly rather than claiming personal details were cleared.

Each purpose/key has separate storage. Nothing is saved while typing before the first attempted valid submission. Submitted details have a 24-hour validity; a timer removes saved data while the component is active, and expired/malformed records are discarded on loading. Browsers can suspend timers or restore sessions; physical removal may wait until execution resumes. Visible in-memory fields can remain while the customer is actively using the form. A subsequent explicit attempt refreshes the saved timestamp. No persistent localStorage, PII in URLs, analytics or logs is introduced.

Draft data and its fingerprint contain personal details in same-origin session storage; they are not encrypted or protected against same-origin scripts/XSS. The form tells customers about tab-local retry storage and provides explicit clearing. Consent/privacy wording must receive owner review before enabling real enquiries. Existing legal documents are unchanged.

There is intentionally no automatic clearing on success: a cross-origin Google confirmation cannot safely be inferred. Customers clear the saved draft when done. Later page integration must return to a consumer with the same type/draft key; the backend's current return URL points to the website root, where this component is not yet mounted.

## Validation and review

- 38 new component/contract tests pass; full project suite: **121 tests pass**.
- Standalone TypeScript check, production build and 15-route export validation pass.
- Tests drive actual React inputs, capture the native form payload, pass it to the actual `ncValidate_`, and run an original/unchanged/changed enquiry through `ncProcess_` to check receipt recovery and distinct enquiries.
- Coverage includes all purposes/configurations, optional/required fields, labels/privacy link, focus/error messaging, endpoint guards, payload encoding limits, secure IDs, storage denial/quota/corruption/expiry, clearing, remounts, pending/Back behavior and distinct draft keys.
- All three variants checked in an isolated local preview at verified 375px, 768px and 1440px: no horizontal overflow, no serial fields for purchase, PIN only for purchase, submission disabled. Browser keyboard Tab moves from Full name to Email. Screenshots show the actual standalone component, not a newly integrated public page.

The existing GitHub validation workflow only triggers for PRs targeting `main`. This stacked draft targets PR #3's branch, so no validation run is expected without changing CI scope. CI workflows are deliberately unchanged; local checks above are complete.

## Backend contract findings and remaining integration work

No POST field, catalogue price or capacity mismatch was found. The backend uses the short label `1 TB + Backup Plus`; the site displays `1 TB + 1 TB Backup Plus`. Both use `backup`, ₹81,900, 1 TB personal storage plus a separate 1 TB backup SSD.

The current backend accepts Indian mobile numbers only, requires an owner-configured consent version and caps URL-encoded requests at 20 KB. The form exposes these constraints and fails closed. A future backend price discrepancy must be reviewed explicitly; the form does not silently alter an agreed price or claim acceptance.

Live endpoint configuration, owner consent review, real Google-hosted confirmation/Sheet writes and integration into customer pages are later phases. No live receipt or end-to-end delivery is claimed in Phase 3A.
