# Notification contention fix — TEST verification, 5 November 2026

## Confirmed defect

Two live notification claims remained Sending while form submissions overlapped the worker. The old final check returned false both for a busy script lock and a stale claim. The worker then returned `claim_not_current` before invoking MailApp, leaving the durable claim in Sending. Paused notifications also skip lease cleanup, so the rows remained visible in that state.

The corresponding executions at 16:13:25 and 16:14:25 IST logged `claim_not_current`, with recorded acceptance counts of zero and three. Their final claim timestamps matched the two held rows; each retained one lifetime attempt. This call-path evidence establishes that those specific attempts stopped before MailApp. The owner independently confirmed receipt of the other seven messages.

## Fix and safety

- A claim starts with a durable `pre_send` marker in the existing metadata column.
- A final locked token/lease/kill-switch check must persist and flush `send_started` before MailApp can be called outside the lock.
- Lock contention is distinct from a stale claim and attempts a bounded Pending retry.
- If completion is also contended, an abandoned `pre_send` claim can safely recover after lease expiry, with the existing five-attempt limit and token fencing.
- Legacy, unknown-phase, possibly-sent and Uncertain outcomes never automatically retry.
- No schema, Google scope, pricing, frontend or hosting changes.

## Evidence and current boundary

| Check | Result |
| --- | --- |
| Original three purchase choices, Contact and Support | PASS: live Google receipts and matching independently read Sheet rows |
| Correct server prices, duplicate prevention, changed submission ID | PASS: live verification before this fix |
| Original seven recorded sends | PASS: owner confirmed actual mailbox receipt |
| Two specific pre-send stops | Recovered through the existing guarded operator helper while notifications were disabled; now Pending, lifetime attempt counts preserved |
| Automated regression suite | MOCK: 223 tests passed, including eight added contention/send-boundary cases |
| TypeScript, build, 17-page export, diff checks | PASS |
| Fix deployed to existing TEST endpoint | PASS: Version 3, temporary recovery wrapper removed |
| New live email retest after the fix | BLOCKED pending explicit approval for two recovered plus five fresh synthetic emails |
| Physical mobile and alternate browser engines | BLOCKED: not independently tested |

The browser approval gate stopped renewed outbound-email testing. Notifications were returned to false. Independently re-read outbox: nine entries, seven Sent and two Pending; no additional recorded sends. Form intake remains enabled. No Sent history or enquiry rows were deleted or rewritten. The existing single worker remains installed. No PR merge, website redeployment, Canva or DNS change was performed for this fix.

## Form/storage mapping

There are three form types and five main journeys. All write to the same private TEST Google spreadsheet, not separate Excel files:

| Form type | Journeys | Tab |
| --- | --- | --- |
| Purchase Enquiry | 512 GB, 1 TB, 1 TB + Backup Plus | Purchase Enquiries |
| General Contact | Contact | General Contact |
| Technical Support | Support, with optional references/category | Technical Support |

Notification Outbox is a fourth metadata tab, not another form. Before any sending approval is used, recheck the recipient and full eligible queue. Do not automatically requeue other legacy/Uncertain records. MailApp Sent metadata alone is not proof of mailbox delivery.

Rollback: leave notifications disabled; retain all enquiry/outbox history. Restore the previous reviewed project code and Web App version if necessary, without deleting Script Properties or resetting the eligibility cutover. The time-driven worker uses saved project code, independently of the selected Web App version.
