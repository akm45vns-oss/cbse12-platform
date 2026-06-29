import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export const AI_GENERATION_QUEUE = 'ai-generation';

export const aiQueue = new Queue(AI_GENERATION_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: true, // Don't bloat Redis with finished jobs
    removeOnFail: false, // Keep failed jobs for inspection
  }
});
