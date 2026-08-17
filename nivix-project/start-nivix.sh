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

# Chaincode / CCaaS settings.
#
# The chaincode runs as a Chaincode-as-a-Service (ccaas) container rather than
# being built by the peer. The peer-side Docker build fails on Docker Engine 29+
# because the peer speaks an API version the daemon no longer accepts.
# See reports/04_KNOWN_ISSUE_FABRIC_CHAINCODE_DOCKER_BUILD.md
CC_NAME="nivix-kyc"
CC_VERSION="1.0"
CCAAS_PORT=9999
CC_SRC_PATH="./chaincode-${CC_NAME}"
NETWORK_DIR="${PROJECT_ROOT}/fabric-samples/test-network"

# Set FORCE_RESET=true to deliberately wipe the network and ledger.
# Default is a non-destructive restart that preserves committed KYC records.
FORCE_RESET="${FORCE_RESET:-false}"

setup_peer_env() {
    export FABRIC_CFG_PATH="${PROJECT_ROOT}/fabric-samples/config"
    export PATH="${PROJECT_ROOT}/fabric-samples/bin:$PATH"
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID=Org1MSP
    export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem"
    export CORE_PEER_ADDRESS=localhost:7051
}

fabric_running() {
    docker ps --format '{{.Names}}' | grep -qx 'peer0.org1.example.com' &&
    docker ps --format '{{.Names}}' | grep -qx 'peer0.org2.example.com' &&
    docker ps --format '{{.Names}}' | grep -qx 'orderer.example.com'
}

chaincode_committed() {
    setup_peer_env
    peer lifecycle chaincode querycommitted \
        --channelID mychannel --name "$CC_NAME" >/dev/null 2>&1
}

installed_package_id() {
    setup_peer_env
    peer lifecycle chaincode queryinstalled --output json 2>/dev/null |
        jq -r --arg label "${CC_NAME}_${CC_VERSION}" \
            'try (.installed_chaincodes[] | select(.label==$label) | .package_id) // empty' |
        head -1
}

ccaas_image_exists() {
    docker image inspect "${CC_NAME}_ccaas_image:latest" >/dev/null 2>&1
}

build_ccaas_image() {
    echo "🐳 Building chaincode-as-a-service image..."
    docker build -f "${CC_SRC_PATH}/Dockerfile" \
        -t "${CC_NAME}_ccaas_image:latest" \
        --build-arg CC_SERVER_PORT=${CCAAS_PORT} \
        "${CC_SRC_PATH}"
}

# Start the two chaincode server containers if they are not already up.
# They are run with --rm, so they never survive a reboot or Docker restart and
# must be recreated on every startup even when the ledger is intact.
ensure_ccaas_containers() {
    local pkg_id="$1"

    if [ -z "$pkg_id" ]; then
        echo "❌ No installed package id found for ${CC_NAME}_${CC_VERSION}"
        return 1
    fi

    ccaas_image_exists || build_ccaas_image

    local org name
    for org in 1 2; do
        name="peer0org${org}_${CC_NAME}_ccaas"
        if docker ps --format '{{.Names}}' | grep -qx "$name"; then
            echo "✅ $name already running"
            continue
        fi
        docker rm -f "$name" >/dev/null 2>&1 || true
        docker run --rm -d --name "$name" \
            --network fabric_test \
            -e CHAINCODE_SERVER_ADDRESS=0.0.0.0:${CCAAS_PORT} \
            -e CHAINCODE_ID="$pkg_id" \
            -e CORE_CHAINCODE_ID_NAME="$pkg_id" \
            "${CC_NAME}_ccaas_image:latest" >/dev/null
        echo "✅ Started $name"
    done
}

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

# Decide whether to reuse the running network or create a fresh one.
#
# `network.sh down` deletes the ledger, which destroys every committed KYC
# record. Reuse the network whenever it is already healthy so that a routine
# restart is non-destructive.
REUSE_NETWORK=false
if [ "$FORCE_RESET" != "true" ] && fabric_running; then
    if chaincode_committed; then
        REUSE_NETWORK=true
        echo "✅ Fabric network is already up with '${CC_NAME}' committed - reusing it (ledger preserved)"
    else
        echo "ℹ️  Fabric network is up but '${CC_NAME}' is not committed - will deploy chaincode"
        REUSE_NETWORK=true
    fi
