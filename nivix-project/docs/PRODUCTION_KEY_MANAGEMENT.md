# 🔐 Production Key Management Guide

## 🎯 **Overview**
This guide covers secure key management for production deployment of the Nivix crypto-to-fiat payment platform.

---

## 🔑 **Key Types & Management**

### **1. Payment Gateway Keys**

#### **Cashfree Production Keys**
```bash
# Environment Variables
CASHFREE_CLIENT_ID_PROD="CF_PROD_CLIENT_ID"
CASHFREE_CLIENT_SECRET_PROD="CF_PROD_SECRET"
CASHFREE_BASE_URL_PROD="https://payout-api.cashfree.com"
CASHFREE_WEBHOOK_SECRET_PROD="PROD_WEBHOOK_SECRET"
CASHFREE_PUBLIC_KEY_PEM_PROD="-----BEGIN PUBLIC KEY-----..."

# Key Rotation Schedule
# - Client ID: Never changes
# - Client Secret: Rotate every 90 days
# - Webhook Secret: Rotate every 180 days
```

#### **Razorpay Production Keys**
```bash
# Environment Variables
RAZORPAY_KEY_ID_PROD="rzp_live_PROD_KEY"
RAZORPAY_KEY_SECRET_PROD="PROD_SECRET"
RAZORPAY_WEBHOOK_SECRET_PROD="PROD_WEBHOOK_SECRET"

# Key Rotation Schedule
# - Key ID: Never changes
# - Key Secret: Rotate every 90 days
# - Webhook Secret: Rotate every 180 days
```

### **2. Blockchain Keys**

#### **Solana Treasury Keypair**
```bash
# Production Treasury Wallet
SOLANA_TREASURY_PRIVATE_KEY_PROD="[ENCRYPTED_PRIVATE_KEY]"
SOLANA_TREASURY_PUBLIC_KEY_PROD="TREASURY_PUBLIC_KEY"
SOLANA_NETWORK_PROD="mainnet-beta"

# Security Notes
# - Private key must be encrypted at rest
# - Never store in plain text
# - Use hardware security module (HSM) if possible
# - Backup in secure, offline location
```

#### **Hyperledger Fabric Keys**
```bash
# Fabric Network Keys
FABRIC_CA_CERT_PATH_PROD="/opt/fabric/ca-cert.pem"
FABRIC_USER_CERT_PATH_PROD="/opt/fabric/user-cert.pem"
FABRIC_USER_KEY_PATH_PROD="/opt/fabric/user-key.pem"
FABRIC_MSP_PATH_PROD="/opt/fabric/msp"

# Key Management
# - Certificates managed by Fabric CA
# - Automatic renewal before expiration
# - Secure storage in MSP directory
```

### **3. Database Keys**

#### **Database Credentials**
```bash
# Production Database
DB_HOST_PROD="prod-db-cluster.amazonaws.com"
DB_PORT_PROD="5432"
DB_NAME_PROD="nivix_production"
DB_USER_PROD="nivix_prod_user"
DB_PASSWORD_PROD="[ENCRYPTED_PASSWORD]"
DB_SSL_PROD="require"

# Security Requirements
# - Password must be encrypted
# - Use connection pooling
# - Enable SSL/TLS
# - Regular password rotation
```

### **4. API Keys**

#### **External Service Keys**
```bash
# KYC Service Keys
KYC_PROVIDER_API_KEY_PROD="[ENCRYPTED_KYC_KEY]"
KYC_PROVIDER_SECRET_PROD="[ENCRYPTED_KYC_SECRET]"

# Monitoring Service Keys
SENTRY_DSN_PROD="https://[SENTRY_KEY]@sentry.io/[PROJECT_ID]"
NEW_RELIC_LICENSE_KEY_PROD="[ENCRYPTED_NR_KEY]"

# Email Service Keys
SENDGRID_API_KEY_PROD="[ENCRYPTED_SG_KEY]"
SMTP_PASSWORD_PROD="[ENCRYPTED_SMTP_PASS]"
```

---

## 🔒 **Security Best Practices**

### **Key Storage**

