import { Router } from 'express';
import { producer } from '../kafka/client.js';
import { config } from '../config.js';

export const debugRouter = Router();

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
