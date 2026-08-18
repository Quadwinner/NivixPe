# IFSCA Sandbox Readiness Plan — End to End

**Version:** 1.0
**Date:** 2026-08-09
**Goal:** Get Nivix into IFSCA FinTech Regulatory Sandbox testing
**Primary source:** IFSCA FinTech Sandbox Framework, Circular F.No. 505/IFSCA-FTec0FTEF/1/2023, dated **16 March 2026** (16 pages) + FAQ dated 07 August 2026

> This plan is built from the **actual framework text**, extracted and read directly — not from summaries. Everything below cites the clause it comes from.

---

## 0. Correction to earlier documents — read this first

Earlier docs in this repo (including `NIVIX_INVESTOR_TECHNICAL_BRIEF.pdf` §6 and `NIVIX_LEGAL_ARCHITECTURE_BLUEPRINT.pdf`) state that the IFSCA sandbox *"permits a stablecoin-settled pilot with real customers."*

**The framework text does not say that.** I over-claimed. What Appendix-1 and Appendix-2 actually permit:

| Permitted (verbatim) | Clause |
|---|---|
| "Banking including but not limited to … **Payment Services (PSs) and Payment & Settlement Systems (PSSs)**" | Appendix-1 (ii) |
| "**Distributed Ledger Technology (DLT)**" as a technology solution | Appendix-2, TechFin (xvi)(e) |
| "**Tokenization support services**" | Appendix-2, TechFin (xxii) |
| "Digital identity / KYC / AML / CFT" | Appendix-2, TechFin (xvi)(c) |

**Nowhere in the framework do the words virtual digital asset, VDA, crypto, or stablecoin appear.** DLT is permitted as *technology*; there is no stated permission to use a stablecoin as a *settlement asset* for customer money.

This is not necessarily fatal — clause 13 provides the mechanism (below) — but it changes the ask from *"we qualify"* to *"we must explicitly request an exemption and may be refused."*

> **Clause 13:** "Requests for relaxations/exemptions from the regulatory requirements can be considered by the Authority after analysing specific sandbox testing applications. The Applicant seeking such relaxations or exemptions **shall specify** the regulatory relaxations/exemptions sought… The Authority reserves the right to grant, or refuse, or grant with such modifications."

**Action:** the application must name the stablecoin-settlement exemption explicitly and argue it. Do not assume it is pre-permitted. Correct the investor brief before it is shared further.

---

## 1. Three hard constraints discovered in the framework

These were not in any prior plan and each one bites.

### 1.1 🔴 The FSE cannot transact in INR

> **Clause 28(i):** "transact **only in the foreign currency** as specified in the First Schedule of the IFSCA (Banking) Regulations, 2020… However, the FinTech Sandbox Entity **may defray their administrative expenses in INR** account."

Also: books/records must be kept in a freely convertible foreign currency **other than INR** (28(ii)), and financials reported to IFSCA in **US Dollar** (28(iii)).

**What this means architecturally:** the sandbox entity may never touch customer INR. INR is permitted only for paying its own office expenses. Any INR leg must sit **entirely** with a licensed domestic partner, outside the FSE's perimeter.

**Impact on corridor direction — this is material to a decision already taken:**

| Direction | Under clause 28 |
|---|---|
| **USA → India (inbound)** | Clean fit. Sender pays USD (foreign currency — permitted for the FSE). Recipient's INR payout is executed by a licensed Indian partner, never by the FSE. |
| **India → USA (outbound)** | Awkward. Sender pays INR — which the FSE cannot receive. Requires the domestic partner to collect INR and settle to the FSE in USD, pushing the entire INR collection leg outside the sandbox perimeter and raising the unresolved question of what authorization *that* leg needs. |

You chose "both directions" before this constraint was known. The code can and should stay direction-agnostic, but **inbound is now clearly the one to take into the sandbox first.** Outbound needs the INR-collection-leg authorization question answered before it can be part of the application.

### 1.2 🟡 Physical presence in GIFT City may be triggered

> **Clause 40:** FRS testing may be undertaken **remotely** — "Provided that the FinTech Sandbox Entity **shall be required to establish its physical presence** in the IFSC where the testing involves the **holding of customer's fund** that necessitates the opening of a bank account with an IFSC Banking Unit."

So: hold customer funds → physical GIFT City presence + IFSC Banking Unit (IBU) account required. Pure orchestration where partners hold all customer funds → test remotely.