#### **Environment Variables**
```bash
# Production .env file (NEVER commit to git)
# File: .env.production
NODE_ENV=production
PORT=3002

# Payment Gateways
CASHFREE_CLIENT_ID_PROD=${CASHFREE_CLIENT_ID_PROD}
CASHFREE_CLIENT_SECRET_PROD=${CASHFREE_CLIENT_SECRET_PROD}
RAZORPAY_KEY_ID_PROD=${RAZORPAY_KEY_ID_PROD}
RAZORPAY_KEY_SECRET_PROD=${RAZORPAY_KEY_SECRET_PROD}

# Blockchain
SOLANA_TREASURY_PRIVATE_KEY_PROD=${SOLANA_TREASURY_PRIVATE_KEY_PROD}
SOLANA_NETWORK_PROD=mainnet-beta

# Database
DB_HOST_PROD=${DB_HOST_PROD}
DB_PASSWORD_PROD=${DB_PASSWORD_PROD}

# Security
JWT_SECRET_PROD=${JWT_SECRET_PROD}
ENCRYPTION_KEY_PROD=${ENCRYPTION_KEY_PROD}
```

#### **Secrets Management**
```bash
# Using AWS Secrets Manager
aws secretsmanager create-secret \
  --name "nivix/production/cashfree" \
  --description "Cashfree production credentials" \
  --secret-string '{"clientId":"CF_PROD_ID","clientSecret":"CF_PROD_SECRET"}'

# Using HashiCorp Vault
vault kv put secret/nivix/production \
  cashfree_client_id="CF_PROD_ID" \
  cashfree_client_secret="CF_PROD_SECRET" \
  razorpay_key_id="rzp_live_KEY" \
  razorpay_key_secret="PROD_SECRET"
```

### **Key Rotation**

#### **Automated Rotation Script**
```bash
#!/bin/bash
# rotate-keys.sh

echo "🔄 Starting key rotation process..."

# 1. Generate new keys
echo "📝 Generating new keys..."
NEW_CASHFREE_SECRET=$(openssl rand -base64 32)
NEW_RAZORPAY_SECRET=$(openssl rand -base64 32)
NEW_JWT_SECRET=$(openssl rand -base64 64)

# 2. Update in secrets manager
echo "🔐 Updating secrets manager..."
aws secretsmanager update-secret \
  --secret-id "nivix/production/cashfree" \
  --secret-string "{\"clientSecret\":\"$NEW_CASHFREE_SECRET\"}"

# 3. Update environment variables
echo "🌍 Updating environment variables..."
export CASHFREE_CLIENT_SECRET_PROD="$NEW_CASHFREE_SECRET"
export RAZORPAY_KEY_SECRET_PROD="$NEW_RAZORPAY_SECRET"

# 4. Restart services
echo "🔄 Restarting services..."
pm2 restart nivix-backend

# 5. Verify health
echo "🏥 Verifying health..."
curl -f http://localhost:3002/health || exit 1

echo "✅ Key rotation complete!"
```

---

## 🛡️ **Access Control**

### **Role-Based Access**

#### **Production Access Levels**
```yaml
# Access Control Matrix
roles:
  admin:
    permissions:
      - read_all_keys
      - rotate_keys
      - deploy_code
      - access_production_logs
    users: ["lead-developer", "devops-engineer"]
  
  developer:
    permissions:
      - read_non_sensitive_keys
      - deploy_staging
      - access_staging_logs
    users: ["frontend-dev", "backend-dev"]
  
  operator:
    permissions:
      - monitor_services
      - restart_services
      - access_health_endpoints
    users: ["support-engineer", "monitoring-engineer"]
```

### **Key Access Logging**
```javascript
// Key access logging middleware
const keyAccessLogger = (req, res, next) => {
  const keyType = req.headers['x-key-type'];
  const userId = req.user.id;
  const timestamp = new Date().toISOString();
  
  logger.info('Key Access', {
    userId,
    keyType,
    timestamp,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next();
};

// Apply to sensitive endpoints
app.use('/api/admin/keys', keyAccessLogger);
```

---

## 🔄 **Key Rotation Schedule**

### **Rotation Timeline**
```bash
# Key Rotation Schedule
# Daily: Check key expiration
# Weekly: Verify key integrity
# Monthly: Review access logs
# Quarterly: Rotate payment gateway secrets
# Semi-annually: Rotate webhook secrets
# Annually: Full security audit
```

