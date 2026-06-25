import { Queue, type ConnectionOptions } from 'bullmq';
import { config } from './config';

function redisConnection(): ConnectionOptions {
  const url = new URL(config.redisUrl);
  return {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 6379,
    password: url.password || undefined,
  };
}

// Jobs enqueued here are processed by apps/worker (Fabric writes).
export const fabricQueue = new Queue('fabric-writes', { connection: redisConnection() });