This is a **design lever, not just a legal fact.** The architecture already has partners holding customer fiat and Nivix holding only its own treasury — which points toward remote testing. But whether fiat in transit through Nivix's own account counts as "holding customer's fund" is a question for counsel, and the answer determines whether you need a GIFT City office.

### 1.3 🟡 A Testing Partner may be mandatory

> **Clause 15:** "One of the conditions of the 'In-Principle Approval' **may require the Applicant to have at least one Testing Partner**."

> **Clause 3(s):** a Testing Partner is an entity rendering financial services (or aiding such activities) "with whom the Applicant has a **Memorandum of Understanding (MoU), Letter of Intent, or a similar arrangement**."

This answers an open question from the prior plan: partner selection is **not just an engineering concern — it can be a regulatory precondition.** An MoU or LoI with a payment partner may be required before Limited Use Authorisation is granted.

**Action:** start partner conversations now, and specifically ask for an MoU/LoI (not just API access). Lead time here is commercial, not technical.

---

## 2. Eligibility — Nivix qualifies, via more than one route

> **Clause 5(iii):** An Applicant from India, including IFSC, shall be:
> (a) a company under the Companies Act 2013 / LLP / partnership, or a Branch thereof in IFSC; **or**
> (b) an entity registered with **DPIIT as a start-up** relating to FinTech; **or**
> (c) an entity regulated by a Domestic Financial Sector Regulator; **or**
> (d) an individual or group of individuals affiliated with a duly recognised research or academic institution, **incubator**, or accelerator established in India.

Nivix has **three** viable routes: (a) NivixPe Private Limited as a Companies Act company; (b) DPIIT startup registration if held; (d) affiliation with **Bennett University Hatchery** as a recognised incubator.

Also required:
- **Clause 5(i)–(ii):** must use innovative technology in the core product, and there must be "a genuine need for testing… in a controlled environment."
- **Clause 6:** the proposal must detail direct benefits to users/ecosystem **and** include "adequate risk management strategies to prevent any adverse impact."
- **Clause 7:** before applying, "the Applicant **shall explore** suitability/applicability of the IFSCA (TechFin and Ancillary Services) Regulations, **2025**." — a parallel regime that must be checked and the check documented.

---

## 3. The real application timeline

Two-stage process via the **SWIT portal** (`swit.ifsca.gov.in`), not a form download.

```
Preliminary Application (SWIT)
        │  ≤ 30 days — IFSCA assesses suitability  [clause 9]
        ▼
Acceptance communication received
        │  Only now may you file the Final Application  [clause 3(j), 10]
        ▼
Final Application + application fee  [clause 11 — per IFSCA Fee Circular 08 Apr 2025]
        │  ≤ 60 days — IFSCA examines  [clause 14]
        ▼
"In-Principle Approval"
        │  ≤ 30 days to satisfy conditions (may include Testing Partner)  [clause 15]
        ▼
LIMITED USE AUTHORISATION  →  Testing Stage begins
```

**Minimum realistic time from first submission to authorisation: ~4 months (≈120 days).** That is the floor assuming no resubmissions and no delay in meeting In-Principle conditions.

**Testing Stage duration** — clause 21: **maximum 12 months**, extendable **once by 6 months** at IFSCA's discretion on written request. So 18 months maximum.

---

## 4. There are no published customer/volume caps — they are set per entity

An earlier open question was "what are the current sandbox caps." The framework's answer: there is no published number.

> **Clause 3(d):** "'**Boundary Conditions**' means the parameters or conditions, specified by the Authority **in the Limited Use Authorisation letter**, within which a FinTech Sandbox Entity shall operate, and which may, inter-alia, include restrictions on **duration, customer type, transaction, and geographic scope**."

Caps are imposed individually in your authorisation letter. Practical consequence: **you should propose your own limits in the application** (customer count, per-transaction cap, corridor scope) rather than wait to be told. A well-reasoned self-imposed limit is evidence of the "risk measured/graded testing conditions" IFSCA evaluates on (criterion e).

---

## 5. Obligations during testing — these are product requirements, not paperwork

Several framework clauses translate directly into **features that must exist in the app** before testing begins. This is the part most easily missed.

