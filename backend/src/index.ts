import './lib/env';
import logger from './lib/logger';
import { startScheduler } from './services/scheduler';
import { prisma } from './lib/prisma';

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Connected to database');

    // Start the scheduler
    const scheduler = startScheduler();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      scheduler.stop();
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down...');
      scheduler.stop();
      await prisma.$disconnect();
      process.exit(0);
    });

    logger.info('SYB Prayer Times scheduler is running');
  } catch (error) {
    logger.error('Failed to start scheduler', { error });
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();