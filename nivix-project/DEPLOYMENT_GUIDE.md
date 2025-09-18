# Nivix Protocol - Complete Deployment Guide

This guide covers how to start all services and deploy chaincode from scratch.

## 📋 Prerequisites

### Required Software
- **Docker & Docker Compose** - For Hyperledger Fabric
- **Node.js (v18+)** - For Bridge Service and Frontend
- **Go (v1.19+)** - For Hyperledger Fabric chaincode
- **Solana CLI** - For Solana development
- **Anchor Framework** - For Solana program development

### System Requirements
- **Linux/macOS** (Windows with WSL2)
- **8GB+ RAM**
- **20GB+ free disk space**
- **Internet connection** for downloading dependencies

## 🚀 Quick Start (Automated)

### Option 1: Start Everything at Once
```bash
cd nivix-project
./start-all-services.sh
```

This script automatically:
1. ✅ Starts Hyperledger Fabric network
2. ✅ Deploys KYC chaincode
3. ✅ Starts Solana local validator
4. ✅ Deploys Solana program
5. ✅ Starts Bridge Service
6. ✅ Starts Frontend

### Option 2: Check Status Anytime
```bash
./check-status.sh
```

### Option 3: Stop Everything
```bash
./stop-nivix.sh
```

## 🔧 Manual Step-by-Step Deployment

### Step 1: Start Hyperledger Fabric Network

```bash
# Navigate to Fabric test network
cd hyperledger/fabric-samples/test-network

# Start the network with CA and create channel
./network.sh up createChannel -ca -c mychannel

# Verify network is running
docker ps | grep hyperledger
```

**Expected Output:**
- `orderer.example.com` - Running on port 7050
- `peer0.org1.example.com` - Running on port 7051
- `peer0.org2.example.com` - Running on port 9051

### Step 2: Deploy KYC Chaincode

```bash
# From the test-network directory
./network.sh deployCC \
  -ccn nivix-kyc \
  -ccp ../../../chaincode/nivix-kyc \
  -ccl go \
  -ccep "OR('Org1MSP.peer','Org2MSP.peer')" \
  -cccg ../../../chaincode/nivix-kyc/collections_config.json

# Go back to project root
cd ../../../
```

**Verify Chaincode Deployment:**
```bash
# Test chaincode is working
./scripts/fabric-invoke.sh "QueryAllKYC" "[]" "query"
```

### Step 3: Start Solana Local Validator

```bash
# Navigate to Solana program directory
cd solana/nivix_protocol

# Start local validator (in background)
solana-test-validator --reset --quiet &

# Wait for validator to start
sleep 10

# Verify Solana is running
solana cluster-info
```

### Step 4: Deploy Solana Program

```bash
# Build the program
anchor build

# Deploy to local validator
anchor deploy

# Go back to project root
cd ../../
```

### Step 5: Start Bridge Service

```bash
# Navigate to bridge service
cd bridge-service

# Install dependencies (if needed)
npm install

# Start the service
nohup node src/index.js > ../logs/bridge.log 2>&1 &

# Go back to project root
cd ..
```

**Verify Bridge Service:**
```bash
curl http://localhost:3002/health
```

### Step 6: Start Frontend

```bash
# Navigate to frontend
cd frontend/nivix-pay

# Install dependencies (if needed)
npm install

# Start the frontend
nohup npm start > ../../logs/frontend.log 2>&1 &

# Go back to project root
cd ../../
```

## 🧪 Testing the Deployment

### Test 1: Check All Services
```bash
./check-status.sh
```

**Expected Output:**
```
✓ Hyperledger Fabric Peer (Org1) - Running
✓ Hyperledger Fabric Peer (Org2) - Running  
✓ Hyperledger Fabric Orderer - Running
✓ Solana Local Validator - Running
✓ Bridge Service API - Running
✓ Frontend (Nivix Pay) - Running
```

### Test 2: Test KYC Flow
```bash
./test-kyc.sh
```

### Test 3: Check KYC Records
```bash
./count-kyc.sh
```

### Test 4: Test Bridge Service Health
```bash
curl http://localhost:3002/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-08-29T...",
  "services": {
    "hyperledger": "connected",
    "solana": "connected"
  }
}
```

## 🌐 Access URLs

Once everything is running:

