import { Router } from 'express';
import { ContractRepository } from '../repository/ContractRepository.js';
import type { Contract } from '../domain/Contract.js';

export const queryRouter = Router();

function toView(c: Contract) {
  return {
    contractId: c.contractId,
    status: c.status,
    bookingId: c.bookingId,
    unitId: c.unitId,
    customerId: c.customerId,
    buyerId: c.parties?.buyerId ?? null,
    sellerId: c.parties?.sellerId ?? null,
    templateId: c.templateId,
    createdAt: c.createdAt,
    draft: c.contractDraft
      ? {
          draftId: c.contractDraft.draftId,
          fileUrl: c.contractDraft.fileUrl,
          templateId: c.contractDraft.templateId,
          draftedAt: c.contractDraft.draftedAt,
        }
      : null,
  };
}

queryRouter.get('/api/contracts/:id', async (req, res) => {
  const c = await ContractRepository.findById(req.params.id);
  if (!c) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(toView(c));
});

queryRouter.get('/api/contracts', async (req, res) => {
  const customerId = req.query.customerId as string | undefined;
  const list = customerId
    ? await ContractRepository.findByCustomerId(customerId)
    : await ContractRepository.findAll();
  res.json(list.map(toView));
});
