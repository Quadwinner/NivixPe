#!/bin/bash

# Manual Chaincode Deployment Script for Nivix KYC
echo "🔧 Manual Chaincode Deployment for Nivix KYC"
echo "=============================================="

PROJECT_ROOT="/media/OS/for linux work/blockchain solana/nivix-project"
cd "$PROJECT_ROOT/fabric-samples/test-network"

# Setup Go environment
export PATH=$HOME/go-install/go/bin:$PATH
export GOPATH=$HOME/go
export FABRIC_CFG_PATH=$PWD/../config/
export PATH=${PWD}/../bin:$PATH

echo "📍 Current directory: $(pwd)"
echo "📦 Go version: $(go version)"

# Check if network is running
if ! docker ps | grep -q "peer0.org1.example.com"; then
    echo "❌ Fabric network is not running!"
    echo "Please start the network first with: ./network.sh up createChannel -ca -c mychannel"
    exit 1
fi

echo "✅ Fabric network is running"

# Clean up old packages
echo "🧹 Cleaning up old packages..."
rm -f nivix-kyc.tar.gz 2>/dev/null || true

# Step 1: Package the chaincode
echo ""
echo "📦 Step 1: Packaging chaincode..."
peer lifecycle chaincode package nivix-kyc.tar.gz \
    --path ./chaincode-nivix-kyc \
    --lang golang \
    --label nivix-kyc_1.0

if [ $? -eq 0 ]; then
    echo "✅ Chaincode packaged successfully"
else
    echo "❌ Chaincode packaging failed"
    exit 1
fi

# Step 2: Install on Org1
echo ""
echo "📥 Step 2: Installing chaincode on Org1..."
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode install nivix-kyc.tar.gz

if [ $? -eq 0 ]; then
    echo "✅ Chaincode installed on Org1"
else
    echo "❌ Chaincode installation on Org1 failed"
    exit 1
fi

# Step 3: Install on Org2
echo ""
echo "📥 Step 3: Installing chaincode on Org2..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode install nivix-kyc.tar.gz

if [ $? -eq 0 ]; then
    echo "✅ Chaincode installed on Org2"
else
    echo "❌ Chaincode installation on Org2 failed"
    exit 1
fi

# Step 4: Query installed chaincode to get package ID
echo ""
echo "🔍 Step 4: Getting package ID..."
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep nivix-kyc_1.0 | awk '{print $3}' | sed 's/,$//')

if [ -z "$PACKAGE_ID" ]; then
    echo "❌ Could not get package ID"
    exit 1
fi

echo "✅ Package ID: $PACKAGE_ID"

# Step 5: Approve for Org1
echo ""
echo "✅ Step 5: Approving chaincode for Org1..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID mychannel \
    --name nivix-kyc \
    --version 1.0 \
    --package-id $PACKAGE_ID \
    --sequence 1 \
    --tls \
    --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --collections-config ./chaincode-nivix-kyc/collections_config.json

if [ $? -eq 0 ]; then
    echo "✅ Chaincode approved for Org1"
else
    echo "❌ Chaincode approval for Org1 failed"
    exit 1
fi

# Step 6: Approve for Org2
echo ""
echo "✅ Step 6: Approving chaincode for Org2..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID mychannel \
    --name nivix-kyc \
    --version 1.0 \
    --package-id $PACKAGE_ID \
    --sequence 1 \
    --tls \
    --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --collections-config ./chaincode-nivix-kyc/collections_config.json

if [ $? -eq 0 ]; then
    echo "✅ Chaincode approved for Org2"
else
    echo "❌ Chaincode approval for Org2 failed"
    exit 1
fi

# Step 7: Check commit readiness
echo ""
echo "🔍 Step 7: Checking commit readiness..."
peer lifecycle chaincode checkcommitreadiness \
    --channelID mychannel \
    --name nivix-kyc \
    --version 1.0 \
    --sequence 1 \
    --tls \
    --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --collections-config ./chaincode-nivix-kyc/collections_config.json \
    --output json

# Step 8: Commit chaincode definition
echo ""
echo "🚀 Step 8: Committing chaincode definition..."
peer lifecycle chaincode commit \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID mychannel \
    --name nivix-kyc \
    --version 1.0 \
    --sequence 1 \
    --tls \
    --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    --collections-config ./chaincode-nivix-kyc/collections_config.json

if [ $? -eq 0 ]; then
    echo "✅ Chaincode committed successfully!"
else
    echo "❌ Chaincode commit failed"
    exit 1
fi

# Step 9: Query committed chaincode
echo ""
echo "🔍 Step 9: Verifying deployment..."
peer lifecycle chaincode querycommitted \
    --channelID mychannel \
    --name nivix-kyc \
    --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

echo ""
echo "🎉 Chaincode deployment completed successfully!"
echo "You can now test with:"
echo "  /tmp/fabric-invoke.sh \"StoreKYC\" '[\"user\",\"address\",\"name\",\"true\",\"2025-09-08T05:00:00Z\",\"3\",\"USA\"]' \"invoke\""