fi

if [ "$REUSE_NETWORK" = false ]; then
    if [ "$FORCE_RESET" = "true" ]; then
        echo "⚠️  FORCE_RESET=true - tearing down the network. THIS DELETES THE LEDGER."
    else
        echo "🆕 No healthy Fabric network found - creating a fresh one"
    fi

    # Clean up any stale containers and networks
    echo "🧹 Cleaning up stale Docker resources..."
    docker container prune -f 2>/dev/null || true
    docker network prune -f 2>/dev/null || true

    ./network.sh down 2>/dev/null || true
    sleep 2
    ./network.sh up createChannel -ca -c mychannel
fi

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

# If the definition is already committed, the ledger survived the restart and
# only the chaincode server containers need to come back up. Re-running
# deployCCAAS in that case would pointlessly bump the chaincode sequence.
if chaincode_committed; then
    echo "✅ Chaincode '${CC_NAME}' already committed on mychannel - skipping deploy"
    ensure_ccaas_containers "$(installed_package_id)" || {
        echo "❌ Could not start chaincode server containers"
        exit 1
    }
else
    # Clean up old chaincode packages
    rm -f "${CC_NAME}.tar.gz" 2>/dev/null || true

    echo "Deploying chaincode as a service (ccaas)..."
    if ./network.sh deployCCAAS \
        -ccn "$CC_NAME" \
        -ccp "$CC_SRC_PATH" \
        -ccv "$CC_VERSION" \
        -c mychannel \
        -cccg "${CC_SRC_PATH}/collections_config.json" 2>&1 | tee /tmp/deploy.log &&
        grep -q "Chaincode definition committed on channel" /tmp/deploy.log; then
        echo "✅ Chaincode deployed successfully!"
    else
        echo "❌ Chaincode deployment failed - see /tmp/deploy.log"
        echo "📝 KYC writes will fall back to local storage and will NOT appear in the KYC admin ledger search"
    fi
fi

# Give the chaincode servers a moment to register with the peers
sleep 3

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
cd "$PROJECT_ROOT"

# Verify each component for real rather than assuming. The previous version
# printed "Chaincode: DEPLOYED" unconditionally, which hid a broken chaincode
# deployment behind a healthy-looking startup summary.
ALL_OK=true

if curl -s --max-time 5 http://localhost:3002/health > /dev/null; then
    echo "✅ Bridge service: HEALTHY"
else
    echo "❌ Bridge service: NOT RESPONDING"
    ALL_OK=false
fi

if fabric_running; then
    echo "✅ Hyperledger Fabric: RUNNING"
else
    echo "❌ Hyperledger Fabric: NOT RUNNING"
    ALL_OK=false
fi

cd "$NETWORK_DIR"
if chaincode_committed; then
    echo "✅ Chaincode: COMMITTED on mychannel"
else
    echo "❌ Chaincode: NOT COMMITTED"
    ALL_OK=false
fi

CCAAS_UP=$(docker ps --format '{{.Names}}' | grep -c "_${CC_NAME}_ccaas" || true)
if [ "$CCAAS_UP" -eq 2 ]; then
    echo "✅ Chaincode servers: 2/2 running"
else
    echo "❌ Chaincode servers: ${CCAAS_UP}/2 running"
    ALL_OK=false
fi

# End-to-end read proves the peers can actually reach the chaincode servers.
cd "$PROJECT_ROOT"
if /tmp/fabric-invoke.sh "GetKYCStatus" '["CauHK3m4DRTe6yPrBTDYQrzSvjsi8xN6BhppkZLCuZv9"]' "query" >/dev/null 2>&1; then
    echo "✅ Chaincode query: WORKING"
else
    echo "⚠️  Chaincode query returned no record (fine if the ledger is fresh)"
fi

if [ "$ALL_OK" = true ]; then
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
    echo ""
    echo "⚠️  NIVIX STARTED WITH PROBLEMS - see the failed checks above"
    echo "📝 Bridge logs:    tail -20 bridge-service/logs/bridge.log"
    echo "📝 Deploy log:     tail -40 /tmp/deploy.log"
    echo "📝 Chaincode logs: docker logs peer0org1_${CC_NAME}_ccaas"
    exit 1
fi






