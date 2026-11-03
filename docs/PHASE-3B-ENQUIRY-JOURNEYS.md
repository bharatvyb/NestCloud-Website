# Phase 3B — customer enquiry journeys

Historical Phase 3B checkpoint. The subsequent security/QA corrections, current validation count, fallback routes and CI behavior are documented in `ENQUIRY-SECURITY-QA-REVIEW.md`.

Continues draft PR #4 on `feat/enquiry-form-components`, stacked on PR #3. No merge, deployment, DNS, pricing, policy-body or payment changes. No new packages.

## Routes and navigation

- Product configurator → `/order?configuration=<id>` → **Enquire to Buy** → `/purchase-enquiry?configuration=<id>`.
- Purchase form reads the existing shared `useConfiguration` store. Review and form show the same configuration, numeric POST price and storage details. The review link preserves the explicit selection; URL, session preference and existing browser-history reconciliation remain authoritative. Buyers are never asked for a serial number.
- Footer **Contact Us** → `/contact`, a general form with required message and no purchase/support fields.
- Footer **Technical Support**, Support hero and troubleshooting links → `/support#contact`, a support form with required problem description and optional order reference, device serial and issue category. A storage query parameter never turns Support into a purchase form.
- Contact and support link to each other and to storage selection. Both new routes are in the static export and metadata registry. Order and purchase-enquiry are noindex and omitted from the sitemap. Existing policy routes and complete legal bodies remain intact.
- Purchase no longer requires a copyable summary or Canva handoff. All forms retain the existing `https://nestcloud.in/support` link as a clearly separate alternative, with a notice that entered details do not transfer there. Do not remove it until the new endpoint is verified live.

The historical Phase 3A document describes the component, exact POST contract, draft privacy/retention and retry lifecycle. The stable default draft key per purpose is retained here. Revisit the same form to recover a submitted draft; use browser Back for unchanged retries. The Google result page's fixed return link points to the website root: customers can return through Order/Enquire to Buy, Contact Us or Technical Support. A cross-origin result does not automatically clear drafts or indicate local success. Drafts are not saved before the first valid submission attempt.

## Enablement after manual backend setup

1. Complete `apps-script/README.md` setup against a private test Sheet/project. Review consent and retention with the owner.
2. Verify the anonymous production `/exec` endpoint, all three types, receipt and row creation, unchanged retries, errors and Google confirmation UI. None of those live Google checks has been performed by this PR.
3. Set the public build variables `VITE_ENQUIRY_ENDPOINT` and `VITE_ENQUIRY_CONSENT_VERSION`. The version must match the backend `CONSENT_VERSION`. Locally these can be environment variables; for the existing Pages workflow use repository Actions **Variables** with these exact names. The Pages build step now passes them through. They are public, not secrets; never add Google credentials, Sheet IDs or tokens as Vite variables.
4. A later explicitly authorized build/publication will embed those values. Missing or malformed values leave submission disabled and the existing contact alternative available. This PR has not changed repository variables, invoked Actions, enabled a live endpoint or published the website.

Submission is direct native URL-encoded form POST to Google with same-tab navigation. No fetch/JSONP/no-cors, automatic delivery claim, payment collection or iframe is introduced. Existing limits, required consent, safe-retry storage failures, UUID generation, personal-data handling and server-authoritative pricing are unchanged from Phase 3A. Google platform, anonymous access, quotas, server prices and actual writes remain server-controlled.

## Validation

- Full suite: **120 tests pass**, including **7 new whole-journey tests**. Obsolete copy/paste journey tests were replaced; the total is lower than Phase 3A because that journey no longer exists. All 38 reusable-form tests remain.
- New tests mount the actual App, follow real link destinations through simulated document remounts, drive all three configurations and purposes, capture native POSTs and pass them to the real Apps Script validator. No synthetic URL is used by the website or actually requested.
- Purchase coverage includes displayed price/selection, no buyer serial, submitted draft restoration and UUID reuse, review changes, session continuity, reload and actual Back/Forward. Existing selection tests also cover blocked storage. Form submissions fail closed if session storage is unavailable.
- General/support cover required message errors, preserved input, inline alerts/focus, exact relevant fields, optional support references, and Support remaining support even with a configuration query. Navigation audit verifies local destinations and fallback links.
- TypeScript, production build and 17-page static-export verification pass. Six policy-body hashes and source update dates pass unchanged.
- Production preview: Order, Purchase Enquiry, Contact Us and Support checked at **375px, 768px and 1440px**. No horizontal overflow; labels, consent, price/storage text and fallback remain readable. Keyboard Tab from Full name reaches Email. Submission is visibly disabled without settings. The browser's accessibility tree exposes named fields, required/optional text and status regions; no dedicated screen-reader application test was performed.
- Existing review workflow targets `main` only, so this stacked draft does not trigger GitHub validation. Local validation is complete; workflow triggers are unchanged.

## Remaining limitations

No live endpoint, consent version or real Google receipt/Sheet write has been configured or verified. The integrated journeys are implemented but cannot accept customer submissions until the manual setup and authorized publication. Google confirmation and actual Sheet formatting/concurrency need live testing. The existing external contact fallback remains available; its form submission was not tested. No payment/checkout service is added.