- **Frontend (Nivix Pay)**: http://localhost:3000
- **KYC Admin Dashboard**: http://localhost:3000/kyc-admin
- **Bridge Service API**: http://localhost:3002
- **Bridge Health Check**: http://localhost:3002/health
- **Solana RPC**: http://localhost:8899

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Hyperledger Fabric Won't Start
```bash
# Clean up and restart
cd hyperledger/fabric-samples/test-network
./network.sh down
docker system prune -f
./network.sh up createChannel -ca -c mychannel
```

#### 2. Chaincode Deployment Fails
```bash
# Check if chaincode directory exists
ls -la hyperledger/chaincode/nivix-kyc/

# Rebuild and redeploy
cd hyperledger/fabric-samples/test-network
./network.sh deployCC -ccn nivix-kyc -ccp ../../../chaincode/nivix-kyc -ccl go
```

#### 3. Bridge Service Won't Connect to Fabric
```bash
# Check fabric-invoke script
ls -la scripts/fabric-invoke.sh
chmod +x scripts/fabric-invoke.sh

# Test direct fabric connection
./scripts/fabric-invoke.sh "QueryAllKYC" "[]" "query"
```

#### 4. Solana Validator Issues
```bash
# Kill existing validator
pkill -f solana-test-validator

# Restart with clean state
cd solana/nivix_protocol
solana-test-validator --reset --quiet &
```

#### 5. Port Already in Use
```bash
# Find and kill processes on specific ports
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3002 | xargs kill -9  # Bridge Service
lsof -ti:8899 | xargs kill -9  # Solana
```

### Log Files

Check logs for debugging:
```bash
# Bridge Service logs
tail -f logs/bridge.log

# Frontend logs  
tail -f logs/frontend.log

# Solana validator logs
tail -f logs/solana.log

# Docker logs for Fabric
docker logs peer0.org1.example.com
docker logs orderer.example.com
```

## 📊 Monitoring and Maintenance

### Daily Health Checks
```bash
# Quick status check
./check-status.sh

# Check KYC records count
./count-kyc.sh

# Test API endpoints
curl http://localhost:3002/health
curl http://localhost:8899 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

### Restart Individual Services

#### Restart Bridge Service Only
```bash
lsof -ti:3002 | xargs kill -9
cd bridge-service && nohup node src/index.js > ../logs/bridge.log 2>&1 &
```

#### Restart Frontend Only
```bash
lsof -ti:3000 | xargs kill -9
cd frontend/nivix-pay && nohup npm start > ../../logs/frontend.log 2>&1 &
```

#### Restart Hyperledger Fabric Only
```bash
cd hyperledger/fabric-samples/test-network
./network.sh down
./network.sh up createChannel -ca -c mychannel
./network.sh deployCC -ccn nivix-kyc -ccp ../../../chaincode/nivix-kyc -ccl go
```

## 🔐 Security Notes

### Development Environment
- All services run on localhost
- Default ports are used (3000, 3002, 7050, 7051, 8899)
- No authentication required for local development

### Production Considerations
- Use environment variables for sensitive configuration
- Enable TLS/SSL for all services
- Implement proper authentication and authorization
- Use production-grade databases
- Set up monitoring and alerting
- Configure firewalls and network security

## 📝 Configuration Files

### Key Configuration Files
- `bridge-service/src/index.js` - Bridge service main file
- `hyperledger/chaincode/nivix-kyc/nivix-kyc.go` - KYC chaincode
- `solana/nivix_protocol/programs/nivix_protocol/src/lib.rs` - Solana program
- `frontend/nivix-pay/src/services/apiService.ts` - Frontend API configuration

### Environment Variables
```bash
# Bridge Service
export SOLANA_RPC_URL=http://localhost:8899
export FABRIC_NETWORK_PATH=/path/to/fabric/network

# Frontend
export REACT_APP_API_URL=http://localhost:3002
```

## 🎯 Next Steps

After successful deployment:

1. **Test KYC Flow** - Submit and verify KYC applications
2. **Test Solana Integration** - Send transactions and check balances
3. **Implement Liquidity Pools** - Add USDC/INR/EUR pools
4. **Add Swap Functionality** - Cross-currency exchanges
5. **Integrate Off-ramp** - Bank payout system

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review log files for error messages
3. Ensure all prerequisites are installed
4. Verify network connectivity and ports
5. Try the automated startup script: `./start-all-services.sh`

---

**Happy Deploying! 🚀**