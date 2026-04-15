# AWS Setup Guide for Nivix Blockchain Project

## Overview
This guide will help you set up AWS infrastructure to host your Nivix project, which includes:
- **Hyperledger Fabric** (KYC/AML compliance) → AWS Managed Blockchain (AMB)
- **Bridge Service** (Node.js API) → EC2
- **React Frontend** → EC2 with Nginx
- **Solana** → External hosted RPC (no AWS hosting needed)

---

## Prerequisites

### 1. AWS Account Setup
- [ ] Create an AWS account at https://aws.amazon.com
- [ ] Set up billing alerts (recommended: $10, $50, $100 thresholds)
- [ ] Enable MFA (Multi-Factor Authentication) for root account

### 2. Install AWS CLI
```bash
# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

### 3. Configure AWS CLI
```bash
# Create IAM user with programmatic access
# Go to AWS Console → IAM → Users → Add User
# Attach policies: AdministratorAccess (for initial setup)

# Configure credentials
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format: json
```

---

## Phase 1: Amazon Managed Blockchain (Hyperledger Fabric)

### Step 1.1: Choose Your Region
```bash
# Set your preferred region (AMB availability)
export AWS_REGION="us-east-1"  # or ap-southeast-1, eu-west-1, etc.

# Verify AMB is available in your region
aws managedblockchain list-networks --region $AWS_REGION
```

### Step 1.2: Create Blockchain Network
```bash
# Create network configuration file
cat > amb-network-config.json << 'EOF'
{
  "Name": "nivix-network",
  "Description": "Nivix KYC Compliance Network",
  "Framework": "HYPERLEDGER_FABRIC",
  "FrameworkVersion": "2.2",
  "FrameworkConfiguration": {
    "Fabric": {
      "Edition": "STARTER"
    }
  },
  "VotingPolicy": {
    "ApprovalThresholdPolicy": {
      "ThresholdPercentage": 50,
      "ProposalDurationInHours": 24,
      "ThresholdComparator": "GREATER_THAN_OR_EQUAL_TO"
    }
  },
  "MemberConfiguration": {
    "Name": "nivix-member",
    "Description": "Nivix Organization Member",
    "FrameworkConfiguration": {
      "Fabric": {
        "AdminUsername": "admin",
        "AdminPassword": "YourSecurePassword123!"
      }
    }
  }
}
EOF

# Create the network
aws managedblockchain create-network \
  --cli-input-json file://amb-network-config.json \
  --region $AWS_REGION
```

### Step 1.3: Get Network and Member IDs
```bash
# List networks
aws managedblockchain list-networks --region $AWS_REGION

# Save your network ID
export NETWORK_ID="n-XXXXXXXXXXXXXXXXXX"

# Get member ID
aws managedblockchain list-members \
  --network-id $NETWORK_ID \
  --region $AWS_REGION

export MEMBER_ID="m-XXXXXXXXXXXXXXXXXX"
```

### Step 1.4: Create Peer Nodes
```bash
# Create first peer node
aws managedblockchain create-node \
  --network-id $NETWORK_ID \
  --member-id $MEMBER_ID \
  --node-configuration '{
    "InstanceType": "bc.t3.small",
    "AvailabilityZone": "us-east-1a"
  }' \
  --region $AWS_REGION

# Create second peer node (for production redundancy)
aws managedblockchain create-node \
  --network-id $NETWORK_ID \
  --member-id $MEMBER_ID \
  --node-configuration '{
    "InstanceType": "bc.t3.small",
    "AvailabilityZone": "us-east-1b"
  }' \
  --region $AWS_REGION

# Wait for nodes to become AVAILABLE (takes 10-15 minutes)
aws managedblockchain list-nodes \
  --network-id $NETWORK_ID \
  --member-id $MEMBER_ID \
  --region $AWS_REGION
```

---

## Phase 2: VPC and Networking Setup

### Step 2.1: Create VPC
```bash
# Create VPC
export VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=nivix-vpc}]' \
  --region $AWS_REGION \
  --query 'Vpc.VpcId' \
  --output text)

echo "VPC ID: $VPC_ID"

# Enable DNS hostnames
aws ec2 modify-vpc-attribute \
  --vpc-id $VPC_ID \
  --enable-dns-hostnames \
  --region $AWS_REGION
```

### Step 2.2: Create Subnets
```bash
# Public subnet (for EC2 with internet access)
export PUBLIC_SUBNET_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ${AWS_REGION}a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=nivix-public-subnet}]' \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Public Subnet ID: $PUBLIC_SUBNET_ID"

# Private subnet (for AMB endpoint)
export PRIVATE_SUBNET_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ${AWS_REGION}a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=nivix-private-subnet}]' \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Private Subnet ID: $PRIVATE_SUBNET_ID"
```

### Step 2.3: Internet Gateway and Route Tables
```bash
# Create Internet Gateway
export IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=nivix-igw}]' \
  --region $AWS_REGION \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)

# Attach to VPC
aws ec2 attach-internet-gateway \
  --vpc-id $VPC_ID \
  --internet-gateway-id $IGW_ID \
  --region $AWS_REGION

