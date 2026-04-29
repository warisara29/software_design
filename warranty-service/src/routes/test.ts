import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { producer } from '../kafka/client.js';

export const testRouter = Router();

const ONE_YEAR_MS = 365 * 24 * 3600 * 1000;

testRouter.post('/api/test/warranty-registered', async (req, res) => {
  const contractId = req.body?.contractId ?? uuidv4();
  const unitId = req.body?.unitId ?? uuidv4();
  const customerId = req.body?.customerId ?? uuidv4();

  const now = new Date();
  const ends = new Date(now.getTime() + ONE_YEAR_MS);

  const payload = {
    contractId,
    unitId,
    customerId,
    startsAt: now.toISOString(),
    endsAt: ends.toISOString(),
    coveredCategories: ['STRUCTURAL', 'ELECTRICAL', 'PLUMBING', 'FINISHING'],
  };

  await producer.send({
    topic: config.topics.warrantyRegistered,
    messages: [{ key: contractId, value: JSON.stringify(payload) }],
  });

  res.json({
    message: `${config.topics.warrantyRegistered} event sent`,
    contractId,
    unitId,
    customerId,
  });
});

testRouter.post('/api/test/defect-reported', async (req, res) => {
  const defectId = req.body?.defectId ?? uuidv4();
  const contractId = req.body?.contractId ?? uuidv4();
  const unitId = req.body?.unitId ?? uuidv4();
  const customerId = req.body?.customerId ?? uuidv4();
  const defectCategory = req.body?.defectCategory ?? 'ELECTRICAL';
  const description = req.body?.description ?? 'Power outlet not working in living room';

  const payload = {
    defectId,
    contractId,
    unitId,
    customerId,
    defectCategory,
    description,
    reportedAt: new Date().toISOString(),
  };

  await producer.send({
    topic: config.topics.defectReported,
    messages: [{ key: defectId, value: JSON.stringify(payload) }],
  });

  res.json({
    message: `${config.topics.defectReported} event sent`,
    defectId,
    contractId,
    defectCategory,
  });
});
