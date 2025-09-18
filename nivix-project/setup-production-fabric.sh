#!/bin/bash

# 🏭 Nivix Hyperledger Fabric Production Setup
# One-click deployment for production server

echo "🚀 Setting up Nivix Fabric Production Environment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ Don't run as root! Use sudo when needed.${NC}"
   exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose
echo -e "${YELLOW}🔧 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Install Node.js
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js installed${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed${NC}"
fi

# Install PM2 for process management
echo -e "${YELLOW}⚡ Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# Install Nginx
echo -e "${YELLOW}🌐 Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install nginx -y
    sudo systemctl enable nginx
    echo -e "${GREEN}✅ Nginx installed${NC}"
else
    echo -e "${GREEN}✅ Nginx already installed${NC}"
fi

# Create production directory
echo -e "${YELLOW}📁 Creating production directory...${NC}"
sudo mkdir -p /opt/nivix
sudo chown $USER:$USER /opt/nivix
cd /opt/nivix

# Clone or copy project files
echo -e "${YELLOW}📋 Setting up project files...${NC}"
if [ ! -d "nivix-project" ]; then
    # Copy from current location
    cp -r "/media/shubham/OS/for linux work/blockchain solana/nivix-project" .
    echo -e "${GREEN}✅ Project files copied${NC}"
else
    echo -e "${GREEN}✅ Project files already exist${NC}"
fi

cd nivix-project

# Create production environment file
echo -e "${YELLOW}⚙️ Creating production environment...${NC}"
cat > .env.production << EOF
# Production Environment Variables
NODE_ENV=production
PORT=3002

# Solana Production
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_TREASURY_PRIVATE_KEY=\${SOLANA_TREASURY_PRIVATE_KEY_PROD}

# Hyperledger Fabric Production
FABRIC_NETWORK_PATH=/opt/nivix/fabric-network
FABRIC_WALLET_PATH=/opt/nivix/wallet
FABRIC_CONNECTION_PROFILE=/opt/nivix/fabric/connection.json

# Payment Gateways Production
CASHFREE_CLIENT_ID=\${CASHFREE_CLIENT_ID_PROD}
CASHFREE_CLIENT_SECRET=\${CASHFREE_CLIENT_SECRET_PROD}
CASHFREE_BASE_URL=https://payout-api.cashfree.com

RAZORPAY_KEY_ID=\${RAZORPAY_KEY_ID_PROD}
RAZORPAY_KEY_SECRET=\${RAZORPAY_KEY_SECRET_PROD}

# Database Production
DATABASE_URL=postgresql://nivix_prod:secure_password@localhost:5432/nivix_production
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=\${JWT_SECRET_PROD}
ENCRYPTION_KEY=\${ENCRYPTION_KEY_PROD}
EOF

echo -e "${GREEN}✅ Production environment created${NC}"

# Create PM2 ecosystem file
echo -e "${YELLOW}⚡ Creating PM2 configuration...${NC}"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'nivix-bridge',
      script: 'bridge-service/src/index.js',
      cwd: '/opt/nivix/nivix-project',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_file: '.env.production',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/bridge-error.log',
      out_file: './logs/bridge-out.log',
      log_file: './logs/bridge-combined.log',
      time: true
    },
    {
      name: 'nivix-frontend',
      script: 'serve',
      args: '-s frontend/nivix-pay/build -l 3000',
      cwd: '/opt/nivix/nivix-project',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
EOF

echo -e "${GREEN}✅ PM2 configuration created${NC}"

# Create production Docker Compose for Fabric
echo -e "${YELLOW}🐳 Creating production Fabric Docker Compose...${NC}"
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  orderer.example.com:
    image: hyperledger/fabric-orderer:2.4
    container_name: orderer.example.com
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_GENESISMETHOD=file
      - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
      - ORDERER_GENERAL_TLS_ENABLED=true
      - ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
      - ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_CLUSTER_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric
    command: orderer
    volumes:
      - ./fabric-samples/test-network/organizations/ordererOrganizations:/var/hyperledger/organizations
      - ./fabric-samples/test-network/system-genesis-block:/var/hyperledger/orderer/orderer.genesis.block
      - ./fabric-samples/test-network/channel-artifacts:/var/hyperledger/orderer/channel-artifacts
    ports:
      - "7050:7050"
    networks:
      - fabric-network

  peer0.org1.example.com:
    image: hyperledger/fabric-peer:2.4
    container_name: peer0.org1.example.com
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=fabric-network
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_GOSSIP_SKIPHANDSHAKE=true
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_PEER_TLS_ROOTCERT_FILE=/var/hyperledger/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
      - CORE_PEER_TLS_CERT_FILE=/var/hyperledger/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/var/hyperledger/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.key
      - CORE_PEER_MSPCONFIGPATH=/var/hyperledger/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
      - CORE_PEER_ADDRESS=peer0.org1.example.com:7051
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    volumes:
      - /var/run/:/host/var/run/
      - ./fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp:/var/hyperledger/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp
      - ./fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls:/var/hyperledger/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls
      - peer0_org1_data:/var/hyperledger/production
    ports:
      - "7051:7051"
    depends_on:
      - orderer.example.com
    networks:
      - fabric-network

  peer0.org2.example.com:
    image: hyperledger/fabric-peer:2.4
    container_name: peer0.org2.example.com
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=fabric-network
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_GOSSIP_SKIPHANDSHAKE=true
      - CORE_PEER_LOCALMSPID=Org2MSP
      - CORE_PEER_TLS_ROOTCERT_FILE=/var/hyperledger/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
      - CORE_PEER_TLS_CERT_FILE=/var/hyperledger/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/var/hyperledger/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/server.key
      - CORE_PEER_MSPCONFIGPATH=/var/hyperledger/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
      - CORE_PEER_ADDRESS=peer0.org2.example.com:9051
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    volumes:
      - /var/run/:/host/var/run/
      - ./fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp:/var/hyperledger/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls
      - ./fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls:/var/hyperledger/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls
      - peer0_org2_data:/var/hyperledger/production
    ports:
      - "9051:9051"
    depends_on:
      - orderer.example.com
    networks:
      - fabric-network

volumes:
  peer0_org1_data:
  peer0_org2_data:

networks:
  fabric-network:
    driver: bridge
EOF

echo -e "${GREEN}✅ Production Docker Compose created${NC}"

# Create startup script
echo -e "${YELLOW}🚀 Creating startup script...${NC}"
cat > start-production.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Nivix Production Environment"
echo "========================================"

cd /opt/nivix/nivix-project

# Start Fabric network
echo "🏗️ Starting Hyperledger Fabric..."
cd fabric-samples/test-network
./network.sh up createChannel -ca -c mychannel

# Deploy chaincode
echo "📦 Deploying chaincode..."
./network.sh deployCC -ccn nivix-kyc -ccp ./chaincode-nivix-kyc -ccl go -c mychannel -cccg ./chaincode-nivix-kyc/collections_config.json

# Go back to project root
cd /opt/nivix/nivix-project

# Install dependencies
echo "📦 Installing dependencies..."
cd bridge-service && npm ci --production && cd ..
cd frontend/nivix-pay && npm ci && npm run build && cd ../..

# Start services with PM2
echo "⚡ Starting services with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Production environment started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:3002"
echo "📊 PM2 Status: pm2 status"
EOF

chmod +x start-production.sh

# Create health check script
echo -e "${YELLOW}🔍 Creating health check script...${NC}"
cat > health-check.sh << 'EOF'
#!/bin/bash

echo "🔍 Nivix Production Health Check"
echo "================================"

# Check PM2 processes
echo "📊 PM2 Status:"
pm2 status

# Check Fabric network
echo "🏗️ Fabric Network:"
docker ps | grep hyperledger

# Check services
echo "🌐 Service Health:"
curl -f http://localhost:3002/health 2>/dev/null && echo "✅ Backend healthy" || echo "❌ Backend down"
curl -f http://localhost:3000 2>/dev/null && echo "✅ Frontend healthy" || echo "❌ Frontend down"

# Check logs
echo "📋 Recent Errors:"
pm2 logs --lines 10 --err
EOF

chmod +x health-check.sh

# Create Nginx configuration
echo -e "${YELLOW}🌐 Creating Nginx configuration...${NC}"
sudo tee /etc/nginx/sites-available/nivix << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /opt/nivix/nivix-project/frontend/nivix-pay/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/nivix /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo -e "${GREEN}✅ Nginx configured${NC}"

# Create logs directory
mkdir -p logs

echo -e "${GREEN}🎉 Production setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Set your production environment variables in .env.production"
echo "2. Run: ./start-production.sh"
echo "3. Check health: ./health-check.sh"
echo "4. Access: http://your-server-ip"
echo ""
echo -e "${YELLOW}💰 Estimated Monthly Cost: $30-70${NC}"
echo "- Server: $20-50/month"
echo "- Storage: $10-20/month"
echo ""
echo -e "${GREEN}✅ Ready for production deployment!${NC}"



