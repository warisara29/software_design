import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { producer } from '../kafka/client.js';

export const testRouter = Router();

/**
 * Simulator: publish sale.booked.complete (Sales' schema)
 *
 * Mimics the actual event Sales would publish — string codes for IDs,
 * full booking detail including KYC + property info.
 *
 * Body: optional override of any field
 */
testRouter.post('/api/test/booking-confirmed', async (req, res) => {
  const reservationCount = Math.floor(Math.random() * 1000);
  const payload = {
    ProjectName: req.body?.ProjectName ?? 'The Riverside Condo',
    'Reservation ID': req.body?.['Reservation ID'] ?? `RSV-${reservationCount.toString().padStart(4, '0')}`,
    ContractID: req.body?.ContractID ?? `CT-${reservationCount.toString().padStart(4, '0')}`,
    PropertyID: req.body?.PropertyID ?? 'PROP-001',
    Location: req.body?.Location ?? '123 Sukhumvit Rd, Bangkok',
    'Customer ID': req.body?.['Customer ID'] ?? 'CUST-001',
    'Area unit/layout': req.body?.['Area unit/layout'] ?? '1-bedroom 35sqm',
    'room type': req.body?.['room type'] ?? 'Standard',
    'Price per unit': req.body?.['Price per unit'] ?? 5_500_000,
    'room number': req.body?.['room number'] ?? '12-01',
    StatusKYC: req.body?.StatusKYC ?? 'PASSED',
    PaymentSecondStatus: req.body?.PaymentSecondStatus ?? 'PENDING',
  };

  await producer.send({
    topic: config.topics.bookingConfirmed,
    messages: [{ key: payload.ContractID, value: JSON.stringify(payload) }],
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
