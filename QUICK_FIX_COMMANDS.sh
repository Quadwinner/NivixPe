#!/bin/bash
# Quick Fix Script for Nivix-KYC Chaincode Deployment
# Run this on your EC2 server

set -e

echo "=========================================="
echo "Nivix-KYC Chaincode Deployment Fix"
echo "=========================================="

# Step 1: Clean everything
echo "Step 1: Cleaning network and Docker..."
cd ~/fabric-samples/test-network-old
./network.sh down
docker volume prune -f
docker rmi $(docker images | grep dev-peer | awk '{print $3}') 2>/dev/null || true
rm -f *.tar.gz

# Step 2: Clean chaincode directory
echo "Step 2: Cleaning chaincode directory..."
cd ~/fabric-samples/test-network-old/chaincode-nivix-kyc
rm -rf vendor node_modules package*.json

# Step 3: Recreate go.mod
echo "Step 3: Recreating go.mod..."
cat > go.mod << 'EOF'
module nivix-kyc

go 1.16

require (
    github.com/hyperledger/fabric-contract-api-go v1.2.1
)
EOF

# Step 4: Update dependencies
echo "Step 4: Updating Go dependencies..."
go clean -modcache
go mod tidy

# Step 5: Set Fabric paths
echo "Step 5: Setting Fabric environment..."
export PATH=~/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=~/fabric-samples/config

# Step 6: Start network
echo "Step 6: Starting Fabric network..."
cd ~/fabric-samples/test-network-old
./network.sh up createChannel -c mychannel

# Wait for network to stabilize
echo "Waiting for network to stabilize..."
sleep 5

# Step 7: Deploy chaincode
echo "Step 7: Deploying chaincode..."
./network.sh deployCC -ccn nivix-kyc -ccp ./chaincode-nivix-kyc -ccl go -ccv 1.0 -ccs 1

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="

# Verify
echo "Verifying deployment..."
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode queryinstalled
peer lifecycle chaincode querycommitted -C mychannel

echo "=========================================="
echo "All Done! Chaincode is deployed."
echo "=========================================="
