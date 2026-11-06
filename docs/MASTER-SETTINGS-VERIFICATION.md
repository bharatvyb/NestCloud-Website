# MasterSettings verification

The initial migration results below are historical. V1 completion results are recorded separately at the end; they do not imply publication of the draft frontend.

## Automated verification

`npm test`: 240 tests passed. `npx tsc --noEmit`, `npm run build`, `npm run check:export`, and `git diff --check` passed. The build exported and validated 17 pages. GitHub PR #6 validation passed for implementation `44bf37b`, layout follow-up `127cc8c`, and final legacy-switch guard `f0920b6`.

Focused coverage includes exact legacy migration/cutover retention, idempotent reruns, schema conflicts, required values, boolean false/numeric zero, numeric bounds, execution caching, fresh notification kill switch, ignoring retained properties, public/private separation, stock-controlled new purchases, accepted duplicate receipts, unchanged server prices, frontend consent loading and safe failure. The existing notification concurrency/recovery suite remains passing.

## Live TEST verification — 5 November 2026

PASS — The existing TEST project and SAME restricted spreadsheet were used. No resources were renamed. The migration was first validated on Web App version 5 (`127cc8c`). Final source was saved with no temporary wrapper and deployed as version 6, description `TEST MasterSettings — PR #6 f0920b6; migration safeguards; notifications disabled`, retaining its URL and owner/anonymous access settings. The local staging purchase form successfully loaded settings from this final version with no console errors. No website publication, merge, DNS, Canva or domain change was performed.

PASS — Migration added 13 settings and a SettingsWiki tab documenting those settings plus SPREADSHEET_ID. The six explicitly configured values were copied exactly; four optional numeric values preserve their prior effective defaults. The three newly approved stock switches were initialized TRUE. A second migration reported zero added settings and preserved existing values.

PASS — Independent Google Sheets UI copies of all four original data tabs matched the pre-migration baseline exactly: 11 Purchase Enquiries, 8 General Contact, 4 Technical Support, and all 14 Sent notification records. All seven legacy Script Properties were independently compared and unchanged, including the original cutover. The original single time-driven worker trigger remains present. Notifications remained FALSE; explicit worker verification reported disabled and zero accepted sends.

PASS — The local-only staging frontend loaded current consent and availability from the live Web App through an anonymous GET. The browser followed Google's ContentService redirect successfully; no CORS error was observed. The public website was not deployed. Direct navigation in the signed-in multi-account browser can still produce Google's generic Drive error; this was not treated as backend failure or resolved by weakening access controls.

PASS — Temporarily setting all three stock flags FALSE in MasterSettings caused each live-backed local Purchase form (512 GB, 1 TB and Backup Plus) to show configuration-unavailable feedback and disable submission, without any redeployment. General Contact and Technical Support remained enabled. All three switches were restored to TRUE afterward; the purchase form recovered on refresh. Prices remained ₹49,900 / ₹59,900 / ₹81,900.

MOCK — Backend stock rejection, accepted duplicate receipts after stock disablement, full POST journeys, malformed/missing settings, source/notification failures and dispatch safety were verified with automated regression fixtures. No new live enquiries or emails were submitted during this migration, and no fresh mailbox-delivery claim is made.

## Rollback and remaining gates

Follow SettingsWiki's rollback order: disable notifications in both stores, restore the prior reviewed saved project code AND existing deployment version, reconcile any changed settings against retained properties, and roll back the frontend integration if it has been published later. Never delete enquiry/outbox history or reset the cutover.

PR #6 remains draft and stacked on unmerged PR #5. Public website activation requires a separate review/approval. Retained properties must not be removed until the owner explicitly approves cleanup. Notification delivery behavior is regression-tested here; no new live email is sent to demonstrate settings migration. Production publication remains blocked pending separately approved hosting decisions.

## V1 completion — approved TEST verification, 5 November 2026

PASS — All 257 automated tests, explicit TypeScript check, production build, 17-page static export validation and diff checks passed. GitHub Actions passed for code commit `a386ae7`. New coverage verifies per-form switches, accepted retries, maintenance enforcement, banner text/link safety, shared initial requests, the 60-second refresh timer, cleanup, overlapping-request cancellation, failure/recovery and existing notification regressions.

PASS — With explicit TEST-only owner approval, the SAME project and Web App were updated to version 7 (`TEST V1 MasterSettings — PR #6 a386ae7; notifications disabled`). The reviewed source was deployed before adding settings, avoiding the older reader's unknown-key rejection. The unchanged endpoint worked against the original 13-key table before migration. The existing migration then added exactly eight keys. Independent Sheet reads verified 21 settings and a SettingsWiki reference covering all 21 plus SPREADSHEET_ID. Temporary editor wrappers were removed; saved source exactly matched reviewed code.

