# Nivix System Specifications

## 📋 Table of Contents
1. [High Level System Design](#high-level-system-design)
2. [Data Backup Strategy](#data-backup-strategy)
3. [Frontend Overview](#frontend-overview)
4. [Current Implementation Status](#current-implementation-status)
5. [Required Pages & Components](#required-pages--components)
6. [Component Specifications](#component-specifications)
7. [State Management](#state-management)
8. [UI/UX Requirements](#uiux-requirements)
9. [Integration Requirements](#integration-requirements)
10. [Development Roadmap](#development-roadmap)

---

## 🏛️ High Level System Design

### 1. System Overview

Nivix Protocol is a dual-blockchain cross-border payment platform that combines **Solana** (high-speed payment processing) with **Hyperledger Fabric** (KYC/AML compliance and audit trail). The system follows a non-custodial model — user private keys never leave the client wallet.

### 2. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                      │
│  ┌─────────────────────────────────┐    ┌──────────────────────┐     │
│  │   React Frontend (Port 3000)    │    │   Wallet Providers   │     │
│  │   - Dashboard / Send / Receive  │◄──►│   (Phantom, Solflare │     │
│  │   - KYC / Admin / Swap / History│    │    Torus, Ledger)    │     │
│  │   - MUI + TypeScript            │    └──────────────────────┘     │
│  └────────────────┬────────────────┘                                 │
│                   │ HTTPS (REST API)                                 │
└───────────────────┼──────────────────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                               │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │              Bridge Service (Node.js/Express, Port 3002)      │   │
│  │                                                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐   │   │
│  │  │ Solana   │ │ Anchor   │ │ Fabric   │ │  Transaction   │   │   │
│  │  │ Client   │ │ Client   │ │ Query/   │ │  Bridge        │   │   │
│  │  │          │ │          │ │ Invoke   │ │  (Orchestrator)│   │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬────────┘   │   │
│  │       │             │            │               │            │   │
│  │  ┌────┴─────┐ ┌─────┴────┐ ┌────┴─────┐ ┌──────┴───────┐    │   │
│  │  │ On-Ramp  │ │ Off-Ramp │ │Compliance│ │ Treasury     │    │   │
│  │  │ (Razorpay│ │(RazorpayX│ │(Sanctions│ │ Manager      │    │   │
│  │  │  Orders) │ │ Cashfree │ │ AML,     │ │ (Multi-curr) │    │   │
│  │  │          │ │ PayU)    │ │ Travel)  │ │              │    │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘    │   │
│  └───────────────────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────┬────────────────────────────┘
                    │                     │
┌───────────────────▼──────────┐ ┌────────▼────────────────────────────┐
│     SOLANA BLOCKCHAIN        │ │    HYPERLEDGER FABRIC NETWORK       │
│                              │ │                                      │
│  ┌────────────────────────┐  │ │  ┌────────────────────────────┐     │
│  │  Nivix Anchor Program  │  │ │  │  nivix-kyc Chaincode (Go)  │     │
│  │  (nivix_protocol)      │  │ │  │                            │     │
│  │                        │  │ │  │  - StoreKYC                │     │
│  │  - initialize_platform │  │ │  │  - GetKYCStatus            │     │
│  │  - register_user       │  │ │  │  - UpdateKYCStatus         │     │
│  │  - process_transfer    │  │ │  │  - ValidateTransaction     │     │
│  │  - swap_currencies     │  │ │  │  - RecordTransaction       │     │
│  │  - create_liquidity_pool│ │ │  │  - RecordComplianceEvent   │     │
│  │  - add_liquidity       │  │ │  │                            │     │
│  │  - record_offline_tx   │  │ │  └────────────┬───────────────┘     │
│  └────────────┬───────────┘  │ │               │                     │
│               │              │ │  ┌────────────▼───────────────┐     │
│  ┌────────────▼───────────┐  │ │  │  Private Data Collections  │     │
│  │  SPL Token Program     │  │ │  │  (Full KYC records,        │     │
│  │  (Mints, ATAs, Xfers)  │  │ │  │   compliance events)       │     │
│  └────────────────────────┘  │ │  └────────────────────────────┘     │
│                              │ │                                      │
│  Program ID:                 │ │  Channel: mychannel                  │
│  FavSaLCcw6qgpLob47uGPoN... │ │  Consensus: Raft                    │
│  Network: Devnet             │ │  Orgs: Org1, Org2                   │
└──────────────────────────────┘ └──────────────────────────────────────┘
                    │                     │
┌───────────────────▼─────────────────────▼────────────────────────────┐
│                   EXTERNAL SERVICES LAYER                            │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │
│  │  Razorpay    │ │  RazorpayX   │ │  Cashfree    │ │   PayU     │  │
│  │  (On-Ramp    │ │  (Off-Ramp   │ │  (Off-Ramp   │ │  (Off-Ramp │  │
│  │   Payments)  │ │   Payouts)   │ │   Payouts)   │ │   Payouts) │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘  │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │
│  │  CoinGecko   │ │  Fixer.io    │ │  Solana RPC  │                  │
│  │  (Crypto     │ │  (Fiat FX    │ │  (Devnet /   │                  │
│  │   Prices)    │ │   Rates)     │ │   Mainnet)   │                  │
│  └──────────────┘ └──────────────┘ └──────────────┘                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 3. Core Transaction Flow (End-to-End)

```
User Wallet                Frontend           Bridge Service         Solana           Fabric
    │                         │                     │                  │                │
    │  1. Connect Wallet      │                     │                  │                │
    │◄───────────────────────►│                     │                  │                │
    │                         │                     │                  │                │
    │  2. Initiate Transfer   │                     │                  │                │
    │  (amount, recipient,    │ 3. POST             │                  │                │
    │   currencies)           │ /build-transfer     │                  │                │
    │                         │────────────────────►│                  │                │
    │                         │                     │ 4. Verify KYC    │                │
    │                         │                     │─────────────────────────────────►│
    │                         │                     │◄─────────────────────────────────│
    │                         │                     │                  │                │
    │                         │                     │ 5. Compliance    │                │
    │                         │                     │    Check         │                │
    │                         │                     │ (sanctions,      │                │
    │                         │                     │  travel rule)    │                │
    │                         │                     │                  │                │
    │                         │                     │ 6. Build         │                │
    │                         │                     │    Unsigned Tx   │                │
    │                         │                     │─────────────────►│                │
    │                         │                     │◄─────────────────│                │
    │                         │◄────────────────────│                  │                │
    │                         │  7. Return unsigned  │                  │                │
    │                         │     transaction      │                  │                │
    │                         │                     │                  │                │
    │  8. Sign Transaction    │                     │                  │                │
    │  (Wallet popup)         │                     │                  │                │
    │────────────────────────►│                     │                  │                │
    │                         │ 9. POST             │                  │                │
    │                         │ /submit-signed      │                  │                │
    │                         │────────────────────►│                  │                │
    │                         │                     │ 10. Submit to    │                │
    │                         │                     │     Solana       │                │
    │                         │                     │─────────────────►│                │
    │                         │                     │◄─────────────────│                │
    │                         │                     │ 11. Record Audit │                │
    │                         │                     │─────────────────────────────────►│
    │                         │                     │◄─────────────────────────────────│
    │                         │◄────────────────────│                  │                │
    │                         │  12. Return signature│                  │                │
    │◄────────────────────────│                     │                  │                │
    │  13. Confirmation       │                     │                  │                │
```

### 4. Component Responsibilities

| Component | Responsibility | Technology | State Management |
|-----------|---------------|------------|-----------------|
| **Frontend** | User interface, wallet connection, transaction signing | React 18, TypeScript, MUI 5.15, Solana Wallet Adapter | React Context API |
| **Bridge Service** | API gateway, cross-chain orchestration, payment routing | Node.js, Express.js | In-memory + JSON file persistence |
| **Solana Program** | Token transfers, liquidity pools, swaps, fee collection | Anchor/Rust on Solana Devnet | On-chain accounts (PDAs) |
| **Fabric Network** | KYC storage, compliance validation, audit trail | Go chaincode on Hyperledger Fabric | World state + private data collections |
| **On-Ramp Module** | Fiat-to-crypto conversion via payment gateway | Razorpay integration | Order tracking (JSON) |
| **Off-Ramp Module** | Crypto-to-fiat payout via banking rails | RazorpayX, Cashfree, PayU | Transaction lifecycle (JSON) |
| **Treasury Manager** | Multi-currency liquidity management, corridor routing | Bridge-internal module | Config-based (JSON) |
| **Compliance Module** | Sanctions screening, AML checks, travel rule | Bridge-internal module | Fabric-backed |

### 5. Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      DATA FLOW MAP                           │
│                                                              │
│  USER DATA                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐    │
│  │ Wallet   │───►│ Frontend │───►│ Bridge Service       │    │
│  │ (Keys)   │    │ (State)  │    │                      │    │
│  └──────────┘    └──────────┘    │  Routes to:          │    │
│                                  │  ├─► Solana (value)   │    │
│  FINANCIAL DATA                  │  ├─► Fabric (identity)│    │
│  ┌──────────┐                    │  ├─► PSPs (fiat)      │    │
│  │ Exchange │───────────────────►│  └─► Treasury (liqui.)│    │
│  │ Rates    │  (CoinGecko/Fixer) │                      │    │
│  └──────────┘                    └──────────────────────┘    │
│                                                              │
│  COMPLIANCE DATA                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ KYC Docs │───►│ Bridge       │───►│ Fabric Private   │   │
│  │ (User)   │    │ (Validation) │    │ Data Collections │   │
│  └──────────┘    └──────────────┘    └──────────────────┘   │
│                                                              │
│  TRANSACTION DATA                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Solana Blockchain (immutable ledger)                  │   │
│  │  └─ Accounts: Platform, User, Wallet, LiquidityPool  │   │
│  │  └─ Records: TransactionRecord, SwapRecord            │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Fabric Ledger (permissioned, auditable)               │   │
│  │  └─ KYCRecord, ComplianceEvent, TransactionAudit      │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Bridge File Store (operational cache)                  │   │
│  │  └─ transactions.json, mint-accounts.json,             │   │
│  │     pools-cache.json, onramp-orders.json               │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 6. Network Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT TOPOLOGY                            │
│                                                                   │
│  ┌─────────────────┐                                             │
│  │  NGINX (Port 80) │◄── Static React build                      │
│  │  /var/www/nivix   │                                            │
│  └────────┬─────────┘                                            │
│           │ proxy_pass                                            │
│  ┌────────▼─────────┐                                            │
│  │  Bridge Service   │                                            │
│  │  (Port 3002)      │                                            │
│  │  PM2 / systemd    │                                            │
│  └──┬──────┬────┬────┘                                           │
│     │      │    │                                                 │
│     │      │    └────────────► Solana RPC (Devnet/Mainnet)        │
│     │      │                                                      │
│     │      └─────────► Docker Network                             │
│     │                  ┌──────────────────────────────────┐       │
│     │                  │  Hyperledger Fabric               │       │
│     │                  │  ├─ Peer0.Org1 (Port 7051)       │       │
│     │                  │  ├─ Peer0.Org2 (Port 9051)       │       │
│     │                  │  ├─ Orderer    (Port 7050)       │       │
│     │                  │  ├─ CA.Org1    (Port 7054)       │       │
│     │                  │  └─ CA.Org2    (Port 8054)       │       │
│     │                  └──────────────────────────────────┘       │
│     │                                                             │
│     └──────────────────► Payment Service Providers                │
│                          (Razorpay, Cashfree, PayU)               │
└───────────────────────────────────────────────────────────────────┘
```

### 7. Security Architecture

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **Client** | Non-custodial wallet signing | Bridge never holds user private keys; transactions are signed client-side |
| **Transport** | HTTPS / TLS | All API communication encrypted in transit |
| **API** | Wallet-based auth headers | `Authorization: Wallet <public_key>` on every request |
| **Bridge** | CORS + rate limiting | Origin-restricted, request throttling |
| **Solana** | PDA-based access control | Program-derived addresses enforce ownership; fee validation on-chain |
| **Fabric** | MSP + Private Data Collections | Organization-level access; KYC stored in private collections |
| **Compliance** | Sanctions + AML + Travel Rule | Pre-transfer screening via compliance module |
| **Secrets** | Environment-based config | No keys in code; `.env` files, restricted file permissions |

### 8. Scalability Considerations

| Concern | Approach |
|---------|----------|
| **Transaction throughput** | Solana processes 65,000+ TPS; bridge is stateless and horizontally scalable behind a load balancer |
| **KYC query latency** | Fabric queries cached at bridge layer; degraded-mode operation if Fabric is unreachable |
| **Exchange rate freshness** | WebSocket feeds from CoinGecko/Fixer.io; local cache with configurable TTL |
| **File-based storage migration** | Production template includes PostgreSQL + Redis configs; migration path from JSON files to database is planned |
| **Frontend performance** | Code splitting, lazy loading, skeleton loaders; PWA support for offline access |

---

## 🗄️ Data Backup Strategy

### 1. Overview

The Nivix platform manages financial, identity, and transactional data across multiple storage layers. A comprehensive backup strategy is critical to ensure data integrity, regulatory compliance, business continuity, and disaster recovery.

### 2. Data Classification

| Data Category | Storage Location | Sensitivity | Retention Policy |
|--------------|-----------------|-------------|-----------------|
| **Solana On-Chain Data** | Solana blockchain (Devnet/Mainnet) | Medium | Permanent (immutable ledger) |
| **Fabric Ledger Data** | Hyperledger Fabric world state + block store | High | Permanent (immutable ledger) |
| **Fabric Private Data** | Private data collections (KYC records) | Critical | Per-collection TTL + indefinite for active users |
| **Bridge Transaction Records** | `bridge-service/data/transactions/transactions.json` | High | 7 years (financial regulation) |
| **Mint & Pool Cache** | `bridge-service/data/mint-accounts.json`, `pools-cache.json` | Medium | Reconstructable from chain; back up weekly |
| **On-Ramp Orders** | `bridge-service/src/data/onramp-orders.json` | High | 7 years |
| **KYC Submission Logs** | `bridge-service/kyc-submissions.log` | Critical | 7 years (AML/KYC regulation) |
| **Wallet Keypairs** | `bridge-service/wallet/bridge-wallet.json`, `data/treasury-keypair.json` | Critical | Backed up to encrypted cold storage; never expires |
| **Configuration** | `data/treasury-config.json`, `data/fee-config.json`, `.env` files | High | Version-controlled + encrypted backup |
| **Fabric Crypto Material** | Peer/orderer certs, CA keys | Critical | Backed up to HSM or encrypted vault |

### 3. Backup Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                       BACKUP ARCHITECTURE                            │
│                                                                      │
│  ┌─────────────────┐         ┌──────────────────────────────────┐   │
│  │  REAL-TIME       │         │  SCHEDULED BACKUPS               │   │
│  │  REPLICATION     │         │                                  │   │
│  │                  │         │  Daily:                          │   │
│  │  Solana ──────►  │         │  ├─ Bridge data/ directory       │   │
│  │  (Immutable,     │         │  ├─ KYC submission logs          │   │
│  │   self-backed)   │         │  ├─ On-ramp order records        │   │
│  │                  │         │  └─ Fabric channel snapshots     │   │
│  │  Fabric ──────►  │         │                                  │   │
│  │  (Block store    │         │  Weekly:                         │   │
│  │   replicated     │         │  ├─ Full Fabric ledger export    │   │
│  │   across peers)  │         │  ├─ Mint/pool cache snapshot     │   │
│  │                  │         │  └─ Configuration audit           │   │
│  └─────────────────┘         │                                  │   │
│                               │  Monthly:                        │   │
│  ┌─────────────────┐         │  ├─ Full system state archive     │   │
│  │  ENCRYPTED       │         │  ├─ Disaster recovery test       │   │
│  │  COLD STORAGE    │         │  └─ Key rotation verification    │   │
│  │                  │         │                                  │   │
│  │  ├─ Wallet keys  │         └──────────────────────────────────┘   │
│  │  ├─ Treasury keys│                                                │
│  │  ├─ Fabric CA    │         ┌──────────────────────────────────┐   │
│  │  │  credentials  │         │  BACKUP DESTINATIONS             │   │
│  │  └─ Master seeds │         │                                  │   │
│  │                  │         │  Primary:   Encrypted cloud       │   │
│  │  Stored in:      │         │             storage (S3/GCS)     │   │
│  │  - HSM           │         │  Secondary: Geo-separated         │   │
│  │  - Encrypted USB │         │             cold storage         │   │
│  │  - Vault (prod)  │         │  Tertiary:  Offline archive      │   │
│  └─────────────────┘         │             (quarterly)           │   │
│                               └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 4. Backup Procedures by Component

#### 4.1 Solana Blockchain Data
- **Nature**: Immutable on-chain data. Solana validators maintain full ledger copies.
- **Strategy**: No manual backup needed for on-chain state. The Solana network inherently replicates data across validators.
- **Recommendation**: Maintain a mapping of all Program Derived Addresses (PDAs) and account keys used by Nivix in a versioned registry file. Back up `Anchor.toml`, IDL files, and the deployed program binary for redeployment capability.

#### 4.2 Hyperledger Fabric Ledger
- **Block Store Backup**: Fabric peers store blocks in `/var/hyperledger/production/`. Snapshot peer volumes daily.
- **World State (CouchDB/LevelDB)**: Export world state snapshots using `peer snapshot` command or direct database backup.
- **Private Data Collections**: These have a purge lifecycle. Back up before purge cycles execute. Use Fabric's `peer lifecycle chaincode` tools to export collection configs.
- **Crypto Material**: All MSP directories, TLS certificates, and CA keys must be backed up to encrypted storage. Loss of these means loss of network identity.

```bash
# Fabric ledger snapshot (run on each peer)
docker exec peer0.org1.example.com peer snapshot submitrequest \
  -c mychannel -b 0
  
# Back up peer data volumes
docker cp peer0.org1.example.com:/var/hyperledger/production/ \
  /backup/fabric/peer0-org1-$(date +%Y%m%d)/

# Back up crypto material
tar -czf /backup/fabric/crypto-$(date +%Y%m%d).tar.gz \
  fabric-samples/test-network/organizations/
```

#### 4.3 Bridge Service File-Based Data
- **Transaction Records** (`data/transactions/transactions.json`): Incremental backup every 6 hours, full backup daily. These contain all cross-chain transaction history.
- **Mint Accounts** (`data/mint-accounts.json`): Weekly backup. Reconstructable from on-chain state but backup saves recovery time.
- **Pool Cache** (`data/pools-cache.json`): Weekly backup. Operational convenience; regenerable.
- **On-Ramp Orders** (`src/data/onramp-orders.json`): Daily backup. Financial records with regulatory retention requirements.
- **KYC Logs** (`kyc-submissions.log`): Daily backup with append-only archiving. Regulatory requirement.

```bash
#!/bin/bash
# bridge-backup.sh — Run via cron every 6 hours
BACKUP_DIR="/backup/bridge/$(date +%Y%m%d_%H%M)"
mkdir -p "$BACKUP_DIR"

cp -r bridge-service/data/ "$BACKUP_DIR/data/"
cp bridge-service/kyc-submissions.log "$BACKUP_DIR/"
cp bridge-service/src/data/onramp-orders.json "$BACKUP_DIR/"

# Encrypt and upload to cloud storage
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
gpg --encrypt --recipient backup@nivix.protocol "$BACKUP_DIR.tar.gz"
# Upload encrypted archive to S3/GCS
```

#### 4.4 Wallet Keypairs and Secrets
- **Bridge Wallet** (`bridge-service/wallet/bridge-wallet.json`): This is the mint authority and operational keypair. Loss means loss of minting capability.
- **Treasury Keypair** (`data/treasury-keypair.json`): Controls treasury funds.
- **Strategy**: 
  - Encrypt with AES-256 before storing anywhere
  - Primary: Hardware Security Module (HSM) in production
  - Secondary: Encrypted offline storage (USB/air-gapped machine)
  - Tertiary: Paper backup of seed phrase in secure physical vault
  - Never store unencrypted keypairs in cloud storage or version control

#### 4.5 Configuration Files
- **Fee Config, Treasury Config**: Version-controlled in git. Additionally backed up with each scheduled backup cycle.
- **Environment Files** (`.env`): Contain API keys for Razorpay, Cashfree, PayU, and RPC endpoints. Backed up to encrypted secret manager (HashiCorp Vault or AWS Secrets Manager in production).

### 5. Recovery Procedures

| Failure Scenario | Recovery Time Objective (RTO) | Recovery Point Objective (RPO) | Procedure |
|-----------------|------|------|-----------|
| **Bridge service crash** | < 15 min | 6 hours (last backup) | Restart service; data files persist on disk |
| **Bridge data corruption** | < 1 hour | 6 hours | Restore from latest encrypted backup; replay any missing txs from Solana/Fabric |
| **Fabric peer failure** | < 2 hours | Near-zero (replicated) | Bring up new peer; it syncs from orderer and other peers |
| **Fabric complete network loss** | < 4 hours | Last snapshot | Restore crypto material → restore block store → restart network |
| **Wallet keypair loss** | < 30 min | N/A (static data) | Restore from HSM / encrypted cold storage |
| **Full system disaster** | < 8 hours | 24 hours | Restore infra → Fabric network → deploy Solana program → restore bridge data → verify |

### 6. Backup Validation and Testing

| Test | Frequency | Procedure |
|------|-----------|-----------|
| **Backup integrity check** | Weekly | Verify checksums of all backup archives |
| **Restore drill (Bridge data)** | Monthly | Restore bridge data files to a staging environment; verify transaction records are intact |
| **Restore drill (Fabric)** | Quarterly | Stand up a fresh Fabric network from backup; verify KYC queries return expected data |
| **Full disaster recovery test** | Bi-annually | Complete system restoration from backups on a clean environment; run end-to-end smoke tests |
| **Key recovery test** | Quarterly | Verify wallet keypairs can be decrypted and used to sign a test transaction on devnet |

### 7. Production Database Migration Path

The current system uses file-based JSON storage. For production, the backup strategy evolves with database adoption:

| Current (File-Based) | Production Target | Backup Method |
|----------------------|-------------------|---------------|
| `transactions.json` | PostgreSQL `transactions` table | pg_dump daily + WAL archiving for point-in-time recovery |
| `mint-accounts.json` | PostgreSQL `mint_accounts` table | Included in pg_dump |
| `onramp-orders.json` | PostgreSQL `onramp_orders` table | Included in pg_dump |
| `pools-cache.json` | Redis cache + PostgreSQL fallback | Redis RDB snapshots hourly; PostgreSQL as source of truth |
| `kyc-submissions.log` | PostgreSQL `kyc_audit_log` table | pg_dump + archived to immutable storage |

```
Production Backup Stack:
├── PostgreSQL
│   ├── Continuous WAL archiving (point-in-time recovery)
│   ├── Daily pg_dump to encrypted S3
│   ├── Cross-region replication (standby)
│   └── 30-day retention for daily backups, 1-year for monthly
├── Redis
│   ├── RDB snapshots every hour
│   ├── AOF persistence enabled
│   └── Redis Sentinel for automatic failover
├── Fabric
│   ├── Peer volume snapshots daily
│   ├── Crypto material in HashiCorp Vault
│   └── Block store archived weekly
└── Secrets
    ├── HashiCorp Vault (production)
    ├── Encrypted cold storage (DR)
    └── HSM for signing keys
```

### 8. Monitoring and Alerts

| Monitor | Alert Condition | Action |
|---------|----------------|--------|
| Backup job completion | Job fails or runs > 2x expected duration | Page on-call; investigate immediately |
| Backup file size | Size drops > 50% from previous run (indicates data loss) | Halt automated restore; manual investigation |
| Disk space on backup storage | < 20% remaining | Expand storage; prune oldest archives beyond retention |
| Fabric peer sync status | Peer falls > 100 blocks behind | Investigate network connectivity; consider re-sync |
| Bridge data file integrity | Checksum mismatch on startup | Alert ops team; compare with last known good backup |

---

## 🎯 Frontend Overview

The Nivix frontend is a **React + TypeScript** application that provides a modern, secure, and user-friendly interface for cross-border payments using dual blockchain technology (Solana + Hyperledger Fabric).

### Key Technologies
- **React 18.2.0** with TypeScript
- **Material-UI (MUI) 5.15.0** for components
- **Solana Wallet Adapter** for wallet integration
- **React Router DOM** for navigation
- **Styled Components** for custom styling
- **Axios** for API calls

---

## 📊 Current Implementation Status

### ✅ **Already Implemented**
- Basic project structure with TypeScript
- Wallet integration (Phantom, Solflare, Torus)
- Dark theme with custom branding
- Basic routing setup
- 6 core pages (Dashboard, Send, Receive, Profile, KYC, KYCAdmin)
- Header and Footer components
- Mock API service with sample data

### 🔄 **Partially Implemented**
- Dashboard page (basic layout, needs enhancement)
- Send page (form structure, needs real API integration)
- KYC pages (forms exist, need better validation)
- API service (mock data, needs real endpoint integration)

### ❌ **Missing/Needs Development**
- Advanced transaction management
- Real-time exchange rates
- Liquidity pool interface
- Admin dashboard features
- Offline transaction support
- Enhanced security features
- Comprehensive error handling
- Real API integration

---

## 📱 Required Pages & Components

### **Core Pages**

#### 1. **Landing/Welcome Page** ⭐ *NEW*
**Purpose**: Introduction page for new users
**Route**: `/welcome` or `/`
**Features**:
- Hero section explaining Nivix benefits
- Feature showcase (Fast payments, Multi-currency, KYC compliance)
- Getting started guide
- Connect wallet prompt
- Live stats (total transactions, supported currencies)

#### 2. **Dashboard Page** 🔄 *ENHANCE EXISTING*
**Purpose**: Main user dashboard after wallet connection
**Route**: `/dashboard`
**Current**: Basic layout exists
**Enhancements Needed**:
- **Portfolio Overview**:
  - Total balance in USD
  - Balance breakdown by currency
  - 24h change indicators
  - Quick action buttons (Send, Receive, Swap)
  
- **Recent Transactions**:
  - Last 10 transactions with status
  - Filter by type (sent/received/pending)
  - Transaction details modal
  
- **KYC Status Card**:
  - Verification level indicator
  - Transaction limits display
  - Upgrade prompts
  
- **Market Data**:
  - Live exchange rates
  - Currency trends
  - Market alerts

#### 3. **Send Money Page** 🔄 *ENHANCE EXISTING*
**Purpose**: Transfer money to other users
**Route**: `/send`
**Current**: Basic form exists
**Enhancements Needed**:
- **Step-by-step wizard**:
  - Step 1: Select source wallet/currency
  - Step 2: Enter recipient details
  - Step 3: Set amount and destination currency
  - Step 4: Review and confirm
  
- **Advanced Features**:
  - Address book for frequent recipients
  - QR code scanner for recipient address
  - Real-time exchange rate calculator
  - Fee estimation and breakdown
  - Transaction preview with all details
  - Scheduled payments (future feature)

#### 4. **Receive Money Page** 🔄 *ENHANCE EXISTING*
**Purpose**: Generate payment requests and QR codes
**Route**: `/receive`
**Current**: Basic implementation
**Enhancements Needed**:
- **QR Code Generation**:
  - Dynamic QR codes for different currencies
  - Amount specification
  - Expiring payment links
  
- **Payment Requests**:
  - Send payment requests via email/SMS
  - Request tracking
  - Partial payment acceptance
  
- **Share Options**:
  - Social media sharing
  - Copy payment link
  - WhatsApp/Telegram integration

#### 5. **Transaction History Page** ⭐ *NEW*
**Purpose**: Comprehensive transaction management
**Route**: `/transactions`
**Features**:
- **Advanced Filtering**:
  - Date range picker
  - Currency filter
  - Transaction type filter
  - Amount range filter
  
- **Transaction Details**:
  - Full transaction information
  - Blockchain explorer links
  - Receipt generation/download
  - Transaction status tracking
  
- **Export Options**:
  - CSV export for accounting
  - PDF statements
  - Tax reporting data

#### 6. **Swap/Exchange Page** ⭐ *NEW*
**Purpose**: Currency exchange using liquidity pools
**Route**: `/swap`
**Features**:
- **Swap Interface**:
  - Currency pair selection
  - Amount input with balance display
  - Real-time price calculation
  - Slippage tolerance settings
  - Price impact warnings
  
- **Liquidity Pools**:
  - Available pools display
  - Pool statistics (TVL, APY)
  - Add/remove liquidity options
  
- **Advanced Trading**:
  - Limit orders (future)
  - Price alerts
  - Trading history

#### 7. **KYC Verification Page** 🔄 *ENHANCE EXISTING*
**Purpose**: Identity verification process
**Route**: `/kyc`
**Current**: Basic form exists
**Enhancements Needed**:
- **Multi-step Process**:
  - Personal information
  - Document upload (ID, proof of address)
  - Selfie verification
  - Review and submit
  
- **Document Management**:
  - Drag-and-drop file upload
  - Image preview and cropping
  - Format validation
  - Progress tracking
  
- **Status Tracking**:
  - Verification progress
  - Rejection reasons
  - Re-submission process

#### 8. **Profile/Settings Page** 🔄 *ENHANCE EXISTING*
**Purpose**: User account management
**Route**: `/profile`
**Current**: Basic layout
**Enhancements Needed**:
- **Account Information**:
  - Personal details
  - Contact information
  - Verification status
  
- **Security Settings**:
  - Two-factor authentication
  - Login history
  - Device management
  
- **Preferences**:
  - Notification settings
  - Language selection
  - Currency preferences
  - Theme settings

#### 9. **Admin Dashboard** 🔄 *ENHANCE EXISTING*
**Purpose**: Administrative functions for platform operators
**Route**: `/admin`
**Current**: Basic KYC admin exists
**Enhancements Needed**:
- **User Management**:
  - User list with search/filter
  - KYC approval/rejection
  - Account suspension
  - Transaction limits management
  
- **Platform Analytics**:
  - Transaction volume charts
  - User growth metrics
  - Revenue analytics
  - System health monitoring
  
- **Liquidity Management**:
  - Pool monitoring
  - Rebalancing tools
  - Fee adjustment
  
- **Compliance**:
  - AML monitoring
  - Suspicious activity alerts
  - Reporting tools

#### 10. **Offline Transactions Page** ⭐ *NEW*
**Purpose**: Manage offline/Bluetooth transactions
**Route**: `/offline`
**Features**:
- **Offline Payment Creation**:
  - Generate offline transaction codes
  - Bluetooth payment initiation
  - NFC payment support (future)
  
- **Sync Management**:
  - Pending offline transactions
  - Sync status
  - Conflict resolution
  
- **Device Management**:
  - Paired devices
  - Trust settings
  - Security controls

---

## 🔧 Component Specifications

### **Core Components**

#### 1. **Wallet Connection Components**
```typescript
// WalletButton.tsx
interface WalletButtonProps {
  variant?: 'connect' | 'compact' | 'full';
  showBalance?: boolean;
  showNetwork?: boolean;
}

// WalletSelector.tsx
interface WalletSelectorProps {
  onWalletChange: (wallet: string) => void;
  selectedWallet: string;
  wallets: WalletData[];
}
```

#### 2. **Transaction Components**
```typescript
// TransactionCard.tsx
interface TransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
  showDetails?: boolean;
}

// TransactionList.tsx
interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  onLoadMore?: () => void;
  filters?: TransactionFilters;
}

// TransactionModal.tsx
interface TransactionModalProps {
  transaction: Transaction;
  open: boolean;
  onClose: () => void;
}
```

#### 3. **Currency Components**
```typescript
// CurrencySelector.tsx
interface CurrencySelectorProps {
  currencies: Currency[];
  selected: string;
  onSelect: (currency: string) => void;
  showBalance?: boolean;
}

// ExchangeRateDisplay.tsx
interface ExchangeRateDisplayProps {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  loading?: boolean;
}

// BalanceCard.tsx
interface BalanceCardProps {
  currency: string;
  balance: number;
  usdValue: number;
  change24h?: number;
  onClick?: () => void;
}
```

#### 4. **KYC Components**
```typescript
// KYCStatusBadge.tsx
interface KYCStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'not_started';
  onClick?: () => void;
}

// DocumentUpload.tsx
interface DocumentUploadProps {
  documentType: string;
  onUpload: (file: File) => void;
  maxSize?: number;
  acceptedFormats?: string[];
}

// VerificationStepper.tsx
interface VerificationStepperProps {
  currentStep: number;
  steps: VerificationStep[];
  onStepClick?: (step: number) => void;
}
```

#### 5. **Payment Components**
```typescript
// PaymentForm.tsx
interface PaymentFormProps {
  onSubmit: (data: PaymentData) => void;
  loading?: boolean;
  wallets: WalletData[];
}

// QRCodeGenerator.tsx
interface QRCodeGeneratorProps {
  data: string;
  size?: number;
  logo?: string;
  downloadable?: boolean;
}

// AmountInput.tsx
interface AmountInputProps {
  value: string;
  currency: string;
  onChange: (value: string) => void;
  max?: number;
  showUSD?: boolean;
}
```

### **Utility Components**

#### 1. **Loading & Error States**
```typescript
// LoadingSpinner.tsx
// ErrorBoundary.tsx
// EmptyState.tsx
// SkeletonLoader.tsx
```

#### 2. **Notification Components**
```typescript
// NotificationBar.tsx
// AlertDialog.tsx
// ConfirmationModal.tsx
// SuccessToast.tsx
```

#### 3. **Chart Components**
```typescript
// BalanceChart.tsx
// TransactionChart.tsx
// ExchangeRateChart.tsx
```

---

## 🏗️ State Management

### **Context Providers**

#### 1. **AuthContext**
```typescript
interface AuthContextType {
  user: User | null;
  wallet: WalletData | null;
  isConnected: boolean;
  kycStatus: KYCStatus;
  login: () => Promise<void>;
  logout: () => void;
  refreshKYC: () => Promise<void>;
}
```

#### 2. **TransactionContext**
```typescript
interface TransactionContextType {
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  loading: boolean;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  sendTransaction: (data: TransactionData) => Promise<TransactionResult>;
  refreshTransactions: () => Promise<void>;
}
```

#### 3. **WalletContext**
```typescript
interface WalletContextType {
  wallets: WalletData[];
  selectedWallet: string;
  balances: Record<string, number>;
  exchangeRates: Record<string, number>;
  loading: boolean;
  selectWallet: (walletId: string) => void;
  refreshBalances: () => Promise<void>;
  refreshRates: () => Promise<void>;
}
```

#### 4. **NotificationContext**
```typescript
interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: NotificationData) => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}
```

### **Custom Hooks**

```typescript
// useWallet.ts - Enhanced wallet management
// useTransactions.ts - Transaction operations
// useKYC.ts - KYC status and operations
// useExchangeRates.ts - Real-time rate updates
// useLocalStorage.ts - Persistent storage
// useDebounce.ts - Input debouncing
// useAsync.ts - Async operation management
```

---

## 🎨 UI/UX Requirements

### **Design System**

#### 1. **Color Palette**
```typescript
const theme = {
  palette: {
    primary: {
      main: '#5D5FEF',      // Nivix Purple
      light: '#8B8DFF',
      dark: '#3F41B3',
    },
    secondary: {
      main: '#45B26B',      // Success Green
      light: '#7BC49A',
      dark: '#2E8F47',
    },
    background: {
      default: '#17171A',   // Dark Background
      paper: '#1E1E22',     // Card Background
      surface: '#2A2A2E',   // Input Background
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
      disabled: '#6B6B6B',
    },
    error: {
      main: '#FF5252',
      light: '#FF8A80',
      dark: '#D32F2F',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    success: {
      main: '#45B26B',
      light: '#7BC49A',
      dark: '#2E8F47',
    }
  }
};
```

#### 2. **Typography**
```typescript
const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontSize: '2.5rem', fontWeight: 700 },
  h2: { fontSize: '2rem', fontWeight: 600 },
  h3: { fontSize: '1.75rem', fontWeight: 600 },
  h4: { fontSize: '1.5rem', fontWeight: 500 },
  h5: { fontSize: '1.25rem', fontWeight: 500 },
  h6: { fontSize: '1rem', fontWeight: 500 },
  body1: { fontSize: '1rem', fontWeight: 400 },
  body2: { fontSize: '0.875rem', fontWeight: 400 },
  caption: { fontSize: '0.75rem', fontWeight: 400 },
};
```

#### 3. **Spacing & Layout**
```typescript
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

const breakpoints = {
  xs: '0px',
  sm: '600px',
  md: '960px',
  lg: '1280px',
  xl: '1920px',
};
```

### **Component Standards**

#### 1. **Buttons**
- Primary: Nivix purple with white text
- Secondary: Outlined with purple border
- Text: No background, purple text
- Disabled: Gray with reduced opacity
- Loading: Spinner inside button

#### 2. **Forms**
- Dark input backgrounds with white text
- Purple focus borders
- Clear error states with red text
- Helper text below inputs
- Required field indicators

#### 3. **Cards**
- Dark paper background
- Subtle elevation/shadow
- Rounded corners (8px)
- Consistent padding (16px)
- Optional hover effects

#### 4. **Navigation**
- Fixed header with wallet connection
- Sidebar navigation for desktop
- Bottom navigation for mobile
- Clear active state indicators

### **Responsive Design**

#### 1. **Mobile First Approach**
- Start with mobile layout
- Progressive enhancement for larger screens
- Touch-friendly interface elements
- Swipe gestures for navigation

#### 2. **Breakpoint Strategy**
- Mobile: < 600px (single column, bottom nav)
- Tablet: 600px - 960px (two columns, sidebar)
- Desktop: > 960px (multi-column, full sidebar)

#### 3. **Key Mobile Optimizations**
- Large touch targets (44px minimum)
- Thumb-friendly navigation
- Minimal input requirements
- One-handed operation support

---

## 🔗 Integration Requirements

### **API Integration**

#### 1. **Bridge Service APIs**
```typescript
// Transaction APIs
POST /api/bridge/initiate-transfer
GET  /api/bridge/transaction-status/:id
GET  /api/bridge/wallet-transactions/:address

// KYC APIs
POST /api/kyc/store
GET  /api/kyc/status/:address
POST /api/kyc/update

// Solana APIs
GET  /api/solana/balance/:address
POST /api/solana/transfer
GET  /api/solana/token-balance/:address/:mint
```

#### 2. **Real-time Updates**
```typescript
// WebSocket connections for:
// - Transaction status updates
// - Exchange rate changes
// - Balance updates
// - System notifications

const useWebSocket = (endpoint: string) => {
  // WebSocket hook implementation
};
```

#### 3. **Error Handling**
```typescript
// Standardized error handling
interface APIError {
  code: string;
  message: string;
  details?: any;
}

// Retry logic for failed requests
// Offline support with request queuing
// User-friendly error messages
```

### **Blockchain Integration**

#### 1. **Solana Wallet Adapter**
```typescript
// Enhanced wallet connection
const walletConfig = {
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
    new SolletWalletAdapter(),
  ],
  autoConnect: true,
  onError: (error) => handleWalletError(error),
};
```

#### 2. **Transaction Signing**
```typescript
// Smart contract interaction
const useAnchorProgram = () => {
  // Anchor program integration
  // Transaction signing
  // Error handling
};
```

### **External Services**

#### 1. **Exchange Rate APIs**
- CoinGecko API for crypto prices
- Fixer.io for fiat exchange rates
- Real-time WebSocket feeds

#### 2. **File Upload Services**
- AWS S3 or similar for KYC documents
- Image compression and optimization
- Secure document handling

#### 3. **Notification Services**
- Push notifications for mobile
- Email notifications
- SMS alerts for critical actions

---

## 🚀 Development Roadmap

### **Phase 1: Core Enhancement (2-3 weeks)**
1. **Week 1:**
   - Enhance Dashboard with real data
   - Improve Send page with wizard flow
   - Implement real API integration
   - Add error boundaries and loading states

2. **Week 2:**
   - Build Transaction History page
   - Enhance KYC flow with file upload
   - Add real-time exchange rates
   - Implement proper state management

3. **Week 3:**
   - Create Swap/Exchange page
   - Add notification system
   - Mobile responsiveness improvements
   - Testing and bug fixes

### **Phase 2: Advanced Features (2-3 weeks)**
1. **Week 4:**
   - Admin dashboard enhancement
   - Advanced transaction filtering
   - Chart and analytics integration
   - Performance optimizations

2. **Week 5:**
   - Offline transaction support
   - WebSocket real-time updates
   - Enhanced security features
   - Progressive Web App features

3. **Week 6:**
   - Final testing and debugging
   - Documentation completion
   - Performance optimization
   - Production deployment preparation

### **Phase 3: Future Enhancements**
- Advanced trading features
- Social payment features
- Multi-language support
- Advanced analytics
- Mobile app development

---

## 📝 Implementation Checklist

### **Immediate Tasks**
- [ ] Set up proper TypeScript interfaces
- [ ] Implement Context providers
- [ ] Create reusable component library
- [ ] Set up real API integration
- [ ] Add proper error handling
- [ ] Implement loading states

### **Core Features**
- [ ] Enhanced Dashboard
- [ ] Improved Send flow
- [ ] Transaction History page
- [ ] Currency Swap interface
- [ ] Real-time data updates
- [ ] Mobile optimization

### **Advanced Features**
- [ ] Admin dashboard
- [ ] Offline transactions
- [ ] Advanced KYC flow
- [ ] Notification system
- [ ] Analytics and charts
- [ ] PWA capabilities

### **Testing & Deployment**
- [ ] Unit tests for components
- [ ] Integration tests
- [ ] E2E testing
- [ ] Performance testing
- [ ] Security audit
- [ ] Production deployment

---

## 🔐 Security Considerations

### **Frontend Security**
1. **Input Validation**
   - Sanitize all user inputs
   - Validate Solana addresses
   - Amount validation and limits

2. **State Protection**
   - Secure sensitive data in state
   - Clear sensitive data on logout
   - Prevent XSS attacks

3. **API Security**
   - HTTPS only communication
   - Request signing for critical operations
   - Rate limiting on frontend

4. **Wallet Security**
   - Secure wallet connection
   - Transaction confirmation prompts
   - Clear security warnings

### **Best Practices**
- Regular security audits
- Dependency vulnerability scanning
- Secure coding standards
- User security education

---

This comprehensive frontend specification provides a complete roadmap for building a professional, secure, and user-friendly cross-border payment application. The implementation should follow modern React best practices with a focus on user experience, security, and maintainability.