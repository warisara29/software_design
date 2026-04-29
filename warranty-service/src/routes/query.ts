import { Router } from 'express';
import { WarrantyRepository } from '../repository/WarrantyRepository.js';
import type { Warranty } from '../domain/Warranty.js';
import type { WarrantyClaim } from '../domain/WarrantyClaim.js';

export const queryRouter = Router();

function claimView(c: WarrantyClaim) {
  return {
    claimId: c.claimId,
    defectId: c.defectId,
    defectCategory: c.defectCategory,
    description: c.description,
    reportedAt: c.reportedAt,
    coverageStatus: c.coverageStatus,
    coverageReason: c.coverageReason ?? null,
    verifiedAt: c.verifiedAt ?? null,
  };
}

function warrantyView(w: Warranty) {
  return {
    warrantyId: w.warrantyId,
    contractId: w.contractId,
    unitId: w.unitId,
    customerId: w.customerId,
    coverageStartsAt: w.coveragePeriod.startsAt,
    coverageEndsAt: w.coveragePeriod.endsAt,
    coveredCategories: w.coverageScope.toArray(),
    registeredAt: w.registeredAt,
    claims: w.claims.map(claimView),
  };
}

queryRouter.get('/api/warranties/:contractId', async (req, res) => {
  const w = await WarrantyRepository.findByContractId(req.params.contractId);
  if (!w) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(warrantyView(w));
});

queryRouter.get('/api/warranties/:warrantyId/claims', async (req, res) => {
  const w = await WarrantyRepository.findById(req.params.warrantyId);
  if (!w) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(w.claims.map(claimView));
});
