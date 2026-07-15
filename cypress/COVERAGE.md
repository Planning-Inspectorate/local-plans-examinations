# Cypress user-journey coverage

This file tracks what the Cypress tests cover from a user's point of view. It is not source-code line coverage; unit/source coverage is tracked separately with `npm run test-coverage`.

Update this file when Cypress tests are added, removed, renamed or materially changed. If a feature is intentionally covered by unit tests, service tests or manual testing instead of Cypress, record that explicitly.

Coverage levels:

- Smoke: checks the page or journey is basically reachable
- Page content: checks important static/rendered content
- Validation: checks user-facing validation behaviour
- Journey: checks a meaningful end-to-end user flow
- Regression: protects a known bug or higher-risk edge case
- Unit-only: intentionally covered below Cypress level
- Manual-only: intentionally not automated
- Gap: not yet covered

## Manage

| ID          | Area                     | Level        | Coverage                                                                                     | Specs                                                                              | Notes                                                                                           |
| ----------- | ------------------------ | ------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| COV-MAN-001 | Home                     | Smoke        | Manage home loads and case list empty/populated states render                                | `manage/smoke/home.cy.ts`, `manage/case-overview/page-content/case-overview.cy.ts` | Home list states are checked with and without seed data                                         |
| COV-MAN-002 | Create case              | Journey      | Full happy-path case creation through submit                                                 | `manage/create-case/journey/create-case.cy.ts`                                     | Covers one main route through the form, including Check your answers change links               |
| COV-MAN-003 | Create case details      | Validation   | Required validation for case officer, plan title and plan type                               | `manage/create-case/validation/case-details.cy.ts`                                 | Required-field checks only; valid saves are covered by the journey test                         |
| COV-MAN-004 | Create case LPAs         | Validation   | Required LPA validation, selecting, changing and removing LPAs                               | `manage/create-case/validation/local-planning-authorities.cy.ts`                   | Uses two LPAs to prove add/change/remove and hide-remove behaviour, not every list combination  |
| COV-MAN-005 | Create case contacts     | Validation   | Required contact validation, adding, changing and removing contacts                          | `manage/create-case/validation/contact-details.cy.ts`                              | Uses two contacts to prove add/change/remove and hide-remove behaviour, not every list pattern  |
| COV-MAN-006 | Create case page content | Page content | Check answers and key stage dates page content                                               | `manage/create-case/page-content/*.cy.ts`                                          | Checks page state and expected fields, not date validation or every line of copy                |
| COV-MAN-007 | Case overview            | Page content | Overview tab renders populated/unstarted rows and action links                               | `manage/case-overview/page-content/case-overview.cy.ts`                            | Checks all current row action URLs. We do not click every row because they use the same pattern |
| COV-MAN-008 | Case overview updates    | Journey      | Representative Change and Answer links update overview answers                               | `manage/case-overview/journey/case-overview.cy.ts`                                 | Clicks examples of text, radio, contact and unanswered rows rather than every repeated link     |
| COV-MAN-009 | Create case CYA edits    | Regression   | Check your answers edit flows return correctly for new journeys and list add-another actions | `manage/create-case/journey/create-case.cy.ts`                                     | Protects the sticky CYA state bug and add-another behaviour for LPAs and contact details        |
| COV-MAN-010 | Gateway 1                | Page content | Gateway 1 tab renders expected rows, seeded answers and action links                         | `manage/gateway-1/page-content/gateway-1.cy.ts`                                    | Checks the Gateway 1 view and all current row action URLs                                       |
| COV-MAN-011 | Gateway 1 updates        | Journey      | Representative Gateway 1 date and DSA answers update from the tab                            | `manage/gateway-1/journey/gateway-1.cy.ts`                                         | Date rows use the same component, so one date update is clicked end-to-end                      |
| COV-MAN-012 | Gateway 1 validation     | Validation   | Blank Gateway 1 date shows the expected validation error                                     | `manage/gateway-1/validation/gateway-1.cy.ts`                                      | Covers the shared date component; DSA blank state would need a separate seed case               |
| COV-MAN-013 | Case history             | Journey      | Case History tab shows the case creation history after a case is created                     | `manage/case-history/journey/case-history.cy.ts`                                   | Covers the only history event currently written; add more rows when more events are implemented |

