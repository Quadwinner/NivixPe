# AWS Console Setup Guide - Step by Step

## 🎯 What We'll Build
- **Hyperledger Fabric** on AWS Managed Blockchain (for KYC data)
- **EC2 Server** to run your Bridge Service and Frontend
- **Networking** to connect everything securely

**Estimated Time:** 2-3 hours  
**Estimated Cost:** ~$250/month

---

## STEP 1: Create AWS Account (15 minutes)

### 1.1 Sign Up
1. Go to https://aws.amazon.com
2. Click **"Create an AWS Account"**
3. Enter your email address
4. Choose account name: `nivix-production` (or your preference)
5. Enter your contact information
6. Add payment method (credit/debit card)
7. Verify your phone number
8. Choose **Basic Support Plan** (Free)

### 1.2 Sign In to Console
1. Go to https://console.aws.amazon.com
2. Sign in with your root account email and password
3. You should see the AWS Management Console dashboard

### 1.3 Set Up Billing Alerts (Important!)
1. Click your account name (top right) → **Billing Dashboard**
2. In left menu, click **Billing preferences**
3. Check ✅ **"Receive Billing Alerts"**
4. Click **Save preferences**
5. Go to **CloudWatch** service (search in top bar)
6. Click **Alarms** → **Billing** → **Create alarm**
7. Set threshold: **$50** (you'll get email if costs exceed this)
8. Enter your email and confirm subscription

---

## STEP 2: Choose Your Region (2 minutes)

### 2.1 Select Region
1. Look at top-right corner of AWS Console
2. Click the region dropdown (e.g., "N. Virginia")
3. Choose one of these regions (AMB is available here):
   - **US East (N. Virginia)** - `us-east-1` ✅ Recommended
   - **US East (Ohio)** - `us-east-2`
   - **Asia Pacific (Singapore)** - `ap-southeast-1`
   - **Europe (Ireland)** - `eu-west-1`

4. **Important:** Use the SAME region for all services!

**Write down your region:** ________________

---

## STEP 3: Create VPC (Virtual Private Cloud) (10 minutes)

### 3.1 Open VPC Service
1. In AWS Console search bar (top), type **"VPC"**
2. Click **VPC** service

### 3.2 Create VPC
1. Click **"Create VPC"** button
2. Choose **"VPC and more"** (this creates everything at once)
3. Configure:
   - **Name tag:** `nivix-vpc`
   - **IPv4 CIDR block:** `10.0.0.0/16`
   - **Number of Availability Zones:** `2`
   - **Number of public subnets:** `2`
   - **Number of private subnets:** `2`
   - **NAT gateways:** `None` (save cost for now)
   - **VPC endpoints:** `None`
4. Click **"Create VPC"**
5. Wait 2-3 minutes for creation

### 3.3 Note Your VPC ID
1. After creation, you'll see a success message
2. Click **"View VPC"**
3. Copy your **VPC ID** (looks like: `vpc-0123456789abcdef`)

**Write down your VPC ID:** ________________

---

## STEP 4: Create Security Group (5 minutes)

### 4.1 Create Security Group for EC2
1. In VPC dashboard, click **"Security Groups"** (left menu)
2. Click **"Create security group"**
3. Configure:
   - **Security group name:** `nivix-web-sg`
   - **Description:** `Security group for Nivix web server`
   - **VPC:** Select your `nivix-vpc`

### 4.2 Add Inbound Rules
Click **"Add rule"** for each:

**Rule 1 - SSH:**
- Type: `SSH`
- Protocol: `TCP`
- Port: `22`
- Source: `My IP` (automatically detects your IP)
- Description: `SSH access`

**Rule 2 - HTTP:**
- Type: `HTTP`
- Protocol: `TCP`
- Port: `80`
- Source: `Anywhere-IPv4` (0.0.0.0/0)
- Description: `HTTP access`

**Rule 3 - HTTPS:**
- Type: `HTTPS`
- Protocol: `TCP`
- Port: `443`
- Source: `Anywhere-IPv4` (0.0.0.0/0)
- Description: `HTTPS access`

4. Click **"Create security group"**

**Write down Security Group ID:** ________________

---

## STEP 5: Create EC2 Key Pair (3 minutes)

### 5.1 Create SSH Key
1. Search for **"EC2"** in top search bar
2. Click **EC2** service
3. In left menu, scroll down to **"Key Pairs"**
4. Click **"Create key pair"**
5. Configure:
   - **Name:** `nivix-key`
   - **Key pair type:** `RSA`
   - **Private key file format:** `.pem` (for Linux/Mac) or `.ppk` (for Windows/PuTTY)
6. Click **"Create key pair"**
7. **IMPORTANT:** The file will download automatically - SAVE IT SAFELY!
8. Move it to a secure location on your computer

**For Linux/Mac users:**
```bash
# Move to .ssh folder and set permissions
mv ~/Downloads/nivix-key.pem ~/.ssh/
chmod 400 ~/.ssh/nivix-key.pem
```

---

## STEP 6: Launch EC2 Instance (10 minutes)

### 6.1 Launch Instance
1. In EC2 Dashboard, click **"Launch instance"**
2. Configure:

**Name and tags:**
- **Name:** `nivix-server`

**Application and OS Images:**
- Click **"Ubuntu"**
- Choose **"Ubuntu Server 22.04 LTS"** (Free tier eligible)
- Architecture: **64-bit (x86)**

**Instance type:**
- Choose **`t3.medium`** (2 vCPU, 4 GB RAM)
- Note: This costs ~$0.04/hour (~$30/month)

**Key pair:**
- Select **`nivix-key`** (the one you just created)

**Network settings:**
- Click **"Edit"**
- **VPC:** Select `nivix-vpc`
- **Subnet:** Select any **public subnet** (should have "public" in name)
- **Auto-assign public IP:** **Enable**
- **Firewall (security groups):** Select existing security group
- Choose **`nivix-web-sg`**

**Configure storage:**
- **Size:** `30 GiB`
- **Volume type:** `gp3`

**Advanced details:**
- Leave as default

3. Review the **Summary** on right side
4. Click **"Launch instance"**
5. Wait 2-3 minutes

### 6.2 Get Your Server IP Address
1. Click **"View all instances"**
2. Select your `nivix-server` instance
3. In the details below, find **"Public IPv4 address"**
4. Copy this IP address

**Write down your Public IP:** ________________

### 6.3 Test SSH Connection
**For Linux/Mac:**
```bash
ssh -i ~/.ssh/nivix-key.pem ubuntu@YOUR_PUBLIC_IP
```

**For Windows (using PuTTY):**
1. Open PuTTY
2. Host Name: `ubuntu@YOUR_PUBLIC_IP`
3. Connection → SSH → Auth → Browse for your .ppk file
4. Click Open

If connected successfully, you'll see Ubuntu welcome message! 🎉

---

## STEP 7: Set Up Amazon Managed Blockchain (30 minutes)

### 7.1 Open Managed Blockchain Service
1. Search for **"Managed Blockchain"** in top search bar
2. Click **"Amazon Managed Blockchain"**
3. Click **"Get started"** or **"Create network"**

### 7.2 Create Blockchain Network
**Step 1 - Configure network:**
- **Blockchain framework:** `Hyperledger Fabric`
- **Hyperledger Fabric version:** `2.2`
- **Network edition:** `Starter` (cheaper for testing)
- **Network name:** `nivix-network`
- **Network description:** `Nivix KYC Compliance Network`

**Voting policy:**
- **Approval threshold percentage:** `50`
- **Proposal duration:** `24 hours`

Click **"Next"**

**Step 2 - Create member:**
- **Member name:** `nivix-member`
- **Member description:** `Nivix Organization`
- **Admin username:** `admin`
- **Admin password:** Create a strong password (save it!)
  - Example: `NivixAdmin2024!Secure`
  - **WRITE THIS DOWN SECURELY!**

**Admin password:** ________________

Click **"Next"**

**Step 3 - Review and create:**
- Review all settings
- Click **"Create network and member"**

⏳ **This takes 20-30 minutes!** Go grab a coffee ☕

### 7.3 Check Network Status
1. Go to **Managed Blockchain** → **Networks**
2. Wait until status shows **"AVAILABLE"** (green)
3. Click on your network name
4. **Copy Network ID** (looks like: `n-XXXXXXXXXXXX`)

**Write down Network ID:** ________________

### 7.4 Get Member ID
1. In your network details, click **"Members"** tab
2. You'll see `nivix-member`
3. **Copy Member ID** (looks like: `m-XXXXXXXXXXXX`)

**Write down Member ID:** ________________

---

## STEP 8: Create Peer Nodes (15 minutes)

### 8.1 Create First Peer Node
1. In your network, click **"Members"** tab
2. Click on `nivix-member`
3. Scroll down to **"Peer nodes"** section
4. Click **"Create peer node"**
5. Configure:
   - **Peer node name:** `nivix-peer-01`
   - **Instance type:** `bc.t3.small` (cheapest option)
   - **Availability Zone:** Choose first available (e.g., `us-east-1a`)
6. Click **"Create peer node"**

### 8.2 Create Second Peer Node (Optional but Recommended)
1. Click **"Create peer node"** again
2. Configure:
   - **Peer node name:** `nivix-peer-02`
   - **Instance type:** `bc.t3.small`
   - **Availability Zone:** Choose different zone (e.g., `us-east-1b`)
3. Click **"Create peer node"**

⏳ **Wait 10-15 minutes** for peer nodes to become **"AVAILABLE"**

### 8.3 Note Peer Node IDs
Once available, copy the peer node IDs:

**Peer 1 ID:** ________________
**Peer 2 ID:** ________________

---

## STEP 9: Create VPC Endpoint for Blockchain (10 minutes)

### 9.1 Get Endpoint Service Name
1. In Managed Blockchain, go to your network
2. Click **"Framework attributes"** tab
3. Copy the **"VPC endpoint service name"**
   - Looks like: `com.amazonaws.us-east-1.managedblockchain.n-XXXX`

**Write down Service Name:** ________________

### 9.2 Create VPC Endpoint
1. Go to **VPC** service
2. Click **"Endpoints"** (left menu)
3. Click **"Create endpoint"**
4. Configure:
   - **Name tag:** `nivix-blockchain-endpoint`
   - **Service category:** `Other endpoint services`
   - **Service name:** Paste the service name from step 9.1
   - Click **"Verify service"** (should show green checkmark)
   - **VPC:** Select `nivix-vpc`
   - **Subnets:** Select your **private subnets** (both AZs)
   - **Security groups:** Select `default` security group
5. Click **"Create endpoint"**

⏳ Wait 5 minutes for status to become **"Available"**

---

## STEP 10: Summary - What You've Created ✅

Congratulations! You've set up:

1. ✅ **AWS Account** with billing alerts
2. ✅ **VPC** with public and private subnets
3. ✅ **Security Group** for web access
4. ✅ **SSH Key Pair** for server access
5. ✅ **EC2 Instance** (your application server)
6. ✅ **Managed Blockchain Network** (Hyperledger Fabric)
7. ✅ **2 Peer Nodes** for redundancy
8. ✅ **VPC Endpoint** to connect EC2 to blockchain

---

## 📋 Your Configuration Summary

Fill this out and keep it safe:

```
AWS CONFIGURATION
=================
Region: ________________
VPC ID: ________________
Security Group ID: ________________
EC2 Instance ID: ________________
EC2 Public IP: ________________

BLOCKCHAIN CONFIGURATION
========================
Network ID: ________________
Member ID: ________________
Admin Username: admin
Admin Password: ________________
Peer 1 ID: ________________
Peer 2 ID: ________________
VPC Endpoint Service: ________________
```

---

## 🎯 Next Steps

Now that your AWS infrastructure is ready, you need to:

1. **Install software on EC2** (Node.js, Nginx, etc.)
2. **Configure Hyperledger Fabric** (deploy chaincode)
3. **Deploy your Bridge Service**
4. **Deploy your React Frontend**
5. **Set up SSL/TLS certificate**

Would you like me to create the next guide for installing and configuring software on your EC2 instance?

---

## 💰 Cost Tracking

Monitor your costs:
1. Go to **Billing Dashboard**
2. Check **"Bills"** to see current month charges
3. Check **"Cost Explorer"** for detailed breakdown

Expected monthly costs:
- EC2 t3.medium: ~$30
- AMB Network: ~$30
- AMB Peer Nodes (2x): ~$180
- Data transfer: ~$10
- **Total: ~$250/month**

---

## 🆘 Troubleshooting

**Can't connect to EC2 via SSH?**
- Check security group allows SSH from your IP
- Verify you're using correct key file
- Ensure instance is in "running" state

**Blockchain network creation failed?**
- Check you selected a supported region
- Verify your account has no service limits
- Contact AWS support if needed

**VPC endpoint not connecting?**
- Ensure endpoint is in "Available" state
- Check security groups allow traffic
- Verify subnets are in same VPC as blockchain

---

## 📞 Need Help?

- AWS Support: https://console.aws.amazon.com/support
- AWS Documentation: https://docs.aws.amazon.com
- Managed Blockchain Guide: https://docs.aws.amazon.com/managed-blockchain/

---

**Ready to continue?** Let me know when you've completed these steps and I'll guide you through the next phase! 🚀
