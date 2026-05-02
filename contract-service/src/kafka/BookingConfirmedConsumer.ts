import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { consumer } from './client.js';
import { ContractDraftService, type BookingConfirmedEvent } from '../service/ContractDraftService.js';
import {
  PurchaseContractDraftedProducer,
  WillingContractDraftedProducer,
  PropertyLeaseInspectedProducer,
} from './ContractDraftCreatedProducer.js';
import {
  isSaleBookedCompleteEvent,
  mapSaleBookedToBookingConfirmed,
  normalizeSalesEvent,
} from '../event/SaleBookedCompleteEvent.js';

const BOOKING_TOPIC = config.topics.bookingConfirmed;

/**
 * Flow 2 — Selling Property (KYC bypass mode)
 *
 * sale.booked.complete (Sales) →
 *   1. Legal drafts willing contract       → publish willing.contract.drafted
 *   2. Legal inspects property + lease     → publish property.lease.inspected
 *   3. Legal drafts purchase contract      → publish contract.drafted
 *
 * KYC step (ceo.kyc.completed) is intentionally bypassed — Legal proceeds
 * immediately after booking, all 3 events fire from a single consumer run.
 */
export async function startBookingConfirmedConsumer(): Promise<void> {
  try {
    await consumer.subscribe({ topic: BOOKING_TOPIC, fromBeginning: false });
  } catch (err) {
    console.warn(
      `[Kafka] Consumer subscription failed — topics may not exist yet. Service keeps running, REST API works.`,
      (err as Error).message,
    );
    return;
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const raw = message.value?.toString() ?? '';
      console.log(`[Consumer] ← ${topic}: ${raw}`);
      try {
        if (topic === BOOKING_TOPIC) {
          await handleBookingConfirmed(raw);
        }
      } catch (err) {
        console.error(`[Consumer] failed to process ${topic}:`, err);
      }
    },
  });
}

async function handleBookingConfirmed(raw: string): Promise<void> {
  const parsed = JSON.parse(raw);

  let event: BookingConfirmedEvent;
  if (isSaleBookedCompleteEvent(parsed)) {
    event = mapSaleBookedToBookingConfirmed(normalizeSalesEvent(parsed));
  } else {
    event = parsed as BookingConfirmedEvent;
  }
  const draftCreated = await ContractDraftService.createContractDraft(event);

  // Flow 2 event 6 — willing-to-buy contract drafted
  await WillingContractDraftedProducer.send({
    willingContractId: uuidv4(),
    contractId: draftCreated.contractId,
    bookingId: draftCreated.bookingId,
    unitId: draftCreated.unitId,
    customerId: draftCreated.customerId,
    fileUrl: draftCreated.fileUrl,
    draftedAt: draftCreated.draftedAt,
    projectName: draftCreated.projectName,
    location: draftCreated.location,
    areaUnit: draftCreated.areaUnit,
    roomType: draftCreated.roomType,
    roomNumber: draftCreated.roomNumber,
    totalPrice: draftCreated.totalPrice,
    statusKyc: draftCreated.statusKyc,
    paymentSecondStatus: draftCreated.paymentSecondStatus,
    secondPayment: draftCreated.secondPayment,
  });
  console.log(
    `[Flow 2] ✅ DONE publish willing.contract.drafted — contractId=${draftCreated.contractId}`,
  );

  // KYC bypass — proceed immediately with property+lease inspection
  // (CEO KYC step skipped; Legal continues straight to next stages)

  // Flow 2 event 8 — property + lease inspected
  await PropertyLeaseInspectedProducer.send({
    inspectionId: uuidv4(),
    contractId: draftCreated.contractId,
    unitId: draftCreated.unitId,
    hasOutstandingLease: false,
    hasEncumbrance: false,
    inspectionResult: 'PASS',
    notes: 'Property title clean; no outstanding lease or encumbrance found',
    inspectedAt: new Date().toISOString(),
  });
  console.log(
    `[Flow 2] ✅ DONE publish property.lease.inspected — contractId=${draftCreated.contractId}`,
  );

  // Flow 2 event 9 — purchase contract drafted (สัญญาขายจริง)
  await PurchaseContractDraftedProducer.send({
    contractId: draftCreated.contractId,
    bookingId: draftCreated.bookingId,
    unitId: draftCreated.unitId,
    customerId: draftCreated.customerId,
    status: draftCreated.status,
    fileUrl: draftCreated.fileUrl,
    templateId: draftCreated.templateId,
    createdAt: draftCreated.createdAt,
    draftedAt: draftCreated.draftedAt,
  });
  console.log(
    `[Flow 2] ✅ DONE publish contract.drafted (purchase contract) — contractId=${draftCreated.contractId}`,
  );
}