PASS — Anonymous public GETs returned only the fixed `available`, `consentVersion`, `returnUrl`, `forms`, `banner`, `maintenance`, `stock` projection. No notification recipient, private spreadsheet ID, cutover, limits, enquiry rows or outbox metadata appeared. Settings edits were visible through this endpoint without redeploying code.

PASS — The LOCAL-ONLY draft frontend, backed by the live TEST Google endpoint, remained compatible with the previous public projection. Sheet changes disabled all three form views and displayed the new banner. Text containing `<plain text>` remained literal text; the optional HTTPS link was correct. Purchase and Contact were also observed re-enabling independently while the remaining disabled form stayed blocked; all three forms recovered after final restoration.

PASS — Automatic refresh was separately verified against a local **production build** with no Vite development client or hot reload. The Contact form was initially enabled and contained unsent synthetic text. After CONTACT_FORM_ENABLED was changed to FALSE and the banner enabled in the Sheet, the already-open page disabled submission and showed the banner; this was observed 89 seconds after the edit. The synthetic input remained intact, proving no page reload. After restoration, the same page re-enabled submission and hid the banner, with its unsent text still intact (observed at 101 seconds after restoration). No code was redeployed during the test. The shared timer is exactly 60 seconds in the focused automated test; these live observation times include request latency, browser scheduling and the observation interval, not a measured exact refresh duration. No synthetic text was submitted.

PASS — With all three form switches TRUE and SITE_MAINTENANCE TRUE, the live API exposed maintenance and all three local form views disabled submission. The configured `<please wait>` text rendered literally. Contact, Technical Support and existing device-support links stayed accessible. A malformed temporary Support test cell also caused public settings to return only `{available:false}` and disabled submissions; it was corrected and the entire eight-row test block revalidated before continuing. No code defect or data loss was inferred from that invalid configuration.

PASS — Final independent Sheet/API/UI checks confirmed:

- PURCHASE_FORM_ENABLED, CONTACT_FORM_ENABLED, SUPPORT_FORM_ENABLED: TRUE.
- STOCK_512GB, STOCK_1TB, STOCK_BACKUP_PLUS: TRUE.
- SITE_MAINTENANCE, BANNER_ENABLED, NOTIFICATIONS_ENABLED: FALSE.
- BANNER_MESSAGE: `Welcome to NestCloud!`; BANNER_LINK: blank.
- MAINTENANCE_MESSAGE: `Website temporarily unavailable.`
- All original 13 settings, seven legacy properties, eligibility cutover and single worker trigger preserved. Initial worker verification reported disabled with zero sends.
- All four original data tabs matched their independently copied pre-update contents exactly: 11 Purchase, 8 General Contact, 4 Support and 14 Sent outbox records. No new enquiries or emails were created.

MOCK — New-enquiry POST rejection/acceptance, exact accepted-receipt retries under disabled forms/maintenance, rate/price behavior, unsafe links and notification concurrency/recovery were exercised through automated fixtures only. No new live POST was permitted or performed. Browser evidence validates the local draft frontend against Google TEST, not publication of PR #6 to GitHub Pages.

Remaining gates: neither PR is merged. Public frontend publication is unapproved and unchanged. DNS, Canva and nestcloud.in are untouched. No legacy property cleanup is approved. Full rollback over a 21-key table must follow SettingsWiki's compatibility warning; do not blindly reactivate version 6. No remaining V1 implementation blocker was reproduced in this controlled verification.

## Final release review — 6 November 2026 (Asia/Kolkata)

The three individual forms now require explicit normalized `true` in both public availability and new backend submissions. Missing keys disable; malformed values fail closed. The frontend's missing forms projection also disables every form. Provisioning still writes initial TRUE values explicitly. Existing accepted-receipt lookup precedes the individual gate, including a settings-reader validation exception.

All 263 tests, explicit TypeScript check, build, 17-page export validation and diff checks passed. Added regressions cover each missing/malformed form switch, public API rejection, typed/string TRUE normalization, frontend failure behavior and accepted-receipt recovery. Existing notification regressions remain passing. Final GitHub validation must be checked on the pushed review head and rerun after main synchronization/retarget.

Read-only live verification confirmed the existing TEST Sheet's three form switches remain TRUE, with notifications, banner and maintenance FALSE. The existing public endpoint still returns the three form booleans TRUE. No Google source/deployment/settings mutations, new enquiries or emails were performed in this review. Version 7 still contains the previously approved V1 code; deployment of this final fail-closed patch requires new explicit approval. Earlier live V1 checks must not be misrepresented as deployment/testing of this final patch.

The Pages endpoint repository variable exactly matches the current TEST URL, with no github-pages environment override; the base path remains `/NestCloud-Website/`, custom domain remains null and no CNAME file was added. A live nestcloud.in read still contains Canva bootstrap markers. See [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md) for the PR #5-first merge order, non-rewriting PR #6 synchronization/retarget, diff/CI gates and the automatic-main-deployment approval warning. Nothing has been merged, deployed or retargeted by this review.
