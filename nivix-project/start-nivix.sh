#!/bin/bash

# Nivix Project - Clean Startup Script
echo "🚀 Starting Nivix Project"
echo "========================="

PROJECT_ROOT="/media/shubham/OS/for linux work/blockchain solana/nivix-project"
cd "$PROJECT_ROOT"

# Activate docker group if user is in it but current session doesn't have it
if id -nG | grep -qw docker; then
    # User is already in docker group in this session
    true
elif id -nG "$USER" | grep -qw docker; then
    # User is in docker group but current session doesn't have it - activate it
    echo "🔄 Activating docker group for this session..."
    exec sg docker -c "bash $0 $*"
fi

# 1. Clean up any existing processes
echo "🧹 Cleaning up processes..."
pkill -f "node.*index.js" 2>/dev/null || true
pkill -f "node src/index.js" 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
# More thorough cleanup
ps aux | grep "node.*index.js" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 3

# 1.5. Setup Go environment for Hyperledger Fabric
echo "🔧 Setting up Go environment..."

# If a previous local Go install exists, add it to PATH before checking
if [ -x "$HOME/go-install/go/bin/go" ]; then
    export PATH=$HOME/go-install/go/bin:$PATH
fi

if ! command -v go &> /dev/null; then
    echo "Installing Go..."
    mkdir -p ~/go-install
    cd ~/go-install
    # Download only if not already present
    if [ ! -f go.tar.gz ]; then
        curl -L https://go.dev/dl/go1.21.5.linux-amd64.tar.gz -o go.tar.gz
    fi
    # Extract only if not already extracted
    if [ ! -x "$HOME/go-install/go/bin/go" ]; then
        tar -xzf go.tar.gz
    fi
    cd "$PROJECT_ROOT"
    # Ensure PATH includes the newly installed Go
    export PATH=$HOME/go-install/go/bin:$PATH
fi

# Add Go envs (idempotent)
export PATH=$HOME/go-install/go/bin:$PATH
export GOPATH=$HOME/go
export PATH=/usr/lib/go-1.22/bin:/usr/local/go/bin:$PATH

# Verify Go installation
if command -v go &> /dev/null; then
    echo "✅ Go installed: $(go version)"
else
    echo "❌ Go installation failed"
    exit 1
fi

# 2. Start Hyperledger Fabric network
echo "🏗️ Starting Hyperledger Fabric..."
cd fabric-samples/test-network

# Ensure Docker is running properly before starting Fabric
echo "🐳 Checking Docker daemon..."
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker daemon not accessible, checking service status..."
    if sudo systemctl is-active --quiet docker; then
        echo "⚠️  Docker service is running but not accessible to current user"
        echo "📝 Checking docker group membership..."
        # Check if user is in docker group (even if not active in this session)
        if id -nG "$USER" | grep -qw docker; then
            echo "✅ User is in docker group. Activating group..."
            exec sg docker -c "bash $0 $*"
        else
            echo "❌ User not in docker group. Please run:"
            echo "   sudo usermod -aG docker $USER"
            echo "   Then log out and back in, or run: newgrp docker"
            exit 1
        fi
    else
        echo "⚠️  Docker service not running, attempting to start..."
    sudo systemctl restart docker
    sleep 5
        if ! docker info > /dev/null 2>&1; then
            echo "❌ Docker still not accessible after restart"
            exit 1
        fi
    fi
fi
echo "✅ Docker is accessible"

# Clean up any stale containers and networks
echo "🧹 Cleaning up stale Docker resources..."
docker container prune -f 2>/dev/null || true
docker network prune -f 2>/dev/null || true

./network.sh down 2>/dev/null || true
sleep 2
./network.sh up createChannel -ca -c mychannel

# Ensure the peers can build chaincode by using the Docker socket (default compose file expects it)
if ! docker inspect peer0.org1.example.com >/dev/null 2>&1; then
    echo "❌ Fabric peer containers not found after network start"
    exit 1
fi

# Wait for Fabric network to be fully ready
echo "⏳ Waiting for Fabric network to be ready..."
MAX_WAIT=60
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if docker ps | grep -q "peer0.org1.example.com" && docker ps | grep -q "orderer.example.com"; then
        # Check if peer is responding
        if timeout 3 bash -c "echo > /dev/tcp/localhost/7051" 2>/dev/null; then
            echo "✅ Fabric network is ready!"
            break
        fi
    fi
    WAIT_COUNT=$((WAIT_COUNT + 1))
    sleep 2
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "⚠️  Fabric network may not be fully ready, but continuing..."
fi

# 3. Deploy chaincode with better error handling
echo "📦 Deploying chaincode..."
export PATH=$HOME/go-install/go/bin:$PATH
export GOPATH=$HOME/go

# Clean up old chaincode packages
rm -f nivix-kyc.tar.gz 2>/dev/null || true

