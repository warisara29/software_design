import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { producer } from '../kafka/client.js';
import { config } from '../config.js';
import { Acquisition } from '../domain/Acquisition.js';
import { AcquisitionStatus } from '../domain/AcquisitionStatus.js';
import { PropertySurvey } from '../domain/PropertySurvey.js';
import { SellerInfo } from '../domain/SellerInfo.js';
import { AcquisitionRepository } from '../repository/AcquisitionRepository.js';

export const debugRouter = Router();

/**
 * Seed mock acquisitions directly into DB (bypasses Kafka).
 * Creates acquisitions in different states so teams can test ?status= filter.
 *
 *   curl -X POST https://<service>/api/debug/seed
 */
debugRouter.post('/api/debug/seed', async (_req, res) => {
  const samples = [
    {
      address: '123 Sukhumvit Rd, Bangkok',
      areaSqm: 150.5,
      estimatedValue: 5_500_000,
      sellerName: 'Mr. Somchai',
      targetStatus: AcquisitionStatus.SURVEYED,
    },
    {
      address: '456 Sathorn Rd, Bangkok',
      areaSqm: 220,
      estimatedValue: 8_900_000,
      sellerName: 'Ms. Pranee',
      targetStatus: AcquisitionStatus.APPROVAL_REQUESTED,
    },
    {
      address: '789 Phaholyothin Rd, Bangkok',
      areaSqm: 180,
      estimatedValue: 6_750_000,
      sellerName: 'Mr. Anan',
      targetStatus: AcquisitionStatus.APPROVED,
    },
    {
      address: '101 Ratchada Rd, Bangkok',
      areaSqm: 95,
      estimatedValue: 3_200_000,
      sellerName: 'Ms. Wanida',
      targetStatus: AcquisitionStatus.CONTRACT_DRAFTED,
    },
  ];

  const created: { acquisitionId: string; status: string; address: string }[] = [];
  for (const s of samples) {
    const survey = new PropertySurvey(s.address, s.areaSqm, s.estimatedValue, 'RESIDENTIAL');
    const seller = new SellerInfo(uuidv4(), s.sellerName, '+6681234' + Math.floor(Math.random() * 10000));
    const a = Acquisition.fromSurvey({
      surveyId: uuidv4(),
      propertyId: uuidv4(),
      survey,
      seller,
    });

    // advance state to match target
    if (
      s.targetStatus === AcquisitionStatus.APPROVAL_REQUESTED ||
      s.targetStatus === AcquisitionStatus.APPROVED ||
      s.targetStatus === AcquisitionStatus.CONTRACT_DRAFTED
    ) {
      a.requestApproval();
    }
    if (
      s.targetStatus === AcquisitionStatus.APPROVED ||
      s.targetStatus === AcquisitionStatus.CONTRACT_DRAFTED
    ) {
      a.approve();
    }
    if (s.targetStatus === AcquisitionStatus.CONTRACT_DRAFTED) {
      a.draftWillingContract(
        uuidv4(),
        `https://storage.realestate.com/willing-contracts/seed-${a.acquisitionId}.pdf`,
        s.estimatedValue,
      );
    }

    await AcquisitionRepository.save(a);
    created.push({ acquisitionId: a.acquisitionId, status: a.status, address: s.address });
  }

  res.json({ ok: true, seeded: created.length, acquisitions: created });
});

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
