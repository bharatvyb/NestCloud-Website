# MasterSettings verification

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
