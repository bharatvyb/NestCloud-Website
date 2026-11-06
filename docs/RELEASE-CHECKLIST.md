# Final release checklist — 6 November 2026 (Asia/Kolkata)

PR #7 adds payment gates and new catalogue prices. Use [the complete payment release checklist](PAYMENT-READINESS-REVIEW.md#release-checklist--all-remain-separately-gated) alongside this PR #5/#6 baseline. Do not release the new frontend against TEST backend version 7 or treat the historical 21-key/no-migration note below as the five-key checkout upgrade procedure.

PR #7 follow-up gate: paired manual Razorpay/MasterSettings coordination is approved and documented, but **new Live checkout remains NO-GO**. Official Test-card Success reproduced the callback error in the in-app browser and an owner-performed Chrome attempt; Test records are uncaptured/not Paid. Submit/review [the prepared provider request](RAZORPAY-SUPPORT-REQUEST.md), resolve shipping-rate setup and policy-link/mobile/image issues, and verify in-flight stock cutoff before advancing. Do not re-request already-approved dispatch/shipping-policy/manual-process decisions or treat approval of those decisions as release permission.

## Reviewed facts

- PR #5: draft `fix/notification-preflight-contention` → `main`, current validation passing, mergeable at review time.
- PR #6: draft `feature/master-settings` → `fix/notification-preflight-contention`. Preserve this stack until PR #5 merges. No merges, retargets, force pushes or deployments were performed in this review.
- All three form gates now require normalized literal `true` for public availability and new backend submissions. Missing keys disable; malformed settings fail closed. Accepted matching receipt lookup remains before the individual gate. The global ALLOW_SUBMISSIONS behavior is unchanged.
- Read-only TEST Sheet verification: PURCHASE_FORM_ENABLED, CONTACT_FORM_ENABLED and SUPPORT_FORM_ENABLED remain TRUE. NOTIFICATIONS_ENABLED remains FALSE; maintenance and banner remain FALSE. No values, legacy properties or records were changed.
- GitHub's repository variable `VITE_ENQUIRY_ENDPOINT` matches the existing TEST Apps Script endpoint exactly: `https://script.google.com/macros/s/AKfycbz2ooADtCplQXGwLrkExOaerEy441pZtuHY1CJU-aS77DSBqY9uCYrufMopSSfzA4Ue/exec`. The Pages build reads this variable directly; the `github-pages` environment has no endpoint/consent variable overrides. No production endpoint switch is implied.
- Vite and static export retain `/NestCloud-Website/`. Pages uses workflow deployment at `https://bharatvyb.github.io/NestCloud-Website/`, with custom-domain `cname: null` and no repository CNAME file.
- A live read of nestcloud.in still returned Canva bootstrap/public-path markers. Nothing in this release changes DNS, Canva or nestcloud.in. Keep them unchanged.

## Approval and deployment gates

- [ ] Obtain explicit approval for the final TEST Apps Script code/deployment update. Version 7 contains the prior V1 implementation, not this final fail-closed patch. Update the SAME endpoint only; no settings migration is needed because all 21 keys already exist. Keep notifications disabled. Recheck the public booleans and preserve records, trigger and legacy properties. Do not deliberately remove live keys or submit new enquiries without separate test approval.
- [ ] Resolve deployment timing before any merge: `.github/workflows/pages.yml` automatically builds/deploys on every push to `main`, including PR #5's merge. The current `github-pages` environment lists branch-policy protection only, with no required-reviewer approval gate. Approval to merge must expressly cover these automatic deployments. If the desired sequence is merge-first/publish-later, obtain explicit approval to pause/gate the workflow before merging; do not silently disable it or assume merging cannot publish.
- [ ] Obtain explicit merge/deployment approval. Both PRs remain draft and unmerged; nothing here authorizes release actions.

## Ordered merge and publish sequence — only after approval

1. Recheck PR #5's reviewed head, diff and passing CI against current main. Merge **PR #5 into main first**. Account for the automatic Pages deployment described above.
2. Synchronize `feature/master-settings` with the updated `main` without rewriting its history, then retarget PR #6 to `main`. A normal merge of main into the feature branch is suitable if synchronization is needed. Do not blindly replay/squash the stacked notification fixes. If PR #5 was squash-merged, inspect the resulting ancestry/diff carefully.
3. Review PR #6's new diff against main. Confirm it contains only the intended MasterSettings/V1/fail-closed changes, tests and docs; no reintroduced notification patches, pricing changes, credentials or deployment/domain changes. Confirm the final backend patch is active on the existing TEST deployment after its separately approved rollout.
4. Rerun all tests, TypeScript, build and export checks on the synchronized head, and require passing GitHub validation **after retargeting**, not just the earlier stacked CI result.
5. Immediately before publication, recheck VITE_ENQUIRY_ENDPOINT against the existing TEST URL, base path `/NestCloud-Website/`, `cname: null`, absent CNAME file and NOTIFICATIONS_ENABLED FALSE. Do not change repository variables or domain settings implicitly.
6. After explicit publishing approval, merge PR #6 and allow the existing Pages workflow to publish (or resume the separately approved workflow if it was paused). Verify the successful deployment's commit matches the reviewed merged head, not an earlier queued run.
7. Open the repository-relative GitHub Pages URL for manual testing. Verify settings load, form availability, banner/maintenance defaults, mobile/desktop layout and safe navigation. Actual new form submissions/emails require explicit test approval and synthetic data; none were performed in this final review. Confirm nestcloud.in still serves Canva afterward.

## Readiness

Code/tests are review-ready once the final PR #6 CI is green. This is **not an unconditional publish GO**: final TEST backend rollout approval, automatic-deployment timing approval, PR #5-first merge, PR #6 synchronization/retarget/diff review and fresh CI remain release gates. Do not delete legacy properties, Sheet records or notification history. Do not infer approval from this checklist.