| Obligation | Clause | What must be built |
|---|---|---|
| Disclose to users what is being tested + inform them **in writing** of key risks | 19 | A sandbox disclosure screen in the product |
| Obtain user **acknowledgment** that risks were read and understood, **before onboarding** | 20 | Consent capture, persisted, auditable per user |
| Disclose whether losses will be compensated + terms, and obtain **express written consent** | 20 | Compensation-terms disclosure + separate consent record |
| Clearly defined **user rights and grievance redressal mechanism** | criterion (h) | A working complaints intake + resolution trail |
| **Monthly status report** to IFSCA before the 10th of the following month | 23 | Reporting queries/exports: KPIs, milestones, statistics |
| Report fraud/operational incidents + actions taken | 24 | Incident log with remediation tracking |
| **Final report** within 30 days of Testing Stage expiry | 25 | Outcome/KPI reporting, full account of incidents and complaints |
| Maintain records **7 years** after sandbox exit | 26 | Retention policy; do not hard-delete audit data |
| Report any restraining/prohibiting regulatory order within 15 days | 27 | Process, not code |
| Prior **written approval** for any material change during testing | 22 | Change-control discipline — no silent scope changes |

The Hyperledger Fabric compliance ledger (locked decision) is well-suited to the audit trail and 7-year retention obligations, and is worth presenting in the application as exactly that.

---

## 6. The plan — two tracks in parallel

Engineering does not wait on legal, and legal does not wait on engineering. But the application quality depends on having something real to describe.

### Track A — Application (starts now, ~4 month critical path)

**A1. Pre-application homework**
- Read the FAQ (07 Aug 2026) in full alongside the framework.
- Clause 7 check: assess and **document** whether IFSCA (TechFin and Ancillary Services) Regulations 2025 apply instead of / alongside the sandbox route.
- Confirm which eligibility limb to apply under (company / DPIIT / Bennett incubator affiliation).
- Confirm current fees from the IFSCA Fee Circular dated 08 April 2025.
- Contact the Division of FinTech Sandbox (`fe-sandbox@ifsca.gov.in`) with a scoping question — free, and establishes a record of good-faith engagement.

**A2. Resolve the four decisive legal questions** (counsel — these gate the application content, see §8)

**A3. Secure a Testing Partner** — MoU or LoI with a licensed payment partner. Commercial lead time; start immediately. Clause 15 may make this a precondition.

**A4. Draft the application** — must contain, per the evaluation criteria (clause 12):
- Test scenarios with expected/desired outcomes (criterion d)
- Risk management strategy (clause 6) and graded testing conditions (criterion e)
- Self-proposed Boundary Conditions (customer count, transaction caps, corridor scope)
- User disclosures, consent design, grievance redressal (criteria f, g, h, i)
- **Explicitly specified regulatory exemptions sought** — including the stablecoin-settlement exemption (clause 13)
- Post-testing deployment/monitoring strategy **and** exit strategy (criterion l)
- Evidence of intent to undertake market-exploration activity within the IFSC (criterion m)

**A5. Submit Preliminary Application** via SWIT → await acceptance → **A6. Final Application + fee** → **A7. Satisfy In-Principle conditions**

### Track B — Engineering (starts now, must be demo-ready before authorisation)

The sandbox needs a **working, demonstrable system with real customers** — not a prototype. Scope is narrower than the full product but the quality bar is higher.

**B0. Security remediation — blocking, do first**
Cannot demonstrate a compliance-focused product with these open (all verified by direct code read):
- `apps/api/src/kyc/provider.ts:37-40` — `verifyWebhook()` returns `true` unconditionally: **anyone who can reach the port can approve any user's KYC** and trigger a Fabric write. Fatal for a compliance pitch.
- `apps/api/src/config.ts:21` — `JWT_SECRET` has a dev fallback, so the required-check can never fire.
- `apps/api/src/routes/kyc.ts:34` — HMAC computed over re-serialized JSON, not raw bytes; real signatures can never verify.
- `apps/api/src/index.ts:8-18` — no CORS, helmet, rate limiting, or error handling; Express 4 does not catch async rejections and no route has try/catch.
- **Committed secrets in git** (`git ls-files` confirmed): `data/treasury-keypair.json` (Solana treasury private key), `bridge-service/.env.production` / `.staging` / `.backup`, both `WALLETS_REGISTRY.json`, `nivixpemain.pem` (SSH key). **Rotate all, then purge history.** A regulator-facing application cannot coexist with a leaked treasury key.
- Zero tests exist; `npm test` passes against zero specs — a false green.

