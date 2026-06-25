import { config } from './config'; // loads root .env
import { Worker, type ConnectionOptions } from 'bullmq';
import { prisma } from './db';
import { storeKycOnFabric } from './fabric/kyc';
import { closeGateway } from './fabric/gateway';

function redisConnection(): ConnectionOptions {
  const url = new URL(config.redisUrl);
  return {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

// Processes 'fabric-writes': writes compliance records to Hyperledger, then mirrors
// the resulting tx id into Postgres. BullMQ retries handle transient Fabric failures.
const worker = new Worker(
  'fabric-writes',
  async (job) => {
    if (job.name === 'store-kyc') {
      const { userId, fullName, kycVerified, riskScore, countryCode } = job.data;
      const txId = await storeKycOnFabric({ userId, fullName, kycVerified, riskScore, countryCode });
      await prisma.kycRecord.update({ where: { userId }, data: { fabricTxRef: txId } });
      console.log(`[worker] KYC ${userId} recorded on Fabric: ${txId}`);
      return { txId };
    }
    console.warn(`[worker] unknown job: ${job.name}`);
    return null;
  },
  { connection: redisConnection() },
);

worker.on('ready', () => console.log('[nivix-worker] ready (queue: fabric-writes)'));
worker.on('completed', (job) => console.log(`[worker] job ${job.id} (${job.name}) completed`));
worker.on('failed', (job, err) =>
  console.error(`[worker] job ${job?.id} failed: ${err.message}`),
);

async function shutdown() {
  await worker.close();
  closeGateway();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
