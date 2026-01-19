#!/bin/bash

# Nivix Fabric Helper Script - FINAL WORKING VERSION
set -e

FUNCTION_NAME="$1"
ARGS="$2"
OPERATION="$3"

# Resolve paths dynamically (no hardcoded machine-specific paths)
# Priority:
# 1) FABRIC_NETWORK_DIR / FABRIC_PROJECT_ROOT / NIVIX_PROJECT_ROOT envs (set by bridge-service)
# 2) Infer from current working directory (bridge-service runs from repo root)
# 3) Walk up from script dir to find fabric-samples/test-network (for non-/tmp usage)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

find_project_root() {
  local start="$1"
  local cur="$start"
  local i=0
  while [ $i -lt 6 ]; do
    if [ -d "${cur}/fabric-samples/test-network" ]; then
      echo "$cur"
      return 0
    fi
    cur="$(cd "${cur}/.." && pwd)"
    i=$((i+1))
  done
  return 1
}

PROJECT_ROOT=""
if [ -n "${FABRIC_PROJECT_ROOT:-}" ]; then
  PROJECT_ROOT="${FABRIC_PROJECT_ROOT}"
elif [ -n "${NIVIX_PROJECT_ROOT:-}" ]; then
  PROJECT_ROOT="${NIVIX_PROJECT_ROOT}"
else
  PROJECT_ROOT="$(find_project_root "$(pwd)" || true)"
  if [ -z "$PROJECT_ROOT" ]; then
    PROJECT_ROOT="$(find_project_root "${SCRIPT_DIR}/.." || true)"
  fi
fi

if [ -z "$PROJECT_ROOT" ]; then
  echo "❌ Unable to locate project root (fabric-samples/test-network not found). Set NIVIX_PROJECT_ROOT or FABRIC_PROJECT_ROOT." >&2
  exit 1
fi

NETWORK_DIR="${FABRIC_NETWORK_DIR:-${PROJECT_ROOT}/fabric-samples/test-network}"
PEER_BIN="${PROJECT_ROOT}/fabric-samples/bin/peer"

# Change to network directory
cd "$NETWORK_DIR"

# Set Fabric config path
export FABRIC_CFG_PATH="${PROJECT_ROOT}/fabric-samples/config"

# Set environment variables for Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_TLS_ROOTCERT_FILE="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem"
export CORE_PEER_ADDRESS=localhost:7051
export ORDERER_CA="$NETWORK_DIR/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem"
export PEER0_ORG1_CA="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem"
export PEER0_ORG2_CA="$NETWORK_DIR/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem"

# Execute based on operation type
if [ "$OPERATION" = "query" ]; then
    "$PEER_BIN" chaincode query -C mychannel -n nivix-kyc -c "{\"function\":\"$FUNCTION_NAME\",\"Args\":$ARGS}"
else
    "$PEER_BIN" chaincode invoke \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile "$ORDERER_CA" \
        -C mychannel \
        -n nivix-kyc \
        --peerAddresses localhost:7051 \
        --tlsRootCertFiles "$PEER0_ORG1_CA" \
        --peerAddresses localhost:9051 \
        --tlsRootCertFiles "$PEER0_ORG2_CA" \
        -c "{\"function\":\"$FUNCTION_NAME\",\"Args\":$ARGS}"
fi
