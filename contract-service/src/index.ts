import express from 'express';
import { config } from './config.js';
import { initSchema } from './db.js';
import { consumer, kafka, producer } from './kafka/client.js';
import { startBookingConfirmedConsumer } from './kafka/BookingConfirmedConsumer.js';
import { testRouter } from './routes/test.js';
import { queryRouter } from './routes/query.js';

async function ensureTopics(): Promise<void> {
  const admin = kafka.admin();
  try {
    await admin.connect();
    const topics = Object.values(config.topics);
    await admin.createTopics({
      topics: topics.map((topic) => ({ topic, numPartitions: 1, replicationFactor: 1 })),
      waitForLeaders: false,
    });
    console.log(`[Admin] Topics ensured: ${topics.join(', ')}`);
  } catch (err) {
    console.warn(`[Admin] Topic ensure skipped:`, (err as Error).message);
  } finally {
    await admin.disconnect();
  }
}

async function main(): Promise<void> {
  console.log(`[Boot] Starting ${config.serviceName} on port ${config.port}`);

  await initSchema();

  try {
    await ensureTopics();
    await producer.connect();
    await consumer.connect();
    // Background — don't block boot if topics don't exist yet
    startBookingConfirmedConsumer().catch((err) =>
      console.warn('[Kafka] Consumer crashed:', (err as Error).message),
    );
  } catch (err) {
    console.warn('[Kafka] Setup failed — REST API still works:', (err as Error).message);
  }

  const app = express();
  app.use(express.json());
  app.use(testRouter);
  app.use(queryRouter);
  app.get('/health', (_req, res) => res.json({ status: 'UP', service: config.serviceName }));

  app.listen(config.port, () => {
    console.log(`[Boot] ${config.serviceName} ready on http://localhost:${config.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[Shutdown] ${signal} received`);
    try {
      await consumer.disconnect();
      await producer.disconnect();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[Boot] fatal:', err);
  process.exit(1);
});
