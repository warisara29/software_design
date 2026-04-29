import { Router } from 'express';
import { AcquisitionStatus } from '../domain/AcquisitionStatus.js';
import { AcquisitionRepository } from '../repository/AcquisitionRepository.js';
import type { Acquisition } from '../domain/Acquisition.js';

export const queryRouter = Router();

function toView(a: Acquisition) {
  return {
    acquisitionId: a.acquisitionId,
    status: a.status,
    surveyId: a.surveyId,
    propertyId: a.propertyId,
    address: a.survey?.address ?? null,
    areaSqm: a.survey?.areaSqm ?? null,
    estimatedValue: a.survey?.estimatedValue ?? null,
    zoneType: a.survey?.zoneType ?? null,
    sellerId: a.seller?.sellerId ?? null,
    sellerName: a.seller?.sellerName ?? null,
    createdAt: a.createdAt,
    approvedAt: a.approvedAt ?? null,
    willingContract: a.willingContract
      ? {
          willingContractId: a.willingContract.willingContractId,
          fileUrl: a.willingContract.fileUrl,
          agreedPrice: a.willingContract.agreedPrice,
          templateId: a.willingContract.templateId,
          draftedAt: a.willingContract.draftedAt,
        }
      : null,
  };
}

queryRouter.get('/api/acquisitions/:id', async (req, res) => {
  const a = await AcquisitionRepository.findById(req.params.id);
  if (!a) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(toView(a));
});

queryRouter.get('/api/acquisitions', async (req, res) => {
  const status = req.query.status as string | undefined;
  if (status) {
    if (!(status in AcquisitionStatus)) {
      res.status(400).json({
        error: `Invalid status. Allowed: ${Object.values(AcquisitionStatus).join(', ')}`,
      });
      return;
    }
    const list = await AcquisitionRepository.findByStatus(status as AcquisitionStatus);
    res.json(list.map(toView));
    return;
  }
  const all = await AcquisitionRepository.findAll();
  res.json(all.map(toView));
});
