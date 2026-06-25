import { config as loadEnv } from 'dotenv';
import * as path from 'node:path';

// Load the monorepo root .env (worker runs from apps/worker).
loadEnv({ path: path.resolve(__dirname, '../../../.env') });
loadEnv();

export const config = {
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  fabric: {
    peerEndpoint: process.env.FABRIC_GATEWAY_PEER_ENDPOINT ?? 'localhost:7051',
    peerHostAlias: process.env.FABRIC_PEER_HOST_ALIAS ?? 'peer0.org1.example.com',
    mspId: process.env.FABRIC_MSP_ID ?? 'Org1MSP',
    channel: process.env.FABRIC_CHANNEL ?? 'mychannel',
    chaincode: process.env.FABRIC_CHAINCODE ?? 'nivix-kyc',
    tlsCertPath: process.env.FABRIC_TLS_CERT_PATH ?? '',
    certDir: process.env.FABRIC_CERT_DIR ?? '',
    keyDir: process.env.FABRIC_KEY_DIR ?? '',
  },
} as const;
