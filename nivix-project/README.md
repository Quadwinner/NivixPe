# Nivix Project - Solana Liquidity Pool System

A comprehensive blockchain system integrating Solana liquidity pools with Hyperledger Fabric KYC compliance.

## 🚀 Quick Start

### Start the System
```bash
./start-nivix.sh
```

### Stop the System
```bash
./stop-nivix.sh
```

## 📊 System Components

- **Hyperledger Fabric**: KYC/AML compliance ledger
- **Solana**: Public liquidity pools and token operations
- **Bridge Service**: REST API connecting frontend to blockchain layers
- **React Frontend**: User interface for pool management and KYC

## 🔧 Manual Commands

### Chaincode Operations
```bash
# Store KYC data
/tmp/fabric-invoke.sh "StoreKYC" '["user_id","solana_address","Full Name","true","2025-09-08T05:00:00Z","3","USA"]' "invoke"

# Query KYC status
/tmp/fabric-invoke.sh "GetKYCStatus" '["solana_address"]' "query"
```

### Bridge Service
```bash
# Health check
curl http://localhost:3002/health

# List pools
curl http://localhost:3002/api/pools

# Submit KYC
curl -X POST http://localhost:3002/api/kyc/submit \
  -H "Content-Type: application/json" \
  -d '{
    "solanaAddress": "TestAddress123",
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "nationality": "USA",
    "documentType": "passport",
    "documentNumber": "TEST123456"
  }'
```

## 📁 Project Structure

```
nivix-project/
├── start-nivix.sh          # Main startup script
├── stop-nivix.sh           # Cleanup script
├── bridge-service/         # Node.js bridge service
│   ├── src/               # Bridge service source code
│   ├── fabric-invoke.sh   # Chaincode invocation script
│   └── logs/              # Service logs
├── frontend/nivix-pay/    # React frontend
├── fabric-samples/        # Hyperledger Fabric network
│   └── test-network/      # Network configuration
├── solana/               # Solana program
└── REPORTS/              # Documentation
```

## 🏗️ Architecture

1. **Frontend (React)** → Bridge Service REST API
2. **Bridge Service** → Solana RPC + Hyperledger Fabric
3. **Hyperledger Fabric** → KYC/AML compliance data
4. **Solana** → Liquidity pools and token operations

## 📝 Logs

- Bridge Service: `tail -f bridge-service/logs/bridge.log`
- Fabric Network: Check Docker containers with `docker ps`

## 🎯 Key Features

- ✅ Multi-currency liquidity pools (EUR, USD, INR, GBP, JPY, CAD, AUD)
- ✅ KYC/AML compliance integration
- ✅ Pool persistence across restarts
- ✅ Real-time token metadata
- ✅ Cross-chain transaction bridging

## 🔗 Endpoints

- Bridge Service: http://localhost:3002
- Health Check: http://localhost:3002/health
- API Documentation: http://localhost:3002/api/

## 🛠️ Troubleshooting

If issues occur:
1. Run `./stop-nivix.sh` to clean up
2. Run `./start-nivix.sh` to restart
3. Check logs in `bridge-service/logs/bridge.log`