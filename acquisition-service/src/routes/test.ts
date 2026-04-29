import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { producer } from '../kafka/client.js';

export const testRouter = Router();

testRouter.post('/api/test/property-surveyed', async (req, res) => {
  const surveyId = req.body?.surveyId ?? uuidv4();
  const propertyId = req.body?.propertyId ?? uuidv4();
  const sellerId = req.body?.sellerId ?? uuidv4();

  const payload = {
    surveyId,
    propertyId,
    address: '123 Sukhumvit Rd',
    areaSqm: 150.5,
    estimatedValue: 5_500_000,
    zoneType: 'RESIDENTIAL',
    sellerId,
    sellerName: 'Mr. Somchai',
    sellerContact: '+66812345678',
  };

  await producer.send({
    topic: config.topics.propertySurveyed,
    messages: [{ key: surveyId, value: JSON.stringify(payload) }],
  });

  res.json({
    message: `${config.topics.propertySurveyed} event sent`,
    surveyId,
    propertyId,
    sellerId,
  });
});

testRouter.post('/api/test/acquisition-approved', async (req, res) => {
  const acquisitionId = req.body?.acquisitionId;
  if (!acquisitionId) {
    res.status(400).json({ error: 'acquisitionId is required' });
    return;
  }
  const approvedPrice = req.body?.approvedPrice ?? 5_500_000;
  const approvedBy = req.body?.approvedBy ?? 'CEO-001';

  const payload = { acquisitionId, approvedPrice, approvedBy };

  await producer.send({
    topic: config.topics.acquisitionApproved,
    messages: [{ key: acquisitionId, value: JSON.stringify(payload) }],
  });

  res.json({
    message: `${config.topics.acquisitionApproved} event sent`,
    acquisitionId,
  });
});
