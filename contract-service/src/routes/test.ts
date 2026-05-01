import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { producer } from '../kafka/client.js';

export const testRouter = Router();

/**
 * Simulator: publish booking.order.confirmed
 */
testRouter.post('/api/test/booking-confirmed', async (req, res) => {
  const bookingId = req.body?.bookingId ?? uuidv4();
  const unitId = req.body?.unitId ?? uuidv4();
  const customerId = req.body?.customerId ?? uuidv4();

  const payload = JSON.stringify({ bookingId, unitId, customerId });
  await producer.send({
    topic: config.topics.bookingConfirmed,
    messages: [{ key: bookingId, value: payload }],
  });

  res.json({
    message: `${config.topics.bookingConfirmed} event sent`,
    bookingId,
    unitId,
    customerId,
  });
});
