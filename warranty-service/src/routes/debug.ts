import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { producer } from '../kafka/client.js';
import { config } from '../config.js';
import { Warranty } from '../domain/Warranty.js';
import { CoveragePeriod } from '../domain/CoveragePeriod.js';
import { CoverageScope } from '../domain/CoverageScope.js';
import { DefectCategory } from '../domain/DefectCategory.js';
import { WarrantyRepository } from '../repository/WarrantyRepository.js';

export const debugRouter = Router();

/**
 * Seed mock warranties + claims directly into DB (bypasses Kafka).
 * Creates warranties with mix of pending/covered/rejected claims.
 *
 *   curl -X POST https://<service>/api/debug/seed
 */
debugRouter.post('/api/debug/seed', async (_req, res) => {
  const ONE_YEAR_MS = 365 * 24 * 3600 * 1000;
  const now = new Date();

  const samples = [
    { unitLabel: 'Unit A1', defectCategory: DefectCategory.ELECTRICAL, daysAgo: 10 },
    { unitLabel: 'Unit B2', defectCategory: DefectCategory.PLUMBING, daysAgo: 30 },
    { unitLabel: 'Unit C3', defectCategory: DefectCategory.STRUCTURAL, daysAgo: 5 },
  ];

  const created: { warrantyId: string; contractId: string; unitId: string; claims: number }[] = [];
  for (const s of samples) {
    const period = new CoveragePeriod(
      new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString(),
      new Date(now.getTime() + ONE_YEAR_MS).toISOString(),
    );
    const scope = new CoverageScope([
      DefectCategory.STRUCTURAL,
      DefectCategory.ELECTRICAL,
      DefectCategory.PLUMBING,
      DefectCategory.FINISHING,
    ]);

    const warranty = Warranty.register({
      contractId: uuidv4(),
      unitId: uuidv4(),
      customerId: uuidv4(),
      period,
      scope,
    });

    // attach 1 claim per warranty
    const reportedAt = new Date(now.getTime() - s.daysAgo * 24 * 3600 * 1000).toISOString();
    warranty.verifyClaim({
      defectId: uuidv4(),
      defectCategory: s.defectCategory,
      description: `Sample defect in ${s.unitLabel} (${s.defectCategory.toLowerCase()})`,
      reportedAt,
    });

    await WarrantyRepository.save(warranty);
    created.push({
      warrantyId: warranty.warrantyId,
      contractId: warranty.contractId,
      unitId: warranty.unitId,
      claims: warranty.claims.length,
    });
  }

  res.json({ ok: true, seeded: created.length, warranties: created });
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
