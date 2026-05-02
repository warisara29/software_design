import { Router } from 'express';
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
