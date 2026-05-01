import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { producer } from '../kafka/client.js';
import { config } from '../config.js';
import { Contract } from '../domain/Contract.js';
import { ContractParties } from '../domain/ContractParties.js';
import { ContractRepository } from '../repository/ContractRepository.js';

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
/**
 * Seed mock contracts directly into DB (bypasses Kafka).
 * Lets other teams query GET endpoints with real data while waiting
 * for the admin to create Kafka topics.
 *
 *   curl -X POST https://<service>/api/debug/seed
 */
debugRouter.post('/api/debug/seed', async (_req, res) => {
  const samples = [
    { customerName: 'Mr. Somchai',  bookingId: '11111111-1111-4111-8111-111111111111' },
    { customerName: 'Ms. Lalita',   bookingId: '22222222-2222-4222-8222-222222222222' },
    { customerName: 'Mr. Anan',     bookingId: '33333333-3333-4333-8333-333333333333' },
  ];

  const created: { contractId: string; bookingId: string; customerId: string }[] = [];
  for (const s of samples) {
    const customerId = uuidv4();
    const contract = Contract.createContractDraft({
      bookingId: s.bookingId,
      customerId,
      unitId: uuidv4(),
      templateId: uuidv4(),
      parties: new ContractParties(customerId, uuidv4()),
      fileUrl: `https://storage.realestate.com/contracts/seed-${customerId}.pdf`,
    });
    await ContractRepository.save(contract);
    created.push({
      contractId: contract.contractId,
      bookingId: contract.bookingId,
      customerId: contract.customerId,
    });
  }

  res.json({ ok: true, seeded: created.length, contracts: created });
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