**B1. Money data model** — Prisma money models + double-entry ledger. Currently **no `Decimal` column exists anywhere** in the schema; nothing can hold a monetary amount. Books must be denominated in a non-INR foreign currency per clause 28(ii) — bake that into the schema rather than retrofitting.

**B2. Provider abstraction + simulated adapters** — `CollectionProvider` / `PayoutProvider` / `TreasuryProvider`, following the existing `KycProvider` pattern. Simulated first; real sandbox credentials swap in behind the interface.

**B3. FX/quote engine** — rate provenance persisted, spread explicit, **hard-fail when no rate available**. The legacy engine silently returned `1.0` for unknown pairs (`exchange-rate-service.js:382`) — an ~83× mispay on INR→USD. Structurally impossible in the rebuild.

**B4. Transfer orchestration** — state machine across both legs with every failure path named; end-to-end idempotency; retryable money operations on the worker.

**B5. Treasury** — real USDC **transfers only**, never mint/burn. Balance-based checks (legacy assumed unlimited because it held mint authority). Multisig/MPC custody, no key on disk.

**B6. Sandbox compliance surface** — the §5 table: disclosure screens, consent capture, grievance intake, incident log, monthly-report exports, 7-year retention.

**B7. Reporting & reconciliation** — ledger-vs-partner drift detection, low-treasury alerting, and the monthly KPI export clause 23 requires.

---

## 7. Sequencing

```
Month 0        B0 security + secrets rotation  │  A1 homework, A2 counsel, A3 partner MoU
Month 1        B1 money model, B2 providers    │  A4 draft application
Month 1–2      B3 FX, B4 orchestration         │  A5 SUBMIT PRELIMINARY  ──┐
Month 2–3      B5 treasury, B6 compliance UI   │  (≤30d assessment)        │
Month 3        B7 reporting/reconciliation     │  A6 Final Application + fee
Month 3–5      Harden, test, demo-ready        │  (≤60d) → In-Principle → A7 conditions (≤30d)
Month ~5       ▼ LIMITED USE AUTHORISATION → Testing Stage (12 mo, +6 mo extension)
```

Engineering has roughly the length of the approval process to become demo-ready. That is a genuinely comfortable runway — provided B0 starts now.

---

## 8. The four questions that decide the application (for counsel)

Sharper than the previous plan's list, because the framework text narrowed them:

1. **Will IFSCA grant a clause 13 exemption for stablecoin settlement of customer value?** The framework permits DLT and tokenization *support services* but never mentions VDAs or stablecoins as settlement assets. This is the single question the whole architecture rests on. Ask `fe-sandbox@ifsca.gov.in` early, informally, before spending on a formal application.
2. **Does clause 28(i) permit the inbound model as designed** — FSE receives USD, licensed domestic partner pays INR to the recipient, FSE never touches INR? And for outbound, what authorization does the INR-collection leg require (AD category / RBI PA-CB framework)?
3. **Does the design trigger clause 40 physical presence?** Does fiat in transit through Nivix's own account constitute "holding customer's fund" requiring an IFSC Banking Unit account and a GIFT City office — or does partner-held-funds orchestration permit remote testing?
4. **Per clause 7, do the TechFin and Ancillary Services Regulations 2025 apply** instead of or alongside the sandbox route?

---

## 9. What changed versus the previous plan

| Previously | Now (framework-verified) |
|---|---|
| "Sandbox permits stablecoin-settled pilot" | **Not stated anywhere.** Requires an explicit clause 13 exemption request that may be refused |
| Sandbox caps unknown, to be looked up | **No published caps** — set per entity as Boundary Conditions; propose your own |
| Corridor direction: both, equally | **Clause 28 bars the FSE from INR** — inbound (USA→India) is the clean fit; outbound needs the INR-leg question resolved first |
| Partner choice = engineering concern | **May be a regulatory precondition** (clause 15 Testing Partner MoU/LoI) |
| Timeline unclear | **~4 months minimum** to authorisation; 12+6 months testing |
| Compliance = documentation | **Product features**: consent capture, disclosures, grievance intake, monthly reporting, 7-year retention |
| GIFT City presence assumed | **Conditional** on whether customer funds are held (clause 40) |

---

*Sources: IFSCA FinTech Sandbox Framework (16 Mar 2026) and FAQ (07 Aug 2026), both retrieved from ifsca.gov.in and read in full. Clause numbers cite the framework. This is a build/application plan, not legal advice — §8 must go to counsel.*
