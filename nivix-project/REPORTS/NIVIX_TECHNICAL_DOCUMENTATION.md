# Nivix Protocol - Technical Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Development Environment Setup](#development-environment-setup)
5. [Project Structure](#project-structure)
6. [Smart Contracts](#smart-contracts)
7. [Bridge Service](#bridge-service)
8. [Frontend Application](#frontend-application)
9. [API Documentation](#api-documentation)
10. [Deployment Guide](#deployment-guide)
11. [Testing](#testing)
12. [Contributing](#contributing)

---

## 🎯 Project Overview

**Nivix Protocol** is a cross-border payment system that enables fast, secure, and compliant international money transfers using a dual-blockchain architecture:

- **Solana Blockchain**: High-performance payment processing with low fees
- **Hyperledger Fabric**: KYC/AML compliance and regulatory data management
- **Bridge Service**: Cross-chain transaction coordination and API gateway

### Key Features
- ⚡ **Fast Transfers**: Sub-second transaction processing on Solana
- 🔐 **KYC Compliance**: Integrated identity verification via Hyperledger Fabric
- 💱 **Multi-Currency**: Support for SOL, USDC, INR, and other tokens
- 🌐 **Cross-Border**: International money transfers with real-time exchange rates
- 🔄 **Liquidity Pools**: Automated market maker for currency swapping
- 📱 **User-Friendly**: Modern React frontend with wallet integration

---

## 🏗️ Architecture

### System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Bridge Service │    │   Blockchains   │
│   (React)       │◄──►│   (Node.js)     │◄──►│                 │
│   Port: 3000    │    │   Port: 3002    │    │  Solana + HLF   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Interaction Flow
1. **User Interface** → Frontend (React + Material-UI)
2. **API Gateway** → Bridge Service (Express.js)
3. **Payment Processing** → Solana Blockchain (Anchor/Rust)
4. **Compliance** → Hyperledger Fabric (JavaScript/Go Chaincode)
5. **Cross-Chain Coordination** → Transaction Bridge Module

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.2.0 with TypeScript
- **UI Library**: Material-UI (MUI) 5.15.0
- **Wallet Integration**: Solana Wallet Adapter
- **State Management**: React Context API
- **Routing**: React Router DOM 6.14.2
- **Styling**: Styled Components + Emotion

### Backend (Bridge Service)
- **Runtime**: Node.js with Express.js 4.18.2
- **Blockchain Integration**: 
  - Solana: `@solana/web3.js` 1.98.2
  - Anchor: `@coral-xyz/anchor` 0.31.1
  - Hyperledger: `fabric-network` 2.2.18
- **API**: RESTful APIs with CORS support
- **Utilities**: UUID, Axios, Morgan (logging)

### Solana Smart Contracts
- **Framework**: Anchor 0.31.1
- **Language**: Rust 2021 Edition
- **Dependencies**: 
  - `anchor-lang` 0.31.1
  - `anchor-spl` 0.31.1 (SPL Token support)

### Hyperledger Fabric
- **Chaincode**: JavaScript/Go
- **Network**: Multi-organization setup
- **Collections**: Private data for KYC information
- **Consensus**: Raft ordering service

---

## 🚀 Development Environment Setup

### Prerequisites
- **Node.js**: >= 16.x
- **Rust**: Latest stable version
- **Solana CLI**: v1.16.0+
- **Anchor CLI**: Latest version
- **Docker**: For Hyperledger Fabric
- **Git**: Version control

### Installation Steps

#### 1. Clone Repository
```bash
git clone <repository-url>
cd nivix-project
```

#### 2. Install Solana & Anchor
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

#### 3. Install Dependencies

**Bridge Service:**
```bash
cd bridge-service
npm install
```

**Frontend:**
```bash
cd frontend/nivix-pay
npm install
```

**Solana Smart Contracts:**
```bash
cd solana/nivix_protocol
anchor build
```

#### 4. Setup Hyperledger Fabric
```bash
cd hyperledger
# Download Fabric samples and binaries
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.8 1.5.5
```

### Environment Configuration

#### Create Environment Files
```bash
# Bridge Service .env
cd bridge-service
echo "PORT=3002
SOLANA_NETWORK=devnet
FABRIC_WALLET_PATH=./wallet
FABRIC_CONNECTION_PROFILE=./fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json" > .env
```

---

## 📁 Project Structure

```
nivix-project/
├── bridge-service/                 # Node.js API gateway
│   ├── src/
│   │   ├── bridge/
│   │   │   └── transaction-bridge.js    # Cross-chain coordinator
│   │   ├── solana/
│   │   │   ├── solana-client.js         # Solana blockchain client
│   │   │   └── anchor-client.js         # Smart contract interface
│   │   ├── direct-invoke.js             # Hyperledger integration
│   │   └── index.js                     # Express server
│   ├── config/
│   │   └── nivix_protocol.json          # Smart contract IDL
│   └── package.json
│
├── frontend/nivix-pay/             # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Send.tsx                 # Money transfer UI
│   │   │   ├── KYC.tsx                  # Identity verification
│   │   │   └── KYCAdmin.tsx            # Admin panel
│   │   ├── services/
│   │   │   └── apiService.ts            # API communication
│   │   └── App.tsx
│   └── package.json
│
├── solana/nivix_protocol/          # Solana smart contracts
│   ├── programs/nivix_protocol/
│   │   └── src/lib.rs               # Main smart contract
│   ├── tests/
│   │   └── nivix_protocol.ts        # Contract tests
│   ├── Anchor.toml                  # Anchor configuration
│   └── Cargo.toml
│
├── hyperledger/                    # Hyperledger Fabric
│   ├── chaincode/nivix-kyc/         # KYC chaincode
│   ├── fabric-samples/              # Fabric network setup
│   └── deploy-chaincode-manual.sh
│
└── start-all-services.sh           # Orchestration script
```

---

## 🔗 Smart Contracts

### Solana Program (Anchor/Rust)

#### Main Functions

**1. Initialize Platform**
```rust
pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()>
```
- Sets up the main platform account
- Initializes system parameters
- Creates admin privileges

**2. Create Liquidity Pool**
```rust
pub fn create_liquidity_pool(
    ctx: Context<CreateLiquidityPool>,
    currency_a: String,
    currency_b: String,
    initial_liquidity_a: u64,
    initial_liquidity_b: u64,
) -> Result<()>
```
- Creates currency exchange pools
- Sets initial liquidity ratios
- Enables automated market making

**3. Process Transfer**
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
- Handles cross-border transfers
- Manages currency swapping
- Records transaction data

**4. Swap Currencies**
```rust
pub fn swap_currencies(
    ctx: Context<SwapCurrencies>,
    amount_in: u64,
    minimum_amount_out: u64,
) -> Result<()>
```
- Exchanges between different currencies
- Calculates exchange rates
- Implements slippage protection

#### Account Structures

**Platform Account**
```rust
pub struct Platform {
    pub admin: Pubkey,
    pub fee_rate: u64,
    pub total_transactions: u64,
    pub supported_currencies: Vec<String>,
    pub bump: u8,
}
```

**User Account**
```rust
pub struct User {
    pub wallet_address: Pubkey,
    pub kyc_verified: bool,
    pub total_sent: u64,
    pub total_received: u64,
    pub risk_score: u8,
    pub bump: u8,
}
```

**Transaction Record**
```rust
pub struct TransactionRecord {
    pub transaction_id: String,
    pub from_address: Pubkey,
    pub to_address: Pubkey,
    pub amount: u64,
    pub source_currency: String,
    pub destination_currency: String,
    pub exchange_rate: u64,
    pub timestamp: i64,
    pub status: TransactionStatus,
    pub memo: String,
    pub bump: u8,
}
```

### Hyperledger Fabric Chaincode

#### KYC Functions

**Store KYC Data**
```javascript
async StoreKYC(ctx, solanaAddress, kycData)
```
- Stores user verification data
- Uses private data collections
- Implements access controls

**Get KYC Status**
```javascript
async GetKYCStatus(ctx, solanaAddress)
```
- Retrieves verification status
- Returns compliance information
- Checks user permissions

**Validate Transaction**
```javascript
async ValidateTransaction(ctx, transactionData)
```
- Performs compliance checks
- Validates transaction limits
- Records audit trail

#### Data Structures

**KYC Record**
```go
type KYCRecord struct {
    UserID           string `json:"userId"`
    SolanaAddress    string `json:"solanaAddress"`
    FullName         string `json:"fullName"`
    KYCVerified      bool   `json:"kycVerified"`
    VerificationDate string `json:"verificationDate"`
    RiskScore        int    `json:"riskScore"`
    CountryCode      string `json:"countryCode"`
}
```

---

## 🌉 Bridge Service

### Transaction Bridge Module

The bridge service coordinates between Solana and Hyperledger Fabric:

#### Key Features
- **Cross-chain transaction coordination**
- **KYC verification integration**
- **Real-time status tracking**
- **Error handling and retry logic**

#### Main Class: TransactionBridge

```javascript
class TransactionBridge {
  constructor() {
    this.initialized = false;
    this.fabricConnected = false;
    this.solanaConnected = false;
    this.transactions = new Map();
  }

  async initialize()
  async initiateTransaction(transaction)
  async processTransaction(transactionId)
  async verifyKYC(solanaAddress)
  async getTransactionStatus(transactionId)
}
```

#### Transaction Flow

1. **Initiation**: Frontend sends transfer request
2. **Validation**: Check user KYC status on Hyperledger
3. **Processing**: Execute transfer on Solana
4. **Recording**: Log transaction on both blockchains
5. **Settlement**: Update balances and notify users

### API Endpoints

#### Transaction Management
```javascript
POST /api/bridge/initiate-transfer
GET  /api/bridge/transaction-status/:id
GET  /api/bridge/wallet-transactions/:address
```

#### KYC Management
```javascript
POST /api/kyc/store
GET  /api/kyc/status/:address
POST /api/kyc/update
```

#### Solana Integration
```javascript
GET  /api/solana/balance/:address
POST /api/solana/transfer
GET  /api/solana/token-balance/:address/:mint
```

---

## 💻 Frontend Application

### React Components

#### Dashboard Component
```typescript
interface DashboardProps {
  user: User;
  transactions: Transaction[];
  balances: TokenBalance[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, transactions, balances }) => {
  // Display user overview, recent transactions, and balances
};
```

#### Send Component
```typescript
interface SendFormData {
  recipientAddress: string;
  amount: number;
  sourceCurrency: string;
  destinationCurrency: string;
  memo: string;
}

const Send: React.FC = () => {
  const [formData, setFormData] = useState<SendFormData>();
  const [exchangeRate, setExchangeRate] = useState<number>();
  
  const handleSend = async () => {
    // Process transfer through bridge service
  };
};
```

#### KYC Component
```typescript
interface KYCData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
}

const KYC: React.FC = () => {
  const [kycData, setKycData] = useState<KYCData>();
  const [verificationStatus, setVerificationStatus] = useState<string>();
  
  const submitKYC = async () => {
    // Submit KYC data to bridge service
  };
};
```

### Wallet Integration

```typescript
import { useWallet } from '@solana/wallet-adapter-react';

const WalletConnection: React.FC = () => {
  const { wallet, connect, disconnect, connected, publicKey } = useWallet();
  
  return (
    <div>
      {!connected ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {publicKey?.toString()}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
};
```

---

## 📡 API Documentation

### Authentication
All API endpoints use wallet-based authentication. Include the user's Solana public key in request headers:

```javascript
headers: {
  'Authorization': 'Wallet <public_key>',
  'Content-Type': 'application/json'
}
```

### Transaction APIs

#### Initiate Transfer
```http
POST /api/bridge/initiate-transfer
Content-Type: application/json

{
  "fromAddress": "8VyJ4EgKeto2vhVzq2wgwD9GrFz1wcWnGHP97buwxZj2",
  "toAddress": "9WzZKhgZNXo3vRrVzMfWgGT1EFm7bQsXdFh26jKwR8k3",
  "amount": 100,
  "sourceCurrency": "USDC",
  "destinationCurrency": "INR",
  "memo": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "transaction_id": "abc123-def456-ghi789",
  "status": "PENDING",
  "estimated_completion": "2024-01-15T10:30:00Z"
}
```

#### Get Transaction Status
```http
GET /api/bridge/transaction-status/abc123-def456-ghi789
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "abc123-def456-ghi789",
    "status": "COMPLETED",
    "fromAddress": "8VyJ4EgKeto2vhVzq2wgwD9GrFz1wcWnGHP97buwxZj2",
    "toAddress": "9WzZKhgZNXo3vRrVzMfWgGT1EFm7bQsXdFh26jKwR8k3",
    "amount": 100,
    "sourceCurrency": "USDC",
    "destinationCurrency": "INR",
    "exchangeRate": 83.25,
    "finalAmount": 8325,
    "fees": 0.1,
    "timestamp": "2024-01-15T10:25:00Z",
    "solanaTransaction": "5n8zQQ...",
    "hyperledgerTransaction": "tx_001"
  }
}
```

### KYC APIs

#### Store KYC Data
```http
POST /api/kyc/store
Content-Type: application/json

{
  "solanaAddress": "8VyJ4EgKeto2vhVzq2wgwD9GrFz1wcWnGHP97buwxZj2",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "nationality": "US",
  "documentType": "passport",
  "documentNumber": "123456789",
  "countryCode": "US"
}
```

#### Get KYC Status
```http
GET /api/kyc/status/8VyJ4EgKeto2vhVzq2wgwD9GrFz1wcWnGHP97buwxZj2
```

**Response:**
```json
{
  "success": true,
  "kyc": {
    "solanaAddress": "8VyJ4EgKeto2vhVzq2wgwD9GrFz1wcWnGHP97buwxZj2",
    "kycVerified": true,
    "verificationDate": "2024-01-10T09:00:00Z",
    "riskScore": 2,
    "countryCode": "US",
    "transactionLimits": {
      "daily": 10000,
      "monthly": 100000
    }
  }
}
```

---

## 🚀 Deployment Guide

### Local Development

#### Start All Services
```bash
# Use the orchestration script
./start-all-services.sh
```

This script will:
1. Start Hyperledger Fabric network
2. Deploy KYC chaincode
3. Start Solana test validator
4. Launch bridge service
5. Start React frontend

#### Manual Service Startup

**1. Hyperledger Fabric**
```bash
cd hyperledger/fabric-samples/test-network
./network.sh up createChannel -c mychannel
./network.sh deployCC -ccn nivix-kyc -ccp ../../chaincode/nivix-kyc -ccl javascript
```

**2. Solana Test Validator**
```bash
solana-test-validator --reset
```

**3. Bridge Service**
```bash
cd bridge-service
npm start
```

**4. Frontend**
```bash
cd frontend/nivix-pay
npm start
```

### Production Deployment

#### Environment Variables
```bash
# Production .env
NODE_ENV=production
PORT=3002
SOLANA_NETWORK=mainnet-beta
FABRIC_WALLET_PATH=/opt/nivix/wallet
FABRIC_CONNECTION_PROFILE=/opt/nivix/fabric/connection.json
DATABASE_URL=postgresql://user:pass@localhost:5432/nivix
REDIS_URL=redis://localhost:6379
```

#### Docker Configuration

**Bridge Service Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["node", "src/index.js"]
```

**Frontend Dockerfile**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
```

#### Docker Compose
```yaml
version: '3.8'
services:
  bridge-service:
    build: ./bridge-service
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend/nivix-pay
    ports:
      - "80:80"
    depends_on:
      - bridge-service

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: nivix
      POSTGRES_USER: nivix
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Solana Program Deployment

#### Build and Deploy
```bash
cd solana/nivix_protocol

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet (production)
anchor deploy --provider.cluster mainnet-beta
```

#### Update Program ID
After deployment, update the program ID in:
- `Anchor.toml`
- `bridge-service/config/nivix_protocol.json`
- Frontend configuration

---

## 🧪 Testing

### Unit Tests

#### Smart Contract Tests
```bash
cd solana/nivix_protocol
anchor test
```

**Example Test:**
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NivixProtocol } from "../target/types/nivix_protocol";

describe("nivix_protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NivixProtocol as Program<NivixProtocol>;

  it("Initializes the platform", async () => {
    const tx = await program.methods
      .initializePlatform()
      .accounts({
        platform: platformPda,
        admin: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const platformAccount = await program.account.platform.fetch(platformPda);
    expect(platformAccount.admin.toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
  });

  it("Processes a transfer", async () => {
    const amount = new anchor.BN(100 * 1000000); // 100 USDC
    
    const tx = await program.methods
      .processTransfer(
        amount,
        "USDC",
        "INR",
        recipientWalletSeed,
        "Test transfer"
      )
      .accounts({
        platform: platformPda,
        user: userPda,
        fromWallet: fromWalletPda,
        toWallet: toWalletPda,
        // ... other accounts
      })
      .rpc();

    // Verify transaction was recorded
    const transactionRecord = await program.account.transactionRecord.fetch(
      transactionRecordPda
    );
    expect(transactionRecord.amount.toString()).to.equal(amount.toString());
  });
});
```

#### Bridge Service Tests
```bash
cd bridge-service
npm test
```

**Example Test:**
```javascript
const request = require('supertest');
const app = require('../src/index');

describe('Bridge Service API', () => {
  test('POST /api/bridge/initiate-transfer', async () => {
    const transferData = {
      fromAddress: '8VyJ4EgKeto2vhVzq2wgwD9GrFz1wcWnGHP97buwxZj2',
      toAddress: '9WzZKhgZNXo3vRrVzMfWgGT1EFm7bQsXdFh26jKwR8k3',
      amount: 100,
      sourceCurrency: 'USDC',
      destinationCurrency: 'INR',
      memo: 'Test transfer'
    };

    const response = await request(app)
      .post('/api/bridge/initiate-transfer')
      .send(transferData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.transaction_id).toBeDefined();
  });

  test('GET /api/kyc/status/:address', async () => {
    const address = '8VyJ4EgKeto2vhVzq2wgwD9GrFz1wcWnGHP97buwxZj2';
    
    const response = await request(app)
      .get(`/api/kyc/status/${address}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.kyc).toBeDefined();
  });
});
```

#### Frontend Tests
```bash
cd frontend/nivix-pay
npm test
```

### Integration Tests

#### End-to-End Transaction Flow
```javascript
describe('Complete Transaction Flow', () => {
  test('User can send money cross-border', async () => {
    // 1. Connect wallet
    await connectWallet();
    
    // 2. Verify KYC status
    const kycStatus = await getKYCStatus(userAddress);
    expect(kycStatus.kycVerified).toBe(true);
    
    // 3. Initiate transfer
    const transfer = await initiateTransfer({
      toAddress: recipientAddress,
      amount: 100,
      sourceCurrency: 'USDC',
      destinationCurrency: 'INR'
    });
    
    // 4. Wait for completion
    await waitForTransactionCompletion(transfer.transaction_id);
    
    // 5. Verify balances updated
    const senderBalance = await getBalance(userAddress, 'USDC');
    const recipientBalance = await getBalance(recipientAddress, 'INR');
    
    expect(senderBalance).toBeLessThan(initialSenderBalance);
    expect(recipientBalance).toBeGreaterThan(initialRecipientBalance);
  });
});
```

### Performance Testing

#### Load Testing Script
```javascript
// test/load-test.js
const { check } = require('k6');
const http = require('k6/http');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const transferData = {
    fromAddress: 'test-address-1',
    toAddress: 'test-address-2',
    amount: 100,
    sourceCurrency: 'USDC',
    destinationCurrency: 'INR',
  };

  const response = http.post(
    'http://localhost:3002/api/bridge/initiate-transfer',
    JSON.stringify(transferData),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/new-payment-gateway
   ```
3. **Make changes and test**
4. **Commit with descriptive messages**
   ```bash
   git commit -m "feat: add support for EUR currency swaps"
   ```
5. **Push and create pull request**

### Code Standards

#### Rust (Smart Contracts)
- Follow Rust naming conventions
- Use `cargo fmt` for formatting
- Run `cargo clippy` for linting
- Document public functions with `///` comments

#### JavaScript/TypeScript
- Use ESLint configuration
- Follow Prettier formatting
- Use meaningful variable names
- Add JSDoc comments for functions

#### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Security Guidelines

1. **Never commit private keys or secrets**
2. **Use environment variables for configuration**
3. **Validate all user inputs**
4. **Implement proper error handling**
5. **Follow blockchain security best practices**

### Testing Requirements

- All new features must include tests
- Maintain minimum 80% code coverage
- Test both success and failure scenarios
- Include integration tests for new APIs

---

## 📚 Additional Resources

### Documentation Links
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Hyperledger Fabric](https://hyperledger-fabric.readthedocs.io/)
- [React Documentation](https://react.dev/)

### Development Tools
- [Solana Explorer](https://explorer.solana.com/)
- [Phantom Wallet](https://phantom.app/)
- [Anchor VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ChainPoint.anchor-lang)

### Community
- [Solana Discord](https://discord.gg/solana)
- [Hyperledger Discord](https://discord.gg/hyperledger)

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

---

## 📞 Support

For technical support or questions:
- Create an issue in the GitHub repository
- Join our Discord community
- Email: dev@nivix.protocol

---

**Built with ❤️ by the Nivix Team**