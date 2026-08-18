# 💸 M2 — USDC Settlement (next task plan)

**Status:** ⬜ not started · **Prereq:** ✅ M1 done (auth + KYC + Hyperledger)
**Goal:** move real **USDC on Solana**, recorded in a **double-entry ledger**, **gated on approved KYC**.
**Done when:** a KYC-approved user creates a transfer order → USDC actually moves on Solana **devnet** → order is `settled`, the Solana tx is **confirmed**, and the Postgres ledger **balances**.

> Local-first: build on **devnet** now; switching to **mainnet** is a config change (`SOLANA_RPC_URL` + `USDC_MINT`). Custody key is local now; **multisig/HSM** comes in M6.

---

## 0. Pre-task (quick, recommended): durability re-sync job
The safety net we discussed (so a Fabric wipe never loses data):
- In `apps/worker`, add a `resyncKyc` routine: find `KycRecord`s where `fabricTxRef IS NULL` (or Fabric can't return them) → re-enqueue `store-kyc`.
- Run on worker startup + expose a manual trigger (admin endpoint or CLI).
- **Done when:** wiping Fabric then running re-sync rebuilds the ledger from Postgres.
- *Est: ~0.5 day.* (Can also be deferred to M6 hardening.)

---

## Sub-tasks (build in order)

### M2.1 — Solana client + config  *(~0.5 day)*
- Add deps: `@solana/web3.js`, `@solana/spl-token` (to `apps/worker`; `apps/api` only needs reads).
- Config (`.env`): `SOLANA_RPC_URL=https://api.devnet.solana.com`, `USDC_MINT=<devnet USDC mint>`, `CUSTODY_KEYPAIR` (base58/JSON via `SecretsProvider`).
- `apps/worker/src/solana/connection.ts` — a reusable `Connection` + mint/decimals config.
- **Done when:** worker can read SOL/USDC balance of an address on devnet.

### M2.2 — Custody wallet  *(~0.5 day)*
- Load the platform **custody keypair** via the `SecretsProvider` (local: from `.env`/file; prod: vault/HSM).
- Get-or-create the custody **USDC associated token account (ATA)**.
- Fund it for testing: devnet SOL airdrop (gas) + devnet USDC (Circle faucet) **or** create a test SPL "USDC" mint and mint to custody.
- **Done when:** custody wallet holds test USDC on devnet, balance readable.

### M2.3 — Ledger & order data model  *(~1 day)*
- Add Prisma models + migration:
  - `Order` — `userId`, `srcCurrency/srcAmount`, `dstCurrency/dstAmount`, `fee`, `recipient(jsonb)`, `status` enum (`created|settling|settled|failed|refunded`), timestamps.
  - `Transaction` — `orderId`, `leg`('settlement'), `provider`('solana'), `onchainSig`, `amount`, `currency`, `status`('pending|confirmed|failed'), timestamps.
  - `LedgerEntry` — `orderId`, `account`('customer_liability'|'usdc_reserve'|'fees'), `direction`('debit'|'credit'), `amount`, `currency`.
- Double-entry helper: every order's entries must **sum to zero** (debits == credits) — assert it.
- **Done when:** migration applied; a helper writes balanced entries in one DB transaction.

### M2.4 — USDC transfer service (worker)  *(~1 day)*
- `apps/worker/src/solana/transfer.ts` → `transferUsdc(toAddress, amount, memo)`:
  build SPL-token transfer ix + memo ix → sign with custody key → `sendAndConfirmTransaction` → return signature.
- **Idempotency:** never double-send for the same order (check Transaction first).
- **Done when:** a manual call moves USDC custody→test wallet on devnet; signature visible on Solana explorer.

### M2.5 — Order + settlement API  *(~1 day)*
- `apps/api`: `POST /api/v1/orders` (gated by **`requireApprovedKyc`**) → validate (Zod) → create `Order(status=created)` → enqueue a `settlement` job → return order.
- `GET /api/v1/orders/:id`, `GET /api/v1/orders` (user's own).
- **Done when:** a non-KYC user is blocked (403); a KYC'd user gets an order + enqueued job.

### M2.6 — Worker settlement processor  *(~1 day)*
- New `settlements` queue in `apps/worker`: on job → `transferUsdc(...)` → on success write `Transaction(onchainSig)` + balanced `LedgerEntry`s → `Order.status=settled`. Retry w/ backoff; idempotent.
- **Done when:** enqueued order auto-settles end-to-end and the ledger balances.

### M2.7 — Confirmation tracking  *(~0.5 day)*
- Confirm the Solana tx to the chosen commitment; update `Transaction.status=confirmed`. Handle failed/expired → `Order.failed` + alert.
- **Done when:** order only reaches `settled` after on-chain confirmation.

### M2.8 — End-to-end test  *(~0.5 day)*
- register → KYC approve (M1) → `POST /orders` → settlement job → USDC moves on devnet → order `settled`, tx `confirmed`, ledger balanced.
- Verify on Solana explorer (devnet) + DB.

---

## Prerequisites you can line up (optional, before coding)
- A **devnet RPC** (public default is fine; or a Helius/QuickNode devnet key for reliability).
- A **custody keypair** (`solana-keygen new` or `Keypair.generate()`), stored via `SecretsProvider` — never committed.
- Test **USDC on devnet** (Circle faucet) or decide to use a self-made test mint.

## Guardrails (production standards)
- **KYC gate** on every money endpoint (`requireApprovedKyc`).
- **Idempotency** — no double-spend; one settlement per order.
- **Double-entry invariant** — debits == credits, written atomically.
- **No silent failures** — failed settlement → `Order.failed` + audit row + alert.
- **Config-swap to mainnet** — only `SOLANA_RPC_URL` + `USDC_MINT` + custody key change.

## Rough effort
~1 week for a focused build (M2.1→M2.8). M2.0 re-sync is +0.5 day or defer to M6.

## After M2
**M3 — fiat on/off-ramp** (licensed partners): how USDC gets in (on-ramp) and out (off-ramp) — that turns settlement into a real cross-border transfer. See `PRODUCTION_ROADMAP.md`.
