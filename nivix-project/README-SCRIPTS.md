# Nivix Protocol - Essential Scripts

This document lists all the essential scripts for managing the Nivix Protocol services.

## 🚀 Main Service Management

### `start-all-services.sh`
**Purpose:** Comprehensive startup script that starts all services in the correct order
- Starts Hyperledger Fabric network
- Deploys KYC chaincode
- Starts Solana local validator
- Deploys Solana program
- Starts Bridge Service
- Starts Frontend

**Usage:**
```bash
./start-all-services.sh
```

### `stop-nivix.sh`
**Purpose:** Cleanly stops all Nivix Protocol services
- Stops Frontend
- Stops Bridge Service
- Stops Hyperledger Fabric network
- Cleans up processes

**Usage:**
```bash
./stop-nivix.sh
```

### `check-status.sh`
**Purpose:** Quick status check for all services
- Shows which services are running
- Displays port information
- Provides quick action commands

**Usage:**
```bash
./check-status.sh
```

## 📊 KYC Management

### `count-kyc.sh`
**Purpose:** Count and analyze KYC records in Hyperledger Fabric
- Shows total KYC records
- Breaks down by verification status
- Shows country and risk score distribution
- Displays sample records

**Usage:**
```bash
./count-kyc.sh
```

### `update-kyc-status.sh`
**Purpose:** Manually update KYC verification status via command line
- Updates KYC verification status
- Records compliance events
- Verifies the update

**Usage:**
```bash
./update-kyc-status.sh <userId> <solanaAddress> <true/false> <reason>
```

**Example:**
```bash
./update-kyc-status.sh "user123" "8VyJ4EgKeto2vhVzq2wgwD9GrFz1wcWnGHP97buwxZj2" true "Manual verification completed"
```

## 🧪 Testing

### `test-kyc.sh`
**Purpose:** Test the complete KYC flow from API to Hyperledger
- Tests bridge service health
- Tests KYC submission
- Tests KYC retrieval
- Verifies Hyperledger storage

**Usage:**
```bash
./test-kyc.sh
```

## 🔧 Utility Scripts

### `scripts/fabric-invoke.sh`
**Purpose:** Helper script for direct Hyperledger Fabric chaincode invocation
- Used by other scripts to interact with chaincode
- Handles both query and invoke operations

**Usage:**
```bash
./scripts/fabric-invoke.sh <function_name> <args_json> <query|invoke>
```

## 📝 Quick Reference

### Start Everything
```bash
./start-all-services.sh
```

### Check Status
```bash
./check-status.sh
```

### View KYC Records
```bash
./count-kyc.sh
```

### Update KYC Status
```bash
./update-kyc-status.sh "user_id" "solana_address" true "reason"
```

### Stop Everything
```bash
./stop-nivix.sh
```

### Test KYC Flow
```bash
./test-kyc.sh
```

## 🗂️ Log Files

All service logs are stored in the `logs/` directory:
- `logs/bridge.log` - Bridge service logs
- `logs/frontend.log` - Frontend logs
- `logs/solana.log` - Solana validator logs

View logs in real-time:
```bash
tail -f logs/bridge.log
tail -f logs/frontend.log
tail -f logs/solana.log
```