import express from 'express';
import { config } from './config.js';
import { initSchema } from './db.js';
import { consumer, producer } from './kafka/client.js';
import { startBookingConfirmedConsumer } from './kafka/BookingConfirmedConsumer.js';
import { testRouter } from './routes/test.js';
import { queryRouter } from './routes/query.js';
import { debugRouter } from './routes/debug.js';
import { inboundRouter } from './routes/inbound.js';

async function main(): Promise<void> {
  console.log(`[Boot] Starting ${config.serviceName} on port ${config.port}`);

  await initSchema();

  try {
    // ensureTopics() ปิดไว้ — cluster กลางไม่อนุญาต auto-create
    // ต้องสร้าง topics ผ่าน Confluent UI / admin โดยตรง
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
  app.use(debugRouter);
  app.use(inboundRouter);
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
