import { config as loadEnv } from 'dotenv';
import * as path from 'node:path';
import { Queue, Worker, type ConnectionOptions } from 'bullmq';

// Load the monorepo root .env (worker runs from apps/worker).
loadEnv({ path: path.resolve(__dirname, '../../../.env') });
loadEnv();

// Pass plain connection options (not an ioredis instance) so BullMQ uses its own
// bundled ioredis — avoids dual-version type clashes.
function redisConnection(): ConnectionOptions {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
  return {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

const connection = redisConnection();

// Phase 1: the 'fabric-writes' queue carries KYC/compliance records to Hyperledger
// Fabric (with retry), then mirrors the result to Postgres. Implemented in WS-C.
export const fabricQueue = new Queue('fabric-writes', { connection });

const worker = new Worker(
  'fabric-writes',
  async (job) => {
    // WS-C: record on Fabric (dual-org endorsement) -> mirror to Postgres.
    console.log(`[worker] processing ${job.name} #${job.id}`);
  },
  { connection },
);

worker.on('ready', () => console.log('[nivix-worker] ready (queue: fabric-writes)'));
worker.on('failed', (job, err) =>
  console.error(`[worker] job ${job?.id} failed: ${err.message}`),
);
