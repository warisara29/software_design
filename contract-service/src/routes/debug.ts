import { Router } from 'express';
import { producer } from '../kafka/client.js';
import { config } from '../config.js';

export const debugRouter = Router();

/**
 * Smoke test for Confluent Cloud connectivity.
 * Hits the shared `project.release.create-topic` (the only auto-created
 * topic on the team's central cluster) so we can verify producer auth
 * + network without depending on Legal-owned topics existing yet.
 *
 * Usage:
 *   curl -X POST https://<service>.onrender.com/api/debug/kafka-ping
 */
debugRouter.post('/api/debug/kafka-ping', async (_req, res) => {
  const topic = 'project.release.create-topic';
  const payload = {
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    note: 'kafka-ping smoke test',
  };
  try {
    const recordMetadata = await producer.send({
      topic,
      messages: [{ key: 'smoke-test', value: JSON.stringify(payload) }],
    });
    res.json({ ok: true, topic, sent: payload, recordMetadata });
  } catch (err) {
    res.status(500).json({ ok: false, topic, error: (err as Error).message });
  }
});