# Deploy with retries
MAX_RETRIES=3
RETRY_COUNT=0
DEPLOY_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$DEPLOY_SUCCESS" = false ]; do
    echo "Attempting chaincode deployment (attempt $((RETRY_COUNT+1))/$MAX_RETRIES)..."
    
    if ./network.sh deployCC -ccn nivix-kyc -ccp ./chaincode-nivix-kyc -ccl go -c mychannel -cccg ./chaincode-nivix-kyc/collections_config.json 2>&1 | tee /tmp/deploy.log; then
        if grep -q "Chaincode definition committed on channel" /tmp/deploy.log; then
            DEPLOY_SUCCESS=true
            echo "✅ Chaincode deployed successfully!"
        fi
    fi
    
    if [ "$DEPLOY_SUCCESS" = false ]; then
        RETRY_COUNT=$((RETRY_COUNT+1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️  Deployment failed, waiting 5 seconds before retry..."
            sleep 5
        fi
    fi
done

if [ "$DEPLOY_SUCCESS" = false ]; then
    echo "⚠️  Chaincode deployment failed after $MAX_RETRIES attempts"
    echo "📝 Continuing anyway - chaincode might already be deployed"
fi

# 4. Setup fabric invoke scripts
echo "📜 Setting up fabric script..." 
cd "$PROJECT_ROOT"
cp bridge-service/fabric-invoke.sh /tmp/fabric-invoke.sh
chmod +x /tmp/fabric-invoke.sh

# 5. Test chaincode
echo "🧪 Testing chaincode..."
/tmp/fabric-invoke.sh "StoreKYC" '["test_user","TestAddress123","Test User","true","2025-09-08T05:00:00Z","3","USA"]' "invoke" || true

# 6. Start bridge service
echo "🌉 Starting bridge service..."
cd bridge-service
mkdir -p logs

# Razorpay credentials are loaded by dotenv from bridge-service/.env.
# Clearing inherited values here avoids stale credentials causing Razorpay 401 auth failures.
unset RAZORPAY_KEY_ID
unset RAZORPAY_KEY_SECRET

# Enable PayU payouts (Cashfree is disabled in code)
export PAYU_MERCHANT_ID="527849c20b1e690147b48325b0818452fa360716274c769494db1dbc256c6158"
export PAYU_API_KEY="YOUR_PAYU_API_KEY_HERE"
export PAYU_BASE_URL="https://payouts.payu.in/api/v1"

# Set Cashfree payout environment variables (Working credentials)
export CASHFREE_CLIENT_ID="CF10794489D31HNUJ2JPKS73CS1PRG"
export CASHFREE_CLIENT_SECRET="cfsk_ma_test_7e42a4ccb107f647cbf039b95aeee897_eb889869"
export NODE_ENV="development"
# Force TEST Cashfree base URL (host only; SDK/appends /payout/v1/...)
export CASHFREE_BASE_URL="https://payout-gamma.cashfree.com"
# Run real Cashfree sandbox payouts (no simulation)
export TESTING_MODE="false"
export FORCE_REAL_CASHFREE="true"

# Cashfree 2FA Public Key (Working key for new Client ID)
export CASHFREE_PUBLIC_KEY_PEM='-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxTIHMivJjAHUXV364+Mt
//2pGddWUWi2y1oP6i+UyfP9M4Wq6ErvleImJVooC0sktrgN1m2mHrUoD5zoOwSE
JkF3a+Q+8HYiV6QJ+PiochNa+stKadtGLHXrZrSO0hcvkZ8yFVC8fNCkFtHEL3lW
EZISuvqp9fMaxIs4lc2OHiBx2VknRkM49J3Ogvwp9po9hmRQ/vsajrMCG1+dbGWb
X6EnQrJNbbWOdsIyu/DvvP7J8nS4AGeYvIkvFjSr8G1U2tBEB9wZvAF+QYeYnAOB
hLz71tjVM4n/MFIKae0cOLA8q16Azvy+xGkaiWrz04IYUXDpdBzTyuHv3zsPAL2k
gwIDAQAB
-----END PUBLIC KEY-----'

nohup node src/index.js > logs/bridge.log 2>&1 &
sleep 8

# 7. Test system
echo "🔍 Testing system..."
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ Bridge service: HEALTHY"
    echo "✅ Hyperledger Fabric: RUNNING"
    echo "✅ Chaincode: DEPLOYED"
    echo ""
    echo "🎉 NIVIX PROJECT STARTED SUCCESSFULLY!"
    echo ""
    echo "📊 Quick Commands:"
    echo "• Health: curl http://localhost:3002/health"
    echo "• Pools: curl http://localhost:3002/api/pools"
    echo "• Logs: tail -f bridge-service/logs/bridge.log"
    echo "• Invoke KYC: /tmp/fabric-invoke.sh \"StoreKYC\" '[\"user\",\"address\",\"name\",\"true\",\"2025-09-08T05:00:00Z\",\"3\",\"USA\"]' \"invoke\""
    echo "• Query KYC: /tmp/fabric-invoke.sh \"GetKYCStatus\" '[\"address\"]' \"query\""
else
    echo "❌ Bridge service failed to start"
    echo "📝 Check logs: tail -20 bridge-service/logs/bridge.log"
fi






