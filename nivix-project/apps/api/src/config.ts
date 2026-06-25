import { config as loadEnv } from 'dotenv';
import * as path from 'node:path';

// Monorepo env: load the root .env regardless of the process cwd (apps run from their own dir).
loadEnv({ path: path.resolve(__dirname, '../../../.env') });
loadEnv(); // also pick up a cwd-local .env if present (does not override already-set vars)

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '3002', 10),
  databaseUrl: required('DATABASE_URL'),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: required('JWT_SECRET', 'change_me_local_dev_only'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  secretsProvider: (process.env.SECRETS_PROVIDER ?? 'env') as 'env' | 'aws',
  localMasterKey: process.env.LOCAL_MASTER_KEY ?? '',
  fabric: {
    peerEndpoint: process.env.FABRIC_GATEWAY_PEER_ENDPOINT ?? 'localhost:7051',
    mspId: process.env.FABRIC_MSP_ID ?? 'Org1MSP',
    channel: process.env.FABRIC_CHANNEL ?? 'mychannel',
    chaincode: process.env.FABRIC_CHAINCODE ?? 'nivix-kyc',
  },
} as const;
