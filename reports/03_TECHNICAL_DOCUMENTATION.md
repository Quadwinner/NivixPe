# NIVIXPE - TECHNICAL DOCUMENTATION

**Document Version:** 1.0  
**Date:** March 30, 2026  
**Company:** NivixPe Private Limited  
**Technical Lead:** [Name]  
**Classification:** Internal - Technical Team

---

## EXECUTIVE SUMMARY

This technical documentation provides a comprehensive overview of the NivixPe platform architecture, implementation details, and operational procedures. The document is intended for developers, DevOps engineers, and technical stakeholders.

### System Overview
NivixPe is a dual-blockchain payment platform that combines:
- **Solana blockchain** for high-speed payment settlement
- **Hyperledger Fabric** for private KYC/compliance data
- **Node.js Bridge Service** for orchestration and API gateway
- **React Frontend** for user interface
- **Razorpay/RazorpayX** for fiat payment processing

### Key Technical Metrics
- **Transaction Speed:** <2 seconds end-to-end
- **Blockchain Confirmation:** <1 second (Solana)
- **API Response Time:** <200ms (p95)
- **System Uptime:** 99.9% target
- **Concurrent Users:** 1,000+ supported

---

## TABLE OF CONTENTS

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Blockchain Layer](#3-blockchain-layer)
4. [Backend Services](#4-backend-services)
5. [Frontend Application](#5-frontend-application)
6. [Database Design](#6-database-design)
7. [API Specifications](#7-api-specifications)
8. [Security Architecture](#8-security-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Monitoring & Logging](#10-monitoring--logging)
11. [Performance Optimization](#11-performance-optimization)
12. [Troubleshooting Guide](#12-troubleshooting-guide)

---

## 1. SYSTEM ARCHITECTURE

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NIVIXPE PLATFORM                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────────┐
│   Frontend   │◄───────►│    Bridge    │◄───────►│   Blockchain     │
│   (React)    │  HTTPS  │   Service    │   RPC   │     Layer        │
│              │         │  (Node.js)   │         │                  │
│  Port: 3000  │         │  Port: 3002  │         │  - Solana        │
└──────────────┘         └──────────────┘         │  - Hyperledger   │
                                │                  └──────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼────────┐    ┌────────▼────────┐
            │   Razorpay     │    │   Database      │
            │   Gateway      │    │   PostgreSQL    │
            │                │    │   Redis Cache   │
            └────────────────┘    └─────────────────┘
```

### 1.2 Component Interaction Flow

**User Registration & KYC:**
```
User → Frontend → Bridge Service → Hyperledger Fabric → Store KYC Data
                                 → PostgreSQL → Store User Profile
```

**On-Ramp (Fiat → Crypto):**
```
User → Frontend → Bridge Service → Razorpay → Payment Gateway
                                 → Solana → Mint Tokens
                                 → PostgreSQL → Record Transaction
```

**Off-Ramp (Crypto → Fiat):**
```
User → Frontend → Bridge Service → Solana → Burn Tokens
                                 → RazorpayX → Bank Payout
                                 → PostgreSQL → Record Transaction
```

**Cross-Border Transfer:**
```
Sender → Frontend → Bridge Service → Hyperledger → KYC Check
                                   → Solana → Token Transfer
                                   → Recipient Wallet
```



### 1.3 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

User Input (Frontend)
    │
    ├─► Authentication (JWT)
    │       │
    │       └─► Session Management (Redis)
    │
    ├─► API Request (Bridge Service)
    │       │
    │       ├─► Request Validation
    │       ├─► Rate Limiting (Redis)
    │       └─► Business Logic Processing
    │
    ├─► Blockchain Operations
    │       │
    │       ├─► Solana RPC (Token Operations)
    │       │       └─► Transaction Confirmation
    │       │
    │       └─► Hyperledger Fabric (KYC/Compliance)
    │               └─► Private Data Collections
    │
    ├─► Payment Gateway
    │       │
    │       ├─► Razorpay (On-Ramp)
    │       └─► RazorpayX (Off-Ramp)
    │
    └─► Data Persistence
            │
            ├─► PostgreSQL (Transactional Data)
            ├─► Redis (Cache & Sessions)
            └─► Blockchain (Immutable Records)
```

### 1.4 Microservices Architecture

The Bridge Service is organized into modular components:

```
bridge-service/
├── src/
│   ├── index.js                    # Main Express server
│   │
│   ├── onramp/                     # On-Ramp Module
│   │   ├── onramp-engine.js        # Orchestration
│   │   ├── order-manager.js        # Order lifecycle
│   │   ├── razorpay-payment-gateway.js
│   │   └── crypto-delivery-service.js
│   │
│   ├── offramp/                    # Off-Ramp Module
│   │   ├── offramp-engine.js       # Orchestration
│   │   └── withdrawal-manager.js
│   │
│   ├── payments/                   # Payment Services
│   │   ├── razorpay-gateway.js
│   │   ├── razorpayx-payouts.js
│   │   └── fiat-payout-service.js
│   │
│   ├── treasury/                   # Treasury Management
│   │   └── treasury-manager.js
│   │
│   ├── stablecoin/                 # Exchange Rates
│   │   └── exchange-rate-service.js
│   │
│   ├── solana/                     # Blockchain Clients
│   │   ├── solana-client.js
│   │   └── anchor-client.js
│   │
│   ├── compliance/                 # KYC/AML
│   │   ├── kyc-service.js
│   │   └── fabric-client.js
│   │
│   └── utils/                      # Utilities
│       ├── logger.js
│       ├── error-handler.js
│       └── validators.js
```

---

## 2. TECHNOLOGY STACK

### 2.1 Frontend Stack

| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **React** | 18.2.0 | UI Framework | https://react.dev/ |
| **TypeScript** | 4.9.5 | Type Safety | https://www.typescriptlang.org/ |
| **Material-UI** | 5.15.0 | Component Library | https://mui.com/ |
| **Solana Wallet Adapter** | 0.15.38 | Wallet Integration | https://github.com/solana-labs/wallet-adapter |
| **React Router** | 6.14.2 | Routing | https://reactrouter.com/ |
| **Axios** | 1.11.0 | HTTP Client | https://axios-http.com/ |
| **React Query** | 3.39.3 | Data Fetching | https://tanstack.com/query |

**Build Tools:**
- Vite 4.4.5 (Build tool)
- ESLint 8.45.0 (Linting)
- Prettier 3.0.0 (Code formatting)

### 2.2 Backend Stack

| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Node.js** | 18.x LTS | Runtime | https://nodejs.org/ |
| **Express.js** | 4.21.2 | Web Framework | https://expressjs.com/ |
| **@solana/web3.js** | 1.98.4 | Solana SDK | https://solana-labs.github.io/solana-web3.js/ |
| **@solana/spl-token** | 0.4.13 | Token Operations | https://spl.solana.com/token |
| **fabric-network** | 2.2.18 | Hyperledger SDK | https://hyperledger.github.io/fabric-sdk-node/ |
| **axios** | 1.11.0 | HTTP Client | https://axios-http.com/ |
| **jsonwebtoken** | 9.0.2 | JWT Auth | https://github.com/auth0/node-jsonwebtoken |
| **bcrypt** | 5.1.1 | Password Hashing | https://github.com/kelektiv/node.bcrypt.js |

**Additional Libraries:**
- dotenv 16.3.1 (Environment variables)
- cors 2.8.5 (CORS handling)
- helmet 7.1.0 (Security headers)
- morgan 1.10.0 (HTTP logging)
- winston 3.11.0 (Application logging)

### 2.3 Blockchain Stack

#### Solana
| Component | Version | Purpose |
|-----------|---------|---------|
| **Solana CLI** | 1.16.0+ | Command-line tools |
| **Anchor Framework** | 0.31.1 | Smart contract framework |
| **Rust** | 2021 Edition | Smart contract language |
| **SPL Token Program** | Latest | Token standard |

**Deployed Program:**
- Program ID: `FavSaLCcw6qgpLob47uGPoNhJRsGjBMB1tSb7CZTavbw`
- Network: Devnet
- RPC Endpoint: `https://api.devnet.solana.com`

#### Hyperledger Fabric
| Component | Version | Purpose |
|-----------|---------|---------|
| **Fabric** | 2.2.18 | Blockchain framework |
| **Fabric CA** | 1.5.17 | Certificate Authority |
| **CouchDB** | 3.1 | State database |
| **Docker** | 20.10+ | Container runtime |

**Network Configuration:**
- Channel: `mychannel`
- Chaincode: `nivix-kyc`
- Organizations: Org1, Org2
- Orderer: Solo (dev), Raft (production)

### 2.4 Database Stack

| Technology | Version | Purpose | Use Case |
|------------|---------|---------|----------|
| **PostgreSQL** | 14.x | Primary Database | User data, transactions |
| **Redis** | 7.x | Cache & Sessions | Session management, rate limiting |
| **Elasticsearch** | 8.x | Search Engine | Transaction search (optional) |

### 2.5 Infrastructure Stack

| Technology | Purpose | Environment |
|------------|---------|-------------|
| **AWS EC2** | Application hosting | Production |
| **AWS RDS** | Managed PostgreSQL | Production |
| **AWS ElastiCache** | Managed Redis | Production |
| **AWS S3** | Static file storage | Production |
| **AWS CloudFront** | CDN | Production |
| **Docker** | Containerization | All |
| **Nginx** | Reverse proxy | Production |
| **Let's Encrypt** | SSL certificates | Production |

### 2.6 Development Tools

| Tool | Purpose |
|------|---------|
| **Git** | Version control |
| **GitHub** | Code repository |
| **VS Code** | IDE |
| **Postman** | API testing |
| **Solana Explorer** | Blockchain explorer |
| **pgAdmin** | Database management |
| **Redis Commander** | Redis management |



---

## 3. BLOCKCHAIN LAYER

### 3.1 Solana Smart Contract Architecture

#### Program Structure

```rust
// Program ID
FavSaLCcw6qgpLob47uGPoNhJRsGjBMB1tSb7CZTavbw

// Main Program Module
pub mod nivix_protocol {
    // Account Structures
    - Platform
    - User
    - LiquidityPool
    - Transaction
    
    // Instructions
    - initialize_platform
    - register_user
    - create_liquidity_pool
    - process_transfer
    - swap_currencies
    - update_exchange_rate
}
```

#### Account Structures

**Platform Account:**
```rust
#[account]
pub struct Platform {
    pub admin: Pubkey,              // Platform administrator
    pub fee_rate: u64,              // Platform fee (basis points)
    pub total_transactions: u64,    // Total transaction count
    pub supported_currencies: Vec<String>, // Supported currencies
    pub bump: u8,                   // PDA bump seed
}

// Size: 8 + 32 + 8 + 8 + (4 + 32*10) + 1 = 381 bytes
```

**User Account:**
```rust
#[account]
pub struct User {
    pub wallet_address: Pubkey,     // User's wallet
    pub kyc_verified: bool,         // KYC status
    pub total_sent: u64,            // Total amount sent
    pub total_received: u64,        // Total amount received
    pub risk_score: u8,             // Risk score (1-5)
    pub bump: u8,                   // PDA bump seed
}

// Size: 8 + 32 + 1 + 8 + 8 + 1 + 1 = 59 bytes
```

**LiquidityPool Account:**
```rust
#[account]
pub struct LiquidityPool {
    pub name: String,               // Pool name
    pub admin: Pubkey,              // Pool administrator
    pub source_currency: String,    // Source currency code
    pub destination_currency: String, // Destination currency code
    pub source_mint: Pubkey,        // Source token mint
    pub destination_mint: Pubkey,   // Destination token mint
    pub exchange_rate: u64,         // Exchange rate (scaled by 10,000)
    pub pool_fee_rate: u64,         // Pool fee (basis points)
    pub total_swapped: u64,         // Total volume swapped
    pub is_active: bool,            // Pool status
}

// Size: 8 + (4+32) + 32 + (4+3) + (4+3) + 32 + 32 + 8 + 8 + 8 + 1 = 176 bytes
```

#### Key Instructions

**1. Initialize Platform**
```rust
pub fn initialize_platform(
    ctx: Context<InitializePlatform>,
    fee_rate: u64,
    supported_currencies: Vec<String>,
) -> Result<()>
```

**2. Register User**
```rust
pub fn register_user(
    ctx: Context<RegisterUser>,
    kyc_verified: bool,
) -> Result<()>
```

**3. Create Liquidity Pool**
```rust
pub fn create_liquidity_pool(
    ctx: Context<CreateLiquidityPool>,
    name: String,
    currency_a: String,
    currency_b: String,
    initial_liquidity_a: u64,
    initial_liquidity_b: u64,
) -> Result<()>
```

**4. Process Transfer**
```rust
pub fn process_transfer(
    ctx: Context<ProcessTransfer>,
    amount: u64,
    source_currency: String,
    destination_currency: String,
    recipient_wallet_seed: [u8; 32],
    memo: String,
) -> Result<()>
```

**5. Swap Currencies**
```rust
pub fn swap_currencies(
    ctx: Context<SwapCurrencies>,
    amount_in: u64,
    minimum_amount_out: u64,
) -> Result<()>
```

#### Token Mints (Devnet)

| Currency | Mint Address | Decimals |
|----------|--------------|----------|
| USD | `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` | 6 |
| INR | `8VyJ4EgKeto2vhVzq2wgwD9GrFz1wcWnGHP97buwxZj2` | 6 |
| EUR | `9abc...` | 6 |
| GBP | `10def...` | 6 |
| JPY | `11ghi...` | 6 |
| CAD | `12jkl...` | 6 |
| AUD | `13mno...` | 6 |

### 3.2 Hyperledger Fabric Architecture

#### Network Topology

```
┌─────────────────────────────────────────────────────────┐
│              Hyperledger Fabric Network                  │
└─────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐
│    Org1      │         │    Org2      │
│              │         │              │
│  ┌────────┐  │         │  ┌────────┐  │
│  │ Peer0  │  │         │  │ Peer0  │  │
│  │ (7051) │  │         │  │ (9051) │  │
│  └────────┘  │         │  └────────┘  │
│              │         │              │
│  ┌────────┐  │         │  ┌────────┐  │
│  │   CA   │  │         │  │   CA   │  │
│  │ (7054) │  │         │  │ (8054) │  │
│  └────────┘  │         │  └────────┘  │
└──────────────┘         └──────────────┘
        │                        │
        └────────┬───────────────┘
                 │
         ┌───────▼────────┐
         │    Orderer     │
         │    (7050)      │
         └────────────────┘
```

#### Chaincode Structure

**File:** `chaincode-nivix-kyc/nivix-kyc.go`

```go
package main

import (
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing KYC data
type SmartContract struct {
    contractapi.Contract
}

// KYC represents the KYC data structure
type KYC struct {
    UserID           string `json:"userId"`
    SolanaAddress    string `json:"solanaAddress"`
    FullName         string `json:"fullName"`
    KYCVerified      bool   `json:"kycVerified"`
    VerificationDate string `json:"verificationDate"`
    RiskScore        int    `json:"riskScore"`
    CountryCode      string `json:"countryCode"`
}

// Functions:
// - StoreKYC
// - GetKYCStatus
// - UpdateKYCRisk
// - ValidateTransaction
// - QueryAllKYC
```

#### Private Data Collections

**Configuration:** `collections_config.json`

```json
[
    {
        "name": "kycPrivateDetails",
        "policy": "OR('Org1MSP.member', 'Org2MSP.member')",
        "requiredPeerCount": 1,
        "maxPeerCount": 2,
        "blockToLive": 0,
        "memberOnlyRead": true,
        "memberOnlyWrite": true
    }
]
```

**Private Data Fields:**
- Full name
- Date of birth
- Address
- Document numbers
- Biometric data

**Public Data Fields:**
- Solana address
- KYC verification status
- Risk score
- Country code



---

## 4. BACKEND SERVICES

### 4.1 Bridge Service Architecture

#### Main Server Configuration

**File:** `bridge-service/src/index.js`

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api/kyc', kycRoutes);
app.use('/api/onramp', onrampRoutes);
app.use('/api/offramp', offrampRoutes);
app.use('/api/solana', solanaRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/bridge', bridgeRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Bridge Service running on port ${PORT}`);
});
```

#### Environment Configuration

**File:** `.env`

```bash
# Environment
NODE_ENV=development
PORT=3002

# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=FavSaLCcw6qgpLob47uGPoNhJRsGjBMB1tSb7CZTavbw

# Razorpay Configuration
RAZORPAY_ENV=test
RAZORPAY_KEY_ID=rzp_test_ReyC3sUcY6cCtH
RAZORPAY_KEY_SECRET=Wk003BQlVsiX594MM1lYeJoa
RAZORPAY_ACCOUNT_NUMBER=2323230040290482

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nivixpe
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=24h

# Feature Flags
ENABLE_OFFRAMP=true
ENABLE_TREASURY_MANAGEMENT=true
ENABLE_STABLECOIN_BRIDGE=true

# Logging
LOG_LEVEL=info
LOG_FILE=logs/bridge.log
```

### 4.2 On-Ramp Service

#### Order Manager

**File:** `bridge-service/src/onramp/order-manager.js`

```javascript
class OrderManager {
    constructor() {
        this.orders = new Map();
    }

    /**
     * Create new on-ramp order
     * @param {Object} orderData - Order details
     * @returns {Object} Created order
     */
    async createOrder(orderData) {
        const orderId = this.generateOrderId();
        const order = {
            orderId,
            userAddress: orderData.userAddress,
            fiatAmount: orderData.fiatAmount,
            fiatCurrency: orderData.fiatCurrency,
            cryptoAmount: orderData.cryptoAmount,
            cryptoCurrency: orderData.cryptoCurrency,
            exchangeRate: orderData.exchangeRate,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        };
        
        this.orders.set(orderId, order);
        return order;
    }

    /**
     * Update order status
     * @param {string} orderId - Order ID
     * @param {string} status - New status
     * @param {Object} metadata - Additional metadata
     */
    async updateOrderStatus(orderId, status, metadata = {}) {
        const order = this.orders.get(orderId);
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }
        
        order.status = status;
        order.updatedAt = new Date().toISOString();
        Object.assign(order, metadata);
        
        this.orders.set(orderId, order);
        return order;
    }

    /**
     * Get order by ID
     * @param {string} orderId - Order ID
     * @returns {Object} Order details
     */
    getOrder(orderId) {
        return this.orders.get(orderId);
    }

    /**
     * Get user orders
     * @param {string} userAddress - User wallet address
     * @returns {Array} User orders
     */
    getUserOrders(userAddress) {
        return Array.from(this.orders.values())
            .filter(order => order.userAddress === userAddress)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Generate unique order ID
     * @returns {string} Order ID
     */
    generateOrderId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `onramp_${timestamp}_${random}`;
    }
}

module.exports = OrderManager;
```

#### Crypto Delivery Service

**File:** `bridge-service/src/onramp/crypto-delivery-service.js`

```javascript
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');

class CryptoDeliveryService {
    constructor(solanaClient) {
        this.connection = solanaClient.connection;
        this.bridgeWallet = solanaClient.bridgeWallet;
    }

    /**
     * Deliver tokens to user wallet
     * @param {string} userAddress - User wallet address
     * @param {string} mintAddress - Token mint address
     * @param {number} amount - Amount to deliver (in smallest units)
     * @returns {Object} Transaction result
     */
    async deliverTokens(userAddress, mintAddress, amount) {
        try {
            const userPubkey = new PublicKey(userAddress);
            const mintPubkey = new PublicKey(mintAddress);
            
            // Get or create user's token account
            const userTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.bridgeWallet,
                mintPubkey,
                userPubkey
            );
            
            // Mint tokens to user's account
            const signature = await mintTo(
                this.connection,
                this.bridgeWallet,
                mintPubkey,
                userTokenAccount.address,
                this.bridgeWallet,
                amount
            );
            
            // Wait for confirmation
            await this.connection.confirmTransaction(signature, 'finalized');
            
            return {
                success: true,
                signature,
                userTokenAccount: userTokenAccount.address.toString(),
                amount,
                explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
            };
        } catch (error) {
            console.error('Token delivery error:', error);
            throw new Error(`Failed to deliver tokens: ${error.message}`);
        }
    }

    /**
     * Verify token delivery
     * @param {string} signature - Transaction signature
     * @returns {boolean} Verification result
     */
    async verifyDelivery(signature) {
        try {
            const status = await this.connection.getSignatureStatus(signature);
            return status.value?.confirmationStatus === 'finalized';
        } catch (error) {
            console.error('Verification error:', error);
            return false;
        }
    }
}

module.exports = CryptoDeliveryService;
```

### 4.3 Off-Ramp Service

#### Off-Ramp Engine

**File:** `bridge-service/src/offramp/offramp-engine.js`

```javascript
class OfframpEngine {
    constructor(solanaClient, razorpayxPayouts, treasuryManager) {
        this.solanaClient = solanaClient;
        this.razorpayxPayouts = razorpayxPayouts;
        this.treasuryManager = treasuryManager;
    }

    /**
     * Process off-ramp withdrawal
     * @param {Object} withdrawalData - Withdrawal details
     * @returns {Object} Withdrawal result
     */
    async processWithdrawal(withdrawalData) {
        const {
            userAddress,
            amount,
            currency,
            bankDetails
        } = withdrawalData;
        
        try {
            // Step 1: Validate user KYC
            await this.validateKYC(userAddress);
            
            // Step 2: Burn tokens from user wallet
            const burnResult = await this.burnTokens(userAddress, amount, currency);
            
            // Step 3: Determine routing (direct vs hybrid)
            const route = await this.treasuryManager.determineRoute(currency, amount);
            
            // Step 4: Process fiat payout
            const payoutResult = await this.processPayout(
                bankDetails,
                amount,
                currency,
                route
            );
            
            // Step 5: Record transaction
            await this.recordTransaction({
                userAddress,
                amount,
                currency,
                burnSignature: burnResult.signature,
                payoutId: payoutResult.payoutId,
                route,
                status: 'COMPLETED'
            });
            
            return {
                success: true,
                transactionId: payoutResult.payoutId,
                burnSignature: burnResult.signature,
                estimatedArrival: this.calculateArrivalTime(route)
            };
        } catch (error) {
            console.error('Off-ramp error:', error);
            throw error;
        }
    }

    /**
     * Burn tokens from user wallet
     * @param {string} userAddress - User wallet address
     * @param {number} amount - Amount to burn
     * @param {string} currency - Currency code
     * @returns {Object} Burn result
     */
    async burnTokens(userAddress, amount, currency) {
        // Implementation for token burning
        // Uses Solana SPL Token burn instruction
    }

    /**
     * Process fiat payout
     * @param {Object} bankDetails - Bank account details
     * @param {number} amount - Amount to payout
     * @param {string} currency - Currency code
     * @param {string} route - Routing strategy
     * @returns {Object} Payout result
     */
    async processPayout(bankDetails, amount, currency, route) {
        if (route === 'direct') {
            // Direct treasury payout
            return await this.razorpayxPayouts.processCompletePayout(
                bankDetails,
                amount,
                'withdrawal',
                `nivix_withdrawal_${Date.now()}`
            );
        } else {
            // Hybrid route via stablecoin
            return await this.processHybridPayout(bankDetails, amount, currency);
        }
    }

    /**
     * Calculate estimated arrival time
     * @param {string} route - Routing strategy
     * @returns {string} Estimated arrival time
     */
    calculateArrivalTime(route) {
        const now = new Date();
        if (route === 'direct') {
            // UPI/IMPS: 2 minutes
            now.setMinutes(now.getMinutes() + 2);
        } else {
            // Hybrid: 2 hours
            now.setHours(now.getHours() + 2);
        }
        return now.toISOString();
    }
}

module.exports = OfframpEngine;
```



### 4.4 Exchange Rate Service

**File:** `bridge-service/src/stablecoin/exchange-rate-service.js`

```javascript
const axios = require('axios');

class ExchangeRateService {
    constructor() {
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
        
        // Fallback rates (updated manually)
        this.fallbackRates = {
            'USD-INR': 83.25,
            'USD-EUR': 0.92,
            'USD-GBP': 0.79,
            'USD-JPY': 149.50,
            'USD-CAD': 1.36,
            'USD-AUD': 1.53
        };
    }

    /**
     * Get exchange rate between two currencies
     * @param {string} from - Source currency
     * @param {string} to - Destination currency
     * @returns {number} Exchange rate
     */
    async getExchangeRate(from, to) {
        const pair = `${from}-${to}`;
        
        // Check cache
        const cached = this.cache.get(pair);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.rate;
        }
        
        try {
            // Try to fetch live rate
            const rate = await this.fetchLiveRate(from, to);
            
            // Cache the rate
            this.cache.set(pair, {
                rate,
                timestamp: Date.now()
            });
            
            return rate;
        } catch (error) {
            console.warn(`Failed to fetch live rate for ${pair}, using fallback`);
            return this.fallbackRates[pair] || 1.0;
        }
    }

    /**
     * Fetch live exchange rate from API
     * @param {string} from - Source currency
     * @param {string} to - Destination currency
     * @returns {number} Exchange rate
     */
    async fetchLiveRate(from, to) {
        // Example using exchangerate-api.com
        const response = await axios.get(
            `https://api.exchangerate-api.com/v4/latest/${from}`
        );
        
        return response.data.rates[to];
    }

    /**
     * Calculate conversion amount
     * @param {number} amount - Amount to convert
     * @param {string} from - Source currency
     * @param {string} to - Destination currency
     * @returns {Object} Conversion result
     */
    async calculateConversion(amount, from, to) {
        const rate = await this.getExchangeRate(from, to);
        const convertedAmount = amount * rate;
        
        // Calculate fees
        const platformFee = convertedAmount * 0.005; // 0.5%
        const poolFee = convertedAmount * 0.003; // 0.3%
        const totalFee = platformFee + poolFee;
        
        return {
            sourceAmount: amount,
            sourceCurrency: from,
            destinationAmount: convertedAmount - totalFee,
            destinationCurrency: to,
            exchangeRate: rate,
            platformFee,
            poolFee,
            totalFee,
            netAmount: convertedAmount - totalFee
        };
    }
}

module.exports = ExchangeRateService;
```

### 4.5 Treasury Manager

**File:** `bridge-service/src/treasury/treasury-manager.js`

```javascript
class TreasuryManager {
    constructor() {
        this.treasuryBalances = {
            'INR': 500000, // ₹5 lakh
            'USD': 10000,  // $10k
            'EUR': 8000,   // €8k
            'GBP': 6000    // £6k
        };
        
        this.minimumThresholds = {
            'INR': 50000,  // ₹50k
            'USD': 1000,   // $1k
            'EUR': 800,    // €800
            'GBP': 600     // £600
        };
    }

    /**
     * Determine routing strategy for withdrawal
     * @param {string} currency - Currency code
     * @param {number} amount - Withdrawal amount
     * @returns {string} Routing strategy ('direct' or 'hybrid')
     */
    async determineRoute(currency, amount) {
        const balance = this.treasuryBalances[currency] || 0;
        const threshold = this.minimumThresholds[currency] || 0;
        
        // Check if treasury has sufficient balance
        if (balance - amount >= threshold) {
            return 'direct'; // Fast local payout
        } else {
            return 'hybrid'; // Stablecoin bridge route
        }
    }

    /**
     * Debit treasury balance
     * @param {string} currency - Currency code
     * @param {number} amount - Amount to debit
     */
    async debitTreasury(currency, amount) {
        if (!this.treasuryBalances[currency]) {
            throw new Error(`Currency ${currency} not supported`);
        }
        
        if (this.treasuryBalances[currency] < amount) {
            throw new Error(`Insufficient treasury balance for ${currency}`);
        }
        
        this.treasuryBalances[currency] -= amount;
        
        // Check if rebalancing needed
        if (this.treasuryBalances[currency] < this.minimumThresholds[currency]) {
            await this.triggerRebalancing(currency);
        }
    }

    /**
     * Credit treasury balance
     * @param {string} currency - Currency code
     * @param {number} amount - Amount to credit
     */
    async creditTreasury(currency, amount) {
        if (!this.treasuryBalances[currency]) {
            this.treasuryBalances[currency] = 0;
        }
        
        this.treasuryBalances[currency] += amount;
    }

    /**
     * Trigger treasury rebalancing
     * @param {string} currency - Currency to rebalance
     */
    async triggerRebalancing(currency) {
        console.log(`Treasury rebalancing triggered for ${currency}`);
        // Implementation:
        // 1. Convert stablecoins to fiat
        // 2. Top up treasury balance
        // 3. Notify operations team
    }

    /**
     * Get treasury status
     * @returns {Object} Treasury balances and status
     */
    getTreasuryStatus() {
        return {
            balances: this.treasuryBalances,
            thresholds: this.minimumThresholds,
            alerts: this.checkAlerts()
        };
    }

    /**
     * Check for low balance alerts
     * @returns {Array} List of alerts
     */
    checkAlerts() {
        const alerts = [];
        
        for (const [currency, balance] of Object.entries(this.treasuryBalances)) {
            const threshold = this.minimumThresholds[currency];
            if (balance < threshold) {
                alerts.push({
                    currency,
                    balance,
                    threshold,
                    severity: 'HIGH',
                    message: `${currency} treasury below minimum threshold`
                });
            } else if (balance < threshold * 1.5) {
                alerts.push({
                    currency,
                    balance,
                    threshold,
                    severity: 'MEDIUM',
                    message: `${currency} treasury approaching minimum threshold`
                });
            }
        }
        
        return alerts;
    }
}

module.exports = TreasuryManager;
```

---

## 5. FRONTEND APPLICATION

### 5.1 Application Structure

```
frontend/nivix-pay-old/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.tsx                    # Main app component
│   ├── index.tsx                  # Entry point
│   │
│   ├── pages/                     # Page components
│   │   ├── Dashboard.tsx          # User dashboard
│   │   ├── Send.tsx               # Send money page
│   │   ├── KYC.tsx                # KYC submission
│   │   ├── KYCAdmin.tsx           # KYC admin panel
│   │   ├── PaymentApp.tsx         # On-ramp interface
│   │   └── OfframpTesting.tsx     # Off-ramp interface
│   │
│   ├── components/                # Reusable components
│   │   ├── Header.tsx             # Navigation header
│   │   ├── WalletButton.tsx       # Wallet connection
│   │   ├── TransactionList.tsx    # Transaction history
│   │   └── LoadingSpinner.tsx     # Loading indicator
│   │
│   ├── services/                  # API services
│   │   ├── apiService.ts          # API client
│   │   └── walletService.ts       # Wallet operations
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useWallet.ts           # Wallet hook
│   │   └── useTransactions.ts     # Transactions hook
│   │
│   ├── utils/                     # Utility functions
│   │   ├── formatters.ts          # Data formatters
│   │   └── validators.ts          # Input validators
│   │
│   └── types/                     # TypeScript types
│       └── index.ts               # Type definitions
```

### 5.2 Wallet Integration

**File:** `frontend/nivix-pay-old/src/hooks/useWallet.ts`

```typescript
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export const useWallet = () => {
    const { publicKey, connected, connect, disconnect } = useSolanaWallet();
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        if (connected && publicKey) {
            fetchBalance();
        }
    }, [connected, publicKey]);

    const fetchBalance = async () => {
        if (!publicKey) return;
        
        try {
            const response = await fetch(
                `http://localhost:3002/api/solana/balance/${publicKey.toString()}`
            );
            const data = await response.json();
            setBalance(data.balance);
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        }
    };

    return {
        address: publicKey?.toString(),
        connected,
        balance,
        connect,
        disconnect,
        refreshBalance: fetchBalance
    };
};
```

### 5.3 API Service

**File:** `frontend/nivix-pay-old/src/services/apiService.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const apiService = {
    // KYC APIs
    submitKYC: (data: any) => apiClient.post('/api/kyc/submit', data),
    getKYCStatus: (address: string) => apiClient.get(`/api/kyc/status/${address}`),
    
    // On-Ramp APIs
    createOrder: (data: any) => apiClient.post('/api/onramp/create-order', data),
    createPayment: (orderId: string) => apiClient.post('/api/onramp/create-payment', { orderId }),
    verifyPayment: (data: any) => apiClient.post('/api/onramp/verify-payment', data),
    getOrderStatus: (orderId: string) => apiClient.get(`/api/onramp/order-status/${orderId}`),
    
    // Off-Ramp APIs
    getQuote: (data: any) => apiClient.post('/api/offramp/quote', data),
    initiateWithdrawal: (data: any) => apiClient.post('/api/offramp/initiate', data),
    getWithdrawalStatus: (txId: string) => apiClient.get(`/api/offramp/status/${txId}`),
    
    // Solana APIs
    getBalance: (address: string) => apiClient.get(`/api/solana/balance/${address}`),
    getTokenBalance: (address: string, mint: string) => 
        apiClient.get(`/api/solana/token-balance/${address}/${mint}`),
    
    // Pool APIs
    getPools: () => apiClient.get('/api/pools'),
    getPoolInfo: (poolId: string) => apiClient.get(`/api/pools/${poolId}`),
    swapCurrencies: (data: any) => apiClient.post('/api/pools/swap', data)
};
```

