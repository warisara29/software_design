import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { producer } from '../kafka/client.js';

export const testRouter = Router();

/**
 * Simulator: publish sale.booked.complete
 *
 * Mock payload uses already-coerced UUIDs (contractId, bookingId, unitId,
 * customerId) plus secondPayment — matches the format that the downstream
 * contract.drafted event carries.
 *
 * Body: optional override of any field
 */
testRouter.post('/api/test/booking-confirmed', async (req, res) => {
  const now = new Date().toISOString();
  const draftId = uuidv4();
  const payload = {
    contractId: req.body?.contractId ?? uuidv4(),
    bookingId: req.body?.bookingId ?? 'f625036d-3942-5a4a-bc42-823f56e6b1c1',
    unitId: req.body?.unitId ?? 'd097741b-5be0-509a-8216-b6d7a2f437b4',
    customerId: req.body?.customerId ?? '6cbd2556-41e0-5510-a08f-95a2450f7406',
    status: req.body?.status ?? 'DRAFT',
    fileUrl:
      req.body?.fileUrl ?? `https://storage.realestate.com/contracts/draft-${draftId}.pdf`,
    templateId: req.body?.templateId ?? uuidv4(),
    createdAt: req.body?.createdAt ?? now,
    draftedAt: req.body?.draftedAt ?? now,
    secondPayment:
      req.body?.secondPayment ?? Math.floor(Math.random() * 200_000_000) + 1_000_000,
  };

  await producer.send({
    topic: config.topics.bookingConfirmed,
    messages: [{ key: payload.contractId, value: JSON.stringify(payload) }],
  });

  res.json({
    message: `${config.topics.bookingConfirmed} event sent`,
    payload,
  });
});

/**
 * Simulator: publish ceo.kyc.completed
 *
 * Backup สำหรับ Demo — ใช้เผื่อทีม CEO ยังไม่ publish event นี้
 * Trigger Stage 2 ของ Flow 2: Legal จะ publish property.lease.inspected + contract.drafted
 *
 * Body (all optional — มี default ให้):
 *   - contractId   : UUID ของสัญญาที่ผ่าน Stage 1 มาแล้ว
 *   - customerId   : UUID ลูกค้า (ใช้ค้น contract ล่าสุดถ้าไม่ส่ง contractId)
 *   - kycStatus    : "APPROVED" | "REJECTED" | "PASSED" | ... (default: APPROVED)
 *   - verifiedAt   : ISO8601 (default: now)
 */
testRouter.post('/api/test/ceo-kyc-completed', async (req, res) => {
  const payload = {
    contractId: req.body?.contractId,
    customerId: req.body?.customerId,
    kycStatus: req.body?.kycStatus ?? 'APPROVED',
    verifiedAt: req.body?.verifiedAt ?? new Date().toISOString(),
    // include some optional fields เผื่ออ่านง่าย
    kycId: req.body?.kycId ?? uuidv4(),
    verifiedBy: req.body?.verifiedBy ?? 'ceo-test-simulator',
  };

  if (!payload.contractId && !payload.customerId) {
    return res.status(400).json({
      error: 'Provide at least one of: contractId, customerId',
      hint: 'POST {"contractId":"<uuid>"} or {"customerId":"<uuid>","kycStatus":"APPROVED"}',
    });
  }

  await producer.send({
    topic: config.topics.ceoKycCompleted,
    messages: [
      {
        key: payload.contractId ?? payload.customerId ?? payload.kycId,
        value: JSON.stringify(payload),
      },
    ],
  });

  res.json({
    message: `${config.topics.ceoKycCompleted} event sent`,
    payload,
    nextStep:
      'Legal consumer จะ subscribe → ถ้า KYC=APPROVED → publish property.lease.inspected + contract.drafted',
  });
});
