## Nivix Hybrid Payments: End‑to‑End Off‑Ramp Report (No Code)

### Executive summary
Nivix enables compliant, high‑throughput payments by combining a private compliance ledger with a public settlement layer and a bridge service. For fiat payouts, the system supports two off‑ramp options: (1) a pre‑funded local treasury account in the recipient country for fast domestic disbursements, and (2) a licensed partner/off‑ramp that accepts stablecoins, converts to local fiat, and pays out via local banking rails. Routing can be automatic or operator‑selected per corridor, with full auditability across blockchains and banking systems.

### Scope and assumptions
- Users are KYC‑verified before any transfer.
- Payouts occur only to accounts permitted by compliance policy.
- Stablecoin settlement uses established liquidity pools on Solana.
- Fiat payouts rely on either a local corporate treasury or regulated partners with third‑party disbursement rights.
- All fees, FX rates, and limits are transparently tracked and auditable.

### Architecture overview
- Hyperledger Fabric: Private compliance ledger for KYC/AML status, risk scoring, and immutable audit of payout metadata.
- Solana (Anchor contracts): On‑chain payment logic, liquidity pools, swaps, fee accounting, and event emission for settlement transparency.
- Bridge Service: Middleware that orchestrates KYC checks, on‑chain actions, off‑ramp routing, payout initiation, and status updates to the frontend.
- Frontend: User experience for onboarding, KYC, sending/receiving, and tracking payout status.

### Payment lifecycle (end‑to‑end)
1) KYC and eligibility
  - Sender and recipient identities are verified.
  - Risk score and corridor limits are retrieved from the compliance ledger.
  - If compliant, the transfer can proceed.

2) On‑ramp and tokenization
  - Fiat is deposited or already tokenized in the sender’s wallet (corridor‑specific).
  - Tokens represent claims on fiat reserves or can be swapped to settlement stablecoins.

3) Transaction initiation
  - Sender specifies amount, beneficiary details, and corridor.
  - Bridge creates a transaction record and links to compliance context.

4) On‑chain settlement
  - Depending on corridor, tokens are burned and/or swapped to a stablecoin (for partner settlement) using the liquidity pool.
  - On‑chain events capture amounts, fees, and references for audit.

5) Off‑ramp routing
  - Local treasury route: Disburse from the pre‑funded local bank via domestic rails.
  - Partner/off‑ramp route: Send stablecoin to partner, convert to fiat, and disburse locally.

6) Disbursement and confirmation
  - Bank transfer reference (UTR/ACH/SEPA/UPI) or partner payout ID is obtained.
  - Bridge marks completion and notifies the frontend.

7) Audit and reconciliation
  - Fabric records tie together KYC references, on‑chain events, fees, FX, payout IDs, and banking references for immutable audit.

### Dual off‑ramp options

1) Local treasury (pre‑funded local account)
- Best for domestic payouts: minimal latency and cost.
- Flow: KYC verified → burn corridor token (if applicable) → debit local treasury → payout via domestic rails (UPI/IMPS/NEFT/ACH/SEPA).
- Treasury must be proactively rebalanced to maintain corridor liquidity.

2) Partner/off‑ramp (licensed payout provider)
- Best for cross‑border or corridors without local treasury.
- Flow: KYC verified → swap to stablecoin → transfer to partner → partner converts and pays out locally.
- Requires corporate KYC/KYB with partner and proper controls for third‑party payouts.

### Worked example (numbers illustrative)

Example A: Domestic payout via local treasury (India)
- Requested amount: ₹8,325
- On‑chain: Tokens burned to reflect claim redemption.
- Payout: Domestic rails (UPI/IMPS/NEFT).
- Fees: Platform fee (e.g., 0.5%) and bank/PSP fee (corridor‑specific).
- Timing: Minutes for UPI; same‑day for IMPS/NEFT.
- Result: Recipient receives near the requested amount, net of transparent fees.

