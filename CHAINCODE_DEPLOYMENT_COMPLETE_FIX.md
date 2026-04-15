# Nivix-KYC Chaincode Deployment - Complete Fix Guide

## Problem Summary
The chaincode deployment is failing with "invalid UTF-8" error due to corrupted peer database state from multiple failed installation attempts.

## Solution: Complete Network Reset and Clean Deployment

### Step 1: Bring Down Network and Clean Everything

```bash
# Navigate to test-network directory
cd ~/fabric-samples/test-network-old

# Bring down the network completely
./network.sh down

# Remove all Docker volumes (clears peer databases)
docker volume prune -f

# Remove all chaincode Docker images
docker rmi $(docker images | grep dev-peer | awk '{print $3}') 2>/dev/null || true

# Remove any cached chaincode packages
rm -f *.tar.gz

# Stop and remove ALL containers to be safe
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
```

### Step 2: Clean Chaincode Directory

```bash
# Go to chaincode directory
cd ~/fabric-samples/test-network-old/chaincode-nivix-kyc

# Remove all non-Go files
rm -rf vendor node_modules package*.json

# Verify only these files exist:
# - nivix-kyc.go
# - go.mod
# - go.sum
# - README.md
# - collections_config.json
ls -la

# Recreate go.mod with correct configuration
cat > go.mod << 'EOF'
module nivix-kyc

go 1.16

require (
    github.com/hyperledger/fabric-contract-api-go v1.2.1
)
EOF

# Update dependencies
go clean -modcache
go mod tidy

# Verify the Go file compiles
go build nivix-kyc.go
rm -f nivix-kyc  # Remove the compiled binary
```

### Step 3: Update Fabric Binaries Path

```bash
# Set environment to use Fabric 2.5 binaries
export PATH=~/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=~/fabric-samples/config

# Verify Fabric version (should show 2.5.x)
peer version

# Add to .bashrc for persistence
echo 'export PATH=~/fabric-samples/bin:$PATH' >> ~/.bashrc
echo 'export FABRIC_CFG_PATH=~/fabric-samples/config' >> ~/.bashrc
```

### Step 4: Start Fresh Network

```bash
# Navigate to test-network
cd ~/fabric-samples/test-network-old

# Start network and create channel
./network.sh up createChannel -c mychannel

# Wait for network to be fully up
sleep 5

# Verify network is running
docker ps
```

### Step 5: Deploy Chaincode

```bash
# Deploy chaincode with version 1.0, sequence 1
./network.sh deployCC -ccn nivix-kyc -ccp ./chaincode-nivix-kyc -ccl go -ccv 1.0 -ccs 1
```

## Expected Output

If successful, you should see:
```
Chaincode is packaged
Installing chaincode on peer0.org1...
Chaincode is installed on peer0.org1
Installing chaincode on peer0.org2...
Chaincode is installed on peer0.org2
Querying chaincode definition on peer0.org1...
Chaincode definition committed on channel 'mychannel'
```

## Verification Commands

```bash
# Set environment for Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Query installed chaincodes
peer lifecycle chaincode queryinstalled

# Query committed chaincodes
peer lifecycle chaincode querycommitted -C mychannel
```

## Alternative: If UTF-8 Error Persists

If the error still occurs, the issue might be in the chaincode source file itself. Try this:

```bash
cd ~/fabric-samples/test-network-old/chaincode-nivix-kyc

# Create a minimal test chaincode to verify the system works
cat > test-chaincode.go << 'EOF'
package main

import (
    "fmt"
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
    contractapi.Contract
}

func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
    return nil
}

func (s *SmartContract) Test(ctx contractapi.TransactionContextInterface) (string, error) {
    return "Hello from chaincode", nil
}

func main() {
    chaincode, err := contractapi.NewChaincode(&SmartContract{})
    if err != nil {
        fmt.Printf("Error creating chaincode: %s", err.Error())
        return
    }
    if err := chaincode.Start(); err != nil {
        fmt.Printf("Error starting chaincode: %s", err.Error())
    }
}
EOF

# Rename original chaincode
mv nivix-kyc.go nivix-kyc.go.original

# Use test chaincode
mv test-chaincode.go nivix-kyc.go

# Try deployment
cd ~/fabric-samples/test-network-old
./network.sh down
./network.sh up createChannel -c mychannel
./network.sh deployCC -ccn test-kyc -ccp ./chaincode-nivix-kyc -ccl go -ccv 1.0 -ccs 1
```

If the test chaincode works, the issue is in the original nivix-kyc.go file encoding.

## Troubleshooting

### Check Docker Logs
```bash
# Check peer logs
docker logs peer0.org1.example.com

# Check orderer logs
docker logs orderer.example.com
```

### Check Chaincode Container Logs
```bash
# List chaincode containers
docker ps -a | grep dev-peer

# Check logs (replace with actual container name)
docker logs <chaincode-container-name>
```

### Network Status
```bash
# Check all containers are running
docker ps

# Should see:
# - peer0.org1.example.com
# - peer0.org2.example.com
# - orderer.example.com
# - ca_org1
# - ca_org2
# - ca_orderer
```

## Next Steps After Successful Deployment

1. Test chaincode invocation
2. Set up application to interact with chaincode
3. Configure Nginx reverse proxy
4. Set up SSL certificates
5. Deploy frontend application

## Important Notes

- Always use `./network.sh down` before restarting
- The UTF-8 error is usually caused by corrupted peer database
- Fabric 2.5 ccenv image has Go 1.22 which supports modern Go modules
- Keep chaincode directory clean (only .go, go.mod, go.sum files)