### **Automated Monitoring**
```javascript
// Key expiration monitoring
const keyExpirationMonitor = {
  checkExpiration: async () => {
    const keys = await getAllKeys();
    const expiringSoon = keys.filter(key => 
      new Date(key.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );
    
    if (expiringSoon.length > 0) {
      await sendAlert('Keys expiring soon', expiringSoon);
    }
  },
  
  scheduleChecks: () => {
    setInterval(keyExpirationMonitor.checkExpiration, 24 * 60 * 60 * 1000); // Daily
  }
};
```

---

## 🚨 **Emergency Procedures**

### **Key Compromise Response**
```bash
#!/bin/bash
# emergency-key-rotation.sh

echo "🚨 EMERGENCY KEY ROTATION INITIATED"

# 1. Immediately revoke compromised keys
echo "🔒 Revoking compromised keys..."
aws secretsmanager delete-secret --secret-id "nivix/production/compromised-key"

# 2. Generate new keys
echo "🔄 Generating new keys..."
NEW_SECRET=$(openssl rand -base64 32)

# 3. Update all services
echo "🔄 Updating services..."
pm2 restart all

# 4. Verify functionality
echo "🏥 Verifying functionality..."
curl -f http://localhost:3002/health || exit 1

# 5. Notify team
echo "📧 Notifying team..."
sendAlert "Emergency key rotation completed"

echo "✅ Emergency key rotation complete!"
```

### **Backup Key Recovery**
```bash
#!/bin/bash
# recover-backup-keys.sh

echo "🔄 Recovering from backup keys..."

# 1. Restore from secure backup
BACKUP_FILE="/secure/backup/keys-$(date +%Y%m%d).tar.gz"
tar -xzf "$BACKUP_FILE" -C /tmp/keys

# 2. Validate key integrity
echo "🔍 Validating key integrity..."
for key in /tmp/keys/*.key; do
  if ! openssl rsa -in "$key" -check -noout; then
    echo "❌ Invalid key: $key"
    exit 1
  fi
done

# 3. Deploy recovered keys
echo "🚀 Deploying recovered keys..."
cp /tmp/keys/*.key /opt/nivix/keys/
chmod 600 /opt/nivix/keys/*.key

# 4. Restart services
echo "🔄 Restarting services..."
pm2 restart all

echo "✅ Key recovery complete!"
```

---

## 📊 **Key Management Dashboard**

### **Monitoring Metrics**
```javascript
// Key management metrics
const keyMetrics = {
  totalKeys: 0,
  activeKeys: 0,
  expiredKeys: 0,
  compromisedKeys: 0,
  lastRotation: null,
  nextRotation: null,
  
  updateMetrics: async () => {
    const keys = await getAllKeys();
    this.totalKeys = keys.length;
    this.activeKeys = keys.filter(k => k.status === 'active').length;
    this.expiredKeys = keys.filter(k => new Date(k.expiresAt) < new Date()).length;
    this.compromisedKeys = keys.filter(k => k.status === 'compromised').length;
  }
};
```

### **Health Check Endpoint**
```javascript
// Key management health check
app.get('/api/admin/keys/health', async (req, res) => {
  try {
    const metrics = await keyMetrics.updateMetrics();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {
        totalKeys: metrics.totalKeys,
        activeKeys: metrics.activeKeys,
        expiredKeys: metrics.expiredKeys,
        compromisedKeys: metrics.compromisedKeys
      },
      alerts: metrics.expiredKeys > 0 ? ['Keys expiring'] : []
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Key health check failed' });
  }
});
```

---

## 📋 **Key Management Checklist**

### **Pre-Production**
- [ ] All production keys generated
- [ ] Keys stored in secure secrets manager
- [ ] Access controls configured
- [ ] Rotation schedule established
- [ ] Backup procedures tested
- [ ] Emergency procedures documented

### **Production**
- [ ] Key monitoring active
- [ ] Access logging enabled
- [ ] Regular rotation schedule
- [ ] Security audits scheduled
- [ ] Team training completed
- [ ] Documentation updated

### **Post-Production**
- [ ] Daily key health checks
- [ ] Weekly access log reviews
- [ ] Monthly security assessments
- [ ] Quarterly key rotations
- [ ] Annual security audits

---

**🔐 Secure key management is critical for production success!**