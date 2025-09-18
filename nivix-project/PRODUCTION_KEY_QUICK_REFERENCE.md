# 🔑 Production Key Quick Reference

## 🚀 **Quick Commands**

### **Key Management**
```bash
# View all production keys
pm2 logs nivix-backend | grep "Key loaded"

# Check key expiration
curl http://localhost:3002/api/admin/keys/health

# Rotate keys immediately
./scripts/rotate-keys.sh

# Emergency key rotation
./scripts/emergency-key-rotation.sh
```

### **Environment Variables**
```bash
# Set production keys
export CASHFREE_CLIENT_ID_PROD="CF_PROD_CLIENT_ID"
export CASHFREE_CLIENT_SECRET_PROD="CF_PROD_SECRET"
export RAZORPAY_KEY_ID_PROD="rzp_live_PROD_KEY"
export RAZORPAY_KEY_SECRET_PROD="PROD_SECRET"
export SOLANA_TREASURY_PRIVATE_KEY_PROD="[ENCRYPTED_KEY]"

# Verify keys are loaded
echo "Cashfree ID: $CASHFREE_CLIENT_ID_PROD"
echo "Razorpay ID: $RAZORPAY_KEY_ID_PROD"
```

---

## 🔐 **Key Types & Locations**

### **Payment Gateway Keys**
| Service | Key Type | Environment Variable | Location |
|---------|----------|---------------------|----------|
| Cashfree | Client ID | `CASHFREE_CLIENT_ID_PROD` | AWS Secrets Manager |
| Cashfree | Client Secret | `CASHFREE_CLIENT_SECRET_PROD` | AWS Secrets Manager |
| Razorpay | Key ID | `RAZORPAY_KEY_ID_PROD` | AWS Secrets Manager |
| Razorpay | Key Secret | `RAZORPAY_KEY_SECRET_PROD` | AWS Secrets Manager |

### **Blockchain Keys**
| Service | Key Type | Environment Variable | Location |
|---------|----------|---------------------|----------|
| Solana | Treasury Private Key | `SOLANA_TREASURY_PRIVATE_KEY_PROD` | Encrypted File |
| Solana | Treasury Public Key | `SOLANA_TREASURY_PUBLIC_KEY_PROD` | Environment |
| Fabric | CA Certificate | `FABRIC_CA_CERT_PATH_PROD` | `/opt/fabric/` |
| Fabric | User Certificate | `FABRIC_USER_CERT_PATH_PROD` | `/opt/fabric/` |

### **Database Keys**
| Service | Key Type | Environment Variable | Location |
|---------|----------|---------------------|----------|
| PostgreSQL | Host | `DB_HOST_PROD` | Environment |
| PostgreSQL | Password | `DB_PASSWORD_PROD` | AWS Secrets Manager |
| Redis | Password | `REDIS_PASSWORD_PROD` | AWS Secrets Manager |

---

## ⚡ **Quick Actions**

### **Check Key Status**
```bash
# Health check
curl -s http://localhost:3002/health | jq '.services'

# Key metrics
curl -s http://localhost:3002/api/admin/keys/health | jq '.metrics'

# Service status
pm2 status
```

### **Rotate Keys**
```bash
# Standard rotation
./scripts/rotate-keys.sh

# Emergency rotation
./scripts/emergency-key-rotation.sh

# Verify rotation
curl -s http://localhost:3002/health
```

### **Backup Keys**
```bash
# Create backup
tar -czf keys-backup-$(date +%Y%m%d).tar.gz /opt/nivix/keys/

# Restore backup
tar -xzf keys-backup-YYYYMMDD.tar.gz -C /
```

---

## 🚨 **Emergency Contacts**

### **Key Issues**
- **Lead Developer**: [Your Contact]
- **DevOps Engineer**: [Your Contact]
- **Security Team**: [Security Contact]

### **Payment Gateway Support**
- **Cashfree**: support@cashfree.com
- **Razorpay**: support@razorpay.com

### **Blockchain Support**
- **Solana**: Discord #support
- **Fabric**: Hyperledger Community

---

## 📊 **Key Monitoring**

### **Health Checks**
```bash
# Every 5 minutes
*/5 * * * * curl -f http://localhost:3002/health || echo "Health check failed"

# Daily key expiration check
0 9 * * * ./scripts/check-key-expiration.sh

# Weekly key rotation
0 2 * * 0 ./scripts/rotate-keys.sh
```

### **Alerts**
```bash
# Key expiration alert
if [ $expired_keys -gt 0 ]; then
  sendAlert "Keys expiring: $expired_keys"
fi

# Service down alert
if ! curl -f http://localhost:3002/health; then
  sendAlert "Service health check failed"
fi
```

---

## 🔄 **Rotation Schedule**

### **Automatic Rotation**
- **Payment Gateway Secrets**: Every 90 days
- **Webhook Secrets**: Every 180 days
- **Database Passwords**: Every 120 days
- **JWT Secrets**: Every 60 days

### **Manual Rotation**
```bash
# Check rotation schedule
./scripts/check-rotation-schedule.sh

# Force rotation
./scripts/force-rotation.sh --service=cashfree

# Verify rotation
./scripts/verify-rotation.sh
```

---

## 🛡️ **Security Quick Checks**

### **Access Control**
```bash
# Check file permissions
ls -la /opt/nivix/keys/

# Verify environment isolation
env | grep PROD

# Check service isolation
ps aux | grep nivix
```

### **Key Integrity**
```bash
# Verify Solana key
solana-keygen verify [PUBLIC_KEY] [PRIVATE_KEY]

# Verify Fabric certificates
openssl x509 -in /opt/fabric/ca-cert.pem -text -noout

# Verify payment gateway keys
curl -H "Authorization: Bearer $CASHFREE_TOKEN" https://payout-api.cashfree.com/payout/v1/account/balance
```

---

## 📋 **Quick Checklist**

### **Daily**
- [ ] Check service health
- [ ] Verify key status
- [ ] Review access logs
- [ ] Monitor error rates

### **Weekly**
- [ ] Review key expiration
- [ ] Check rotation schedule
- [ ] Verify backups
- [ ] Update documentation

### **Monthly**
- [ ] Full security audit
- [ ] Key rotation
- [ ] Access review
- [ ] Performance analysis

---

**🔑 Keep this reference handy for quick key management!**