# Create route table for public subnet
export ROUTE_TABLE_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=nivix-public-rt}]' \
  --region $AWS_REGION \
  --query 'RouteTable.RouteTableId' \
  --output text)

# Add route to internet
aws ec2 create-route \
  --route-table-id $ROUTE_TABLE_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID \
  --region $AWS_REGION

# Associate with public subnet
aws ec2 associate-route-table \
  --subnet-id $PUBLIC_SUBNET_ID \
  --route-table-id $ROUTE_TABLE_ID \
  --region $AWS_REGION
```

### Step 2.4: Create VPC Endpoint for AMB
```bash
# Create VPC endpoint for Managed Blockchain
aws managedblockchain create-accessor \
  --accessor-type BILLING_TOKEN \
  --region $AWS_REGION

# Note: You'll need to create the VPC endpoint through the console
# Go to: VPC → Endpoints → Create Endpoint
# Service: com.amazonaws.{region}.managedblockchain.{network-id}
```

---

## Phase 3: Security Groups

### Step 3.1: Create Security Groups
```bash
# Security group for EC2 (web server)
export SG_WEB_ID=$(aws ec2 create-security-group \
  --group-name nivix-web-sg \
  --description "Security group for Nivix web server" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text)

echo "Web Security Group ID: $SG_WEB_ID"

# Allow HTTP (80)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_WEB_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION

# Allow HTTPS (443)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_WEB_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION

# Allow SSH (22) - restrict to your IP
aws ec2 authorize-security-group-ingress \
  --group-id $SG_WEB_ID \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP_ADDRESS/32 \
  --region $AWS_REGION
```

---

## Phase 4: EC2 Instance Setup

### Step 4.1: Create Key Pair
```bash
# Create SSH key pair
aws ec2 create-key-pair \
  --key-name nivix-key \
  --region $AWS_REGION \
  --query 'KeyMaterial' \
  --output text > nivix-key.pem

# Set permissions
chmod 400 nivix-key.pem
```

### Step 4.2: Launch EC2 Instance
```bash
# Get latest Ubuntu AMI ID
export AMI_ID=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text \
  --region $AWS_REGION)

# Launch instance
export INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.medium \
  --key-name nivix-key \
  --security-group-ids $SG_WEB_ID \
  --subnet-id $PUBLIC_SUBNET_ID \
  --associate-public-ip-address \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=nivix-server}]' \
  --region $AWS_REGION \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance ID: $INSTANCE_ID"

# Wait for instance to be running
aws ec2 wait instance-running \
  --instance-ids $INSTANCE_ID \
  --region $AWS_REGION

# Get public IP
export PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Public IP: $PUBLIC_IP"
```

---

## Phase 5: Cost Estimation

### Monthly Cost Breakdown (Approximate)

| Service | Configuration | Monthly Cost (USD) |
|---------|--------------|-------------------|
| AMB Network | Starter Edition | $30 |
| AMB Peer Nodes | 2 x bc.t3.small | $180 |
| EC2 Instance | t3.medium | $30 |
| EBS Storage | 30 GB | $3 |
| Data Transfer | 100 GB/month | $9 |
| **Total** | | **~$252/month** |

### Cost Optimization Tips:
- Use Reserved Instances for 1-3 year commitment (save 30-70%)
- Consider Spot Instances for non-critical workloads
- Use CloudWatch to monitor and optimize resource usage
- Set up billing alerts

---

## Next Steps

After completing this setup, you'll need to:

1. **Configure Hyperledger Fabric**
   - Deploy chaincode (nivix-kyc)
   - Create channels
   - Set up connection profiles

2. **Deploy Bridge Service**
   - Install Node.js on EC2
   - Configure environment variables
   - Set up systemd service

3. **Deploy Frontend**
   - Build React app
   - Configure Nginx
   - Set up SSL/TLS with Let's Encrypt

4. **Configure Monitoring**
   - CloudWatch logs
   - CloudWatch alarms
   - Cost monitoring

Would you like me to create detailed guides for any of these next steps?

---

## Useful Commands Reference

```bash
# Save all environment variables
cat > aws-env-vars.sh << EOF
export AWS_REGION="$AWS_REGION"
export NETWORK_ID="$NETWORK_ID"
export MEMBER_ID="$MEMBER_ID"
export VPC_ID="$VPC_ID"
export PUBLIC_SUBNET_ID="$PUBLIC_SUBNET_ID"
export PRIVATE_SUBNET_ID="$PRIVATE_SUBNET_ID"
export SG_WEB_ID="$SG_WEB_ID"
export INSTANCE_ID="$INSTANCE_ID"
export PUBLIC_IP="$PUBLIC_IP"
EOF

# Load variables later
source aws-env-vars.sh
```

## Support Resources

- AWS Managed Blockchain Docs: https://docs.aws.amazon.com/managed-blockchain/
- AWS CLI Reference: https://docs.aws.amazon.com/cli/
- Hyperledger Fabric Docs: https://hyperledger-fabric.readthedocs.io/