## Portal

| ID          | Area                 | Level        | Coverage                                                                                                     | Specs                                                            | Notes                                                                      |
| ----------- | -------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| COV-POR-001 | Home                 | Smoke        | Portal home loads                                                                                            | `portal/home.cy.ts`                                              | Smoke only                                                                 |
| COV-POR-002 | Login email          | Page content | Sign-in page content                                                                                         | `portal/login/page-content/email.cy.ts`                          | Static checks                                                              |
| COV-POR-003 | Login email          | Validation   | Email validation                                                                                             | `portal/login/validation/email.cy.ts`                            | Covers blank, invalid and unrecognised email messages                      |
| COV-POR-004 | Login OTP            | Page content | OTP page content                                                                                             | `portal/login/page-content/otp.cy.ts`                            | Uses seeded login state rather than a real email                           |
| COV-POR-005 | Login OTP            | Validation   | OTP validation                                                                                               | `portal/login/validation/otp.cy.ts`                              | Covers blank and incorrect OTP messages                                    |
| COV-POR-006 | Login journey        | Journey      | Recognised email reaches OTP page; valid OTP reaches landing page                                            | `portal/login/journey/login.cy.ts`                               | Uses seeded case/OTP data rather than real Notify delivery                 |
| COV-POR-007 | Cookies              | Validation   | Cookie banner links to cookie page and persists accept/reject choice                                         | `portal/cookies/validation/cookie-banner.cy.ts`                  | Covers link, consent cookie and persistence, not analytics script blocking |
| COV-POR-008 | Plan details         | Page content | Plan details page renders title, reference, metadata and progress                                            | `portal/plan-details/page-content/*.cy.ts`                       | Covers the view only; Gateway submissions are separate journeys            |
| COV-POR-009 | Plan details         | Journey      | Plan details opens from My plans and returns using the back link                                             | `portal/plan-details/journey/plan-details.cy.ts`                 | Checks navigation, not the stage action journeys                           |
| COV-POR-010 | Declaration          | Page content | Declaration page renders heading, caption, inset text, checkboxes and submit button                          | `portal/gw2-application/page-content/declaration.cy.ts`          | Includes service navigation, back link, and privacy notice link            |
| COV-POR-011 | Declaration          | Journey      | Back link navigates to gateway 2 application page; confirm and submit navigates to application complete page | `portal/gw2-application/journey/declaration.cy.ts`               | Requires both checkboxes checked before submission                         |
| COV-POR-012 | Declaration          | Validation   | Error shown when not all checkboxes selected; submission reference generated on each failed attempt          | `portal/gw2-application/validation/declaration.cy.ts`            | Covers no checkboxes, one checkbox each scenario                           |
| COV-POR-013 | Application complete | Page content | Application complete page renders heading, body content and return to plan link                              | `portal/gw2-application/page-content/application-complete.cy.ts` | Static content checks                                                      |
| COV-POR-014 | Application complete | Journey      | Return to your plan link navigates to the plan details page                                                  | `portal/gw2-application/journey/application-complete.cy.ts`      | Uses seeded plan data                                                      |

## Known gaps

| Area                             | Status             | Notes                                                                                         |
| -------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| Case history updates             | Gap                | Only case creation writes history at present; add update-event coverage when implemented      |
| Plan band                        | Gap                | Add as a separate Case Overview row when implemented                                          |
| Delete case                      | Gap                | Add as a separate Case Overview row when implemented                                          |
| Notify email delivery            | Manual/service led | Best verified manually or with service-level tests unless a stable local test double is added |
| OTP resend/new-code flow         | Gap                | Existing Cypress test is skipped because it depends on Notify-style behaviour                 |
| Cookie analytics/script blocking | Gap                | Consent persistence is covered; blocking non-essential scripts is not covered by Cypress      |
