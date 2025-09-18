# 🌐 Production Mainnet Configuration

## 🔗 **Blockchain Networks**

### **Solana Mainnet**
```javascript
const solanaConfig = {
  network: 'mainnet-beta',
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  commitment: 'confirmed',
  treasury: {
    publicKey: 'TREASURY_PUBLIC_KEY_PROD',
    privateKey: process.env.SOLANA_TREASURY_PRIVATE_KEY_PROD
  }
};
```

### **Hyperledger Fabric Production**
```yaml
version: '2.0'
services:
  orderer:
    image: hyperledger/fabric-orderer:2.4
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - ORDERER_GENERAL_TLS_ENABLED=true
    ports:
      - "7050:7050"
```

## 💳 **Payment Gateway Production**

### **Cashfree Production**
```javascript
const cashfreeConfig = {
  environment: 'production',
  baseUrl: 'https://payout-api.cashfree.com',
  clientId: process.env.CASHFREE_CLIENT_ID_PROD,
  clientSecret: process.env.CASHFREE_CLIENT_SECRET_PROD
};
```

### **Razorpay Production**
```javascript
const razorpayConfig = {
  environment: 'production',
  keyId: process.env.RAZORPAY_KEY_ID_PROD,
  keySecret: process.env.RAZORPAY_KEY_SECRET_PROD
};
```

## 🗄️ **Database Production**

### **PostgreSQL**
```sql
CREATE DATABASE nivix_production;
CREATE USER nivix_prod_user WITH PASSWORD 'SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE nivix_production TO nivix_prod_user;
```

### **Redis**
```bash
# Redis Production Config
bind 127.0.0.1
port 6379
requirepass "SECURE_REDIS_PASSWORD"
maxmemory 2gb
```

## 🔒 **Security Configuration**

### **SSL/TLS**
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location /api {
        proxy_pass http://localhost:3002;
    }
}
```

### **Firewall**
```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3002/tcp
sudo ufw enable
```

## 📊 **Monitoring**

### **Health Checks**
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      blockchain: 'connected',
      kyc: 'operational',
      payments: 'active'
    }
  });
});
```

### **Logging**
```javascript
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({ filename: '/var/log/nivix/error.log' }),
    new winston.transports.Console()
  ]
});
```

## 🚀 **Deployment**

### **PM2 Configuration**
```javascript
module.exports = {
  apps: [{
    name: 'nivix-backend',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    }
  }]
};
```

## 📋 **Production Checklist**

### **Pre-Deployment**
- [ ] Production keys configured
- [ ] Database schema created
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Monitoring setup

### **Deployment**
- [ ] Code deployed
- [ ] Services started
- [ ] Health checks passing
- [ ] DNS updated

### **Post-Deployment**
- [ ] All endpoints responding
- [ ] Payment gateways working
- [ ] Blockchain integration active
- [ ] Monitoring alerts configured

**🌐 Production mainnet configuration complete!**