import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { AI_GENERATION_QUEUE } from './queue.js';
import { logger } from '../utils/logger.js';

// Setup background worker
const worker = new Worker(AI_GENERATION_QUEUE, async (job) => {
  logger.info(`[Worker] Started processing job ${job.id} of type ${job.name}`);
  const { subjectId, chapterId, type } = job.data;

  try {
    // TODO: Integrate actual AI generation logic here (from content-pipeline)
    logger.info(`[Worker] Generating ${type} for ${subjectId} / ${chapterId}...`);
    
    // Simulating processing time
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    logger.info(`[Worker] Successfully completed job ${job.id}`);
    
    return { success: true, processedAt: new Date().toISOString() };
  } catch (error) {
    logger.error(`[Worker] Failed job ${job.id}: ${error.message}`);
    throw error; // Let BullMQ handle retries based on queue options
  }
}, {
  connection: redis,
  concurrency: 2 // Number of parallel jobs
});

worker.on('failed', (job, err) => {
  logger.error(`[Worker] Job ${job.id} has failed with ${err.message}`);
});

logger.info('[Worker] AI Generation worker is running and listening for jobs...');
