import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { consumer } from './client.js';
import { prettyJson } from './log.js';
import { ContractDraftService, type BookingConfirmedEvent } from '../service/ContractDraftService.js';
import {
  PurchaseContractDraftedProducer,
  WillingContractDraftedProducer,
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
 *   2. Legal drafts purchase contract      → publish contract.drafted
 *
 * KYC step (ceo.kyc.completed) is intentionally bypassed.
 * The property + lease inspection step lives in its own bounded
 * context — see PropertyLeaseInspectionConsumer, which subscribes
 * willing.contract.drafted on its own consumer-group and publishes
 * property.lease.inspected independently.
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
      console.log(`\n[Consumer] ← ${topic}\n${prettyJson(raw)}`);
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

  // Stage 1 — willing-to-buy contract (สัญญาจะซื้อจะขาย) — saves DB row with contract_kind=WILLING
  const willing = await ContractDraftService.createContractDraft(event, 'WILLING');

  // Flow 2 event 6 — willing.contract.drafted (schema unchanged — no contractKind in payload)
  await WillingContractDraftedProducer.send({
    willingContractId: uuidv4(),
    contractId: willing.contractId,
    bookingId: willing.bookingId,
    unitId: willing.unitId,
    customerId: willing.customerId,
    fileUrl: willing.fileUrl,
    draftedAt: willing.draftedAt,
    projectName: willing.projectName,
    location: willing.location,
    areaUnit: willing.areaUnit,
    roomType: willing.roomType,
    roomNumber: willing.roomNumber,
    totalPrice: willing.totalPrice,
    statusKyc: willing.statusKyc,
    paymentSecondStatus: willing.paymentSecondStatus,
    secondPayment: willing.secondPayment,
  });
  console.log(
    `[Flow 2] ✅ DONE publish willing.contract.drafted — contractId=${willing.contractId}`,
  );

  // KYC bypass — proceed immediately with the purchase contract.
  // (CEO KYC step is skipped; the property + lease inspection step is
  //  now owned by PropertyLeaseInspectionConsumer — it subscribes
  //  willing.contract.drafted and publishes property.lease.inspected
  //  on its own.)

  // Stage 2 — purchase contract (สัญญาขายจริง) — saves DB row with contract_kind=PURCHASE
  const purchase = await ContractDraftService.createContractDraft(event, 'PURCHASE');

  // Flow 2 event 9 — contract.drafted (schema unchanged — no contractKind in payload)
  await PurchaseContractDraftedProducer.send(purchase);
  console.log(
    `[Flow 2] ✅ DONE publish contract.drafted (purchase contract) — contractId=${purchase.contractId}`,
  );
}