Example B: Cross‑border via partner off‑ramp
- Requested amount (target INR): ₹8,325
- On‑chain: Swap corridor token to USDC via liquidity pool at prevailing FX; pool fee applies.
- Settlement: Transfer USDC to partner; partner converts at desk/FX rates; payout fee applies.
- Timing: On‑chain minutes; partner payout typically hours to next business day.
- Result: Recipient receives local fiat; total fees include pool fee, partner FX/desk fee, and payout fee.

### Compliance and risk controls
- KYC/AML checks for sender and recipient, plus sanctions screening and corridor‑specific checks (e.g., purpose codes).
- Risk‑based limits: Dynamic ceilings tied to user risk score and corridor regulations.
- Travel Rule and data‑sharing obligations as required for cross‑border.
- Whitelisting of beneficiaries; optional cooling periods for first‑time payouts.

### Treasury and liquidity management
- Target balances per corridor with thresholds and alerts.
- Auto‑rebalancing between corridors by converting stablecoin reserves and funding local treasuries.
- Separation of customer funds, operational funds, and fee revenue per accounting policy.
- Periodic stress tests to validate payout capacity during peak demand.

### Operations runbook (high level)
- Startup: Launch Fabric network, Solana validator (or connect to cluster), Bridge Service, and Frontend.
- Preflight checks: Validate Fabric connectivity, on‑chain program IDs, liquidity pools availability, and off‑ramp partner health.
- Routing: Auto mode selects local treasury when above threshold; falls back to partner when low or when corridor policy mandates.
- Incident response: Retry policies for transient errors; escalation paths for partner or bank outages; user notifications.

### Monitoring and reconciliation
- Real‑time metrics: On‑chain confirmations, partner API latencies, payout success rates, treasury balances.
- Daily reconciliation: Match Solana events, Fabric records, partner reports, and bank statements.
- Dispute handling: Clear SLA for investigations, refunds, or re‑credits with full audit trail.

### Fees, FX, and timelines
- Transparent fee schedule: Platform fee, pool fee (if swap), partner FX/desk fees, payout fee.
- FX sourcing: Quotes from on‑chain pools or partner desk; slippage controls.
- Timelines: Domestic payouts minutes to same‑day; cross‑border partner payouts hours to T+1 depending on corridor and bank hours.

### Failure modes and safeguards
- Partner rejection: Retry or reroute to local treasury if permitted; otherwise hold and notify user.
- Bank rejection: Investigate reason code; correct and retry; escalate as necessary.
- Compliance hold: Mark transaction pending review; no funds move until cleared.
- System failures: Idempotent operations, durable transaction logs, and back‑pressure controls.

### Data recorded and auditability
- Public chain: Settlement events, amounts, fees, and references.
- Private ledger: KYC references, risk scores, transaction metadata, FX and fee breakdowns, payout IDs, banking references, and timestamps.
- Banking: Statements with UTR/ACH/SEPA references mapped to transaction IDs.

### Governance and security
- Key management: HSM or secure vault for operational keys.
- Access control: Least‑privilege roles for treasury and payout operations.
- Change management: Versioned configs and approvals for corridor policies and thresholds.
- Privacy: Minimized PII in public systems; sensitive data handled within private/regulated domains.

### Roadmap alignment
- Solana‑first: Strengthen on‑chain functions and tests, then wire comprehensive bridge endpoints.
- Dual off‑ramp routing: Support local treasury and partner routes with auto selection per corridor and balance.
- Frontend: Real‑time status, fee previews, and downloadable receipts tied to audit records.

### Conclusion
Nivix supports both domestic and cross‑border payouts with a consistent, auditable workflow: KYC verification, on‑chain settlement, intelligent off‑ramp routing, local disbursement, and immutable records. The local treasury route optimizes for speed and cost in domestic corridors, while the partner/off‑ramp route extends reach to any supported market with regulated disbursements, all under a unified compliance and monitoring framework.

- Dual off‑ramp support is built into the operating model.
- Routing decisions are policy‑ and balance‑aware for reliability and efficiency.
- Every transaction remains traceable across blockchains and banking rails end to end.


