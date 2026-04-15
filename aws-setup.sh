#!/bin/bash

# Nivix AWS Setup Script
# This script automates the initial AWS infrastructure setup

set -e

echo "=========================================="
echo "Nivix AWS Infrastructure Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI first: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not configured${NC}"
    echo "Please run: aws configure"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI is installed and configured${NC}"
echo ""

# Get AWS region
read -p "Enter AWS region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}
export AWS_REGION

echo -e "${YELLOW}Using region: $AWS_REGION${NC}"
echo ""

# Confirm before proceeding
echo "This script will create the following AWS resources:"
echo "  - VPC with public and private subnets"
echo "  - Internet Gateway and Route Tables"
echo "  - Security Groups"
echo "  - EC2 Key Pair"
echo "  - EC2 Instance (t3.medium)"
echo ""
echo -e "${YELLOW}Estimated monthly cost: ~$30-50 for EC2 (excluding AMB)${NC}"
echo ""
read -p "Do you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo "=========================================="
echo "Step 1: Creating VPC"
echo "=========================================="

VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=nivix-vpc}]' \
  --region $AWS_REGION \
  --query 'Vpc.VpcId' \
  --output text)

echo -e "${GREEN}✓ VPC created: $VPC_ID${NC}"

# Enable DNS hostnames
aws ec2 modify-vpc-attribute \
  --vpc-id $VPC_ID \
  --enable-dns-hostnames \
  --region $AWS_REGION

echo ""
echo "=========================================="
echo "Step 2: Creating Subnets"
echo "=========================================="

# Public subnet
PUBLIC_SUBNET_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ${AWS_REGION}a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=nivix-public-subnet}]' \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

echo -e "${GREEN}✓ Public subnet created: $PUBLIC_SUBNET_ID${NC}"

# Private subnet
PRIVATE_SUBNET_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ${AWS_REGION}a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=nivix-private-subnet}]' \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

echo -e "${GREEN}✓ Private subnet created: $PRIVATE_SUBNET_ID${NC}"

echo ""
echo "=========================================="
echo "Step 3: Setting up Internet Gateway"
echo "=========================================="

IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=nivix-igw}]' \
  --region $AWS_REGION \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)

aws ec2 attach-internet-gateway \
  --vpc-id $VPC_ID \
  --internet-gateway-id $IGW_ID \
  --region $AWS_REGION

echo -e "${GREEN}✓ Internet Gateway created and attached: $IGW_ID${NC}"

# Create route table
ROUTE_TABLE_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=nivix-public-rt}]' \
  --region $AWS_REGION \
  --query 'RouteTable.RouteTableId' \
  --output text)

aws ec2 create-route \
  --route-table-id $ROUTE_TABLE_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID \
  --region $AWS_REGION

aws ec2 associate-route-table \
  --subnet-id $PUBLIC_SUBNET_ID \
  --route-table-id $ROUTE_TABLE_ID \
  --region $AWS_REGION

echo -e "${GREEN}✓ Route table configured${NC}"

echo ""
echo "=========================================="
echo "Step 4: Creating Security Group"
echo "=========================================="

SG_WEB_ID=$(aws ec2 create-security-group \
  --group-name nivix-web-sg \
  --description "Security group for Nivix web server" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text)

echo -e "${GREEN}✓ Security Group created: $SG_WEB_ID${NC}"

# Allow HTTP
aws ec2 authorize-security-group-ingress \
  --group-id $SG_WEB_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION

# Allow HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id $SG_WEB_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION

# Get current IP for SSH access
CURRENT_IP=$(curl -s https://checkip.amazonaws.com)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_WEB_ID \
  --protocol tcp \
  --port 22 \
  --cidr ${CURRENT_IP}/32 \
  --region $AWS_REGION

echo -e "${GREEN}✓ Security rules configured (SSH allowed from $CURRENT_IP)${NC}"

echo ""
echo "=========================================="
echo "Step 5: Creating SSH Key Pair"
echo "=========================================="

if [ -f "nivix-key.pem" ]; then
    echo -e "${YELLOW}Warning: nivix-key.pem already exists${NC}"
    read -p "Overwrite? (yes/no): " OVERWRITE
    if [ "$OVERWRITE" != "yes" ]; then
        echo "Skipping key creation"
    else
        rm nivix-key.pem
        aws ec2 delete-key-pair --key-name nivix-key --region $AWS_REGION 2>/dev/null || true
        aws ec2 create-key-pair \
          --key-name nivix-key \
          --region $AWS_REGION \
          --query 'KeyMaterial' \
          --output text > nivix-key.pem
        chmod 400 nivix-key.pem
        echo -e "${GREEN}✓ SSH key pair created: nivix-key.pem${NC}"
    fi
else
    aws ec2 create-key-pair \
      --key-name nivix-key \
      --region $AWS_REGION \
      --query 'KeyMaterial' \
      --output text > nivix-key.pem
    chmod 400 nivix-key.pem
    echo -e "${GREEN}✓ SSH key pair created: nivix-key.pem${NC}"
fi

echo ""
echo "=========================================="
echo "Step 6: Launching EC2 Instance"
echo "=========================================="

# Get latest Ubuntu AMI
AMI_ID=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text \
  --region $AWS_REGION)

echo "Using AMI: $AMI_ID"

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.medium \
  --key-name nivix-key \
  --security-group-ids $SG_WEB_ID \
  --subnet-id $PUBLIC_SUBNET_ID \
  --associate-public-ip-address \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=nivix-server}]' \
  --region $AWS_REGION \
  --query 'Instances[0].InstanceId' \
  --output text)

echo -e "${GREEN}✓ EC2 Instance launched: $INSTANCE_ID${NC}"
echo "Waiting for instance to be running..."

aws ec2 wait instance-running \
  --instance-ids $INSTANCE_ID \
  --region $AWS_REGION

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo -e "${GREEN}✓ Instance is running${NC}"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Your AWS infrastructure is ready:"
echo ""
echo "  VPC ID:              $VPC_ID"
echo "  Public Subnet:       $PUBLIC_SUBNET_ID"
echo "  Private Subnet:      $PRIVATE_SUBNET_ID"
echo "  Security Group:      $SG_WEB_ID"
echo "  EC2 Instance ID:     $INSTANCE_ID"
echo "  Public IP:           $PUBLIC_IP"
echo ""
echo "SSH Connection:"
echo "  ssh -i nivix-key.pem ubuntu@$PUBLIC_IP"
echo ""

# Save configuration
cat > aws-config.env << EOF
# Nivix AWS Configuration
# Generated on $(date)

export AWS_REGION="$AWS_REGION"
export VPC_ID="$VPC_ID"
export PUBLIC_SUBNET_ID="$PUBLIC_SUBNET_ID"
export PRIVATE_SUBNET_ID="$PRIVATE_SUBNET_ID"
export IGW_ID="$IGW_ID"
export ROUTE_TABLE_ID="$ROUTE_TABLE_ID"
export SG_WEB_ID="$SG_WEB_ID"
export INSTANCE_ID="$INSTANCE_ID"
export PUBLIC_IP="$PUBLIC_IP"
EOF

echo -e "${GREEN}✓ Configuration saved to aws-config.env${NC}"
echo ""
echo "Next steps:"
echo "  1. Wait 2-3 minutes for the instance to fully initialize"
echo "  2. Connect via SSH: ssh -i nivix-key.pem ubuntu@$PUBLIC_IP"
echo "  3. Follow the deployment guide to install Node.js and deploy your application"
echo ""
echo "For AMB setup, refer to AWS_SETUP_GUIDE.md Phase 1"
echo ""
