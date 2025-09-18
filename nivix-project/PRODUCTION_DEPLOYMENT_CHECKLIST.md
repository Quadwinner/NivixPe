# 🏭 Production Deployment Checklist

## 🔧 **Pre-Deployment Setup**

### **Server Requirements**
- [ ] Ubuntu 20.04+ LTS server
- [ ] 4GB RAM minimum (8GB recommended)
- [ ] 50GB SSD storage
- [ ] Static IP address
- [ ] Domain name configured
- [ ] SSL certificate (Let's Encrypt)

### **Environment Preparation**
- [ ] Production environment variables set
- [ ] Database backup created
- [ ] Payment gateway production accounts
- [ ] Blockchain mainnet configuration
- [ ] KYC production integration

---

## 🚀 **Deployment Steps**

### **1. Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install SSL certificate
sudo apt install certbot python3-certbot-nginx -y
```

### **2. Application Deployment**
```bash
# Clone repository
git clone https://github.com/your-repo/nivix-project.git
cd nivix-project

# Install dependencies
npm ci --production

# Build frontend
cd frontend/nivix-pay
npm run build
cd ../..

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### **3. Nginx Configuration**
```nginx
# /etc/nginx/sites-available/nivix
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/nivix/frontend/nivix-pay/dist;
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
```

---

## 🔒 **Security Configuration**

### **Firewall Setup**
```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### **Environment Security**
```bash
# Set secure file permissions
chmod 600 /var/www/nivix/.env
chown -R www-data:www-data /var/www/nivix
```

### **API Security**
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] SQL injection protection
- [ ] XSS protection enabled

---

## 💳 **Payment Gateway Production**

### **Cashfree Production**
```bash
# Production environment variables
export CASHFREE_CLIENT_ID="CF_PROD_CLIENT_ID"
export CASHFREE_CLIENT_SECRET="CF_PROD_SECRET"
export CASHFREE_BASE_URL="https://payout-api.cashfree.com"
export CASHFREE_WEBHOOK_SECRET="PROD_WEBHOOK_SECRET"
```

### **Razorpay Production**
```bash
# Production environment variables
export RAZORPAY_KEY_ID="rzp_live_PROD_KEY"
export RAZORPAY_KEY_SECRET="PROD_SECRET"
export RAZORPAY_WEBHOOK_SECRET="PROD_WEBHOOK_SECRET"
```

---

## 📊 **Monitoring Setup**

### **Health Check Endpoints**
```javascript
// Add to your backend
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      blockchain: 'connected',
      kyc: 'operational',
      payments: 'active',
      database: 'connected'
    }
  });
});

app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    transactions: {
      total: getTotalTransactions(),
      successRate: getSuccessRate(),
      avgProcessingTime: getAvgProcessingTime()
    }
  });
});
```

### **Monitoring Tools**
- [ ] Uptime monitoring (Pingdom/UptimeRobot)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic)
- [ ] Log aggregation (ELK stack)

---

## 🧪 **Testing Checklist**

### **Pre-Production Tests**
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] End-to-end tests passing
- [ ] Load testing completed
- [ ] Security testing completed
- [ ] Payment gateway testing
- [ ] Blockchain integration testing

### **Production Tests**
- [ ] Health check endpoint responding
- [ ] Payment flow working
- [ ] KYC integration working
- [ ] Blockchain transactions working
- [ ] Error handling working
- [ ] Monitoring alerts configured

---

## 📋 **Go-Live Checklist**

### **Final Verification**
- [ ] All services running
- [ ] SSL certificate valid
- [ ] Domain resolving correctly
- [ ] Payment gateways configured
- [ ] Monitoring active
- [ ] Backup procedures tested
- [ ] Rollback plan ready

### **Launch Day**
- [ ] Final code review
- [ ] Database migration (if needed)
- [ ] DNS propagation complete
- [ ] SSL certificate active
- [ ] All tests passing
- [ ] Team ready for support
- [ ] Documentation updated

---

## 🚨 **Emergency Procedures**

### **Rollback Plan**
```bash
#!/bin/bash
# emergency-rollback.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED"

# Stop current services
pm2 stop all

# Restore from backup
tar -xzf backup-$(date +%Y%m%d).tar.gz -C /

# Restart services
pm2 start ecosystem.config.js

# Verify health
curl -f http://localhost:3002/health || echo "❌ Rollback failed"

echo "✅ Rollback complete"
```

### **Incident Response**
1. **Immediate Response** (0-5 minutes)
   - Identify the issue
   - Assess impact
   - Notify team

2. **Containment** (5-15 minutes)
   - Stop affected services
   - Implement workaround
   - Communicate with users

3. **Recovery** (15-60 minutes)
   - Fix the root cause
   - Restore services
   - Verify functionality

4. **Post-Incident** (1-24 hours)
   - Document incident
   - Update procedures
   - Prevent recurrence

---

## 📞 **Support Contacts**

### **Technical Support**
- **Lead Developer**: [Your Contact]
- **DevOps Engineer**: [Your Contact]
- **Payment Gateway Support**: [Cashfree/Razorpay Support]

### **Emergency Contacts**
- **24/7 Support**: [Emergency Number]
- **Escalation Manager**: [Manager Contact]
- **Legal/Compliance**: [Legal Contact]

---

## 📈 **Post-Launch Monitoring**

### **First 24 Hours**
- [ ] Monitor all systems continuously
- [ ] Check payment processing
- [ ] Verify user registrations
- [ ] Monitor error rates
- [ ] Check performance metrics

### **First Week**
- [ ] Daily health checks
- [ ] Performance analysis
- [ ] User feedback review
- [ ] Security monitoring
- [ ] Backup verification

### **Ongoing Maintenance**
- [ ] Weekly performance reviews
- [ ] Monthly security updates
- [ ] Quarterly system audits
- [ ] Annual compliance reviews

---

**🎉 Ready for Production Launch!**




