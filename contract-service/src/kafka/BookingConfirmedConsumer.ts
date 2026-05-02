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
  isReadyForPurchaseContract,
  isSaleBookedCompleteEvent,
  mapSaleBookedToBookingConfirmed,
  type SaleBookedCompleteEvent,
} from '../event/SaleBookedCompleteEvent.js';
import {
  isCeoKycCompletedEvent,
  isKycApproved,
  type CeoKycCompletedEvent,
} from '../event/CeoKycCompletedEvent.js';
import { ContractRepository } from '../repository/ContractRepository.js';
import { coerceToUuid } from '../util/idCoerce.js';

const BOOKING_TOPIC = config.topics.bookingConfirmed;
const KYC_TOPIC = config.topics.ceoKycCompleted;

/**
 * Flow 2 — Selling Property
 *
 * 1. sale.booked.complete (Sales)
 *    → Legal drafts willing contract (publishes willing.contract.drafted)
 *    → If status=SOLD also publishes contract.drafted (final purchase contract)
 *
 * 2. ceo.kyc.completed (CEO)
 *    → If KYC approved → Legal inspects property + lease
 *      (publishes property.lease.inspected)
 */
export async function startBookingConfirmedConsumer(): Promise<void> {
  try {
    await consumer.subscribe({ topic: BOOKING_TOPIC, fromBeginning: false });
    await consumer.subscribe({ topic: KYC_TOPIC, fromBeginning: false });
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
        } else if (topic === KYC_TOPIC) {
          await handleKycCompleted(raw);
        }
      } catch (err) {
        console.error(`[Consumer] failed to process ${topic}:`, err);
      }
    },
  });
}

async function handleBookingConfirmed(raw: string): Promise<void> {
  const parsed = JSON.parse(raw);
  const isSales = isSaleBookedCompleteEvent(parsed);

  // Booking → Legal drafts willing contract immediately
  // (KYC happens later, by CEO. Property+lease inspection waits for KYC.)
  const event: BookingConfirmedEvent = isSales
    ? mapSaleBookedToBookingConfirmed(parsed as SaleBookedCompleteEvent)
    : (parsed as BookingConfirmedEvent);
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
  });
  console.log(
    `[Flow 2] ✅ DONE publish willing.contract.drafted — contractId=${draftCreated.contractId}`,
  );

  console.log(
    `[Flow 2] ⏸ property.lease.inspected รอ ceo.kyc.completed จาก CEO ก่อน`,
  );

  // Flow 2 event 9 — purchase contract drafted (final), gated on status=SOLD
  if (isSales) {
    const sales = parsed as SaleBookedCompleteEvent;
    if (!isReadyForPurchaseContract(sales)) {
      console.log(
        `[Flow 2] ⏸ purchase contract not drafted yet — status=${sales.status} (need SOLD).`,
      );
      return;
    }
  }

  await PurchaseContractDraftedProducer.send(draftCreated);
  console.log(
    `[Flow 2] ✅ DONE publish contract.drafted (status=SOLD) — contractId=${draftCreated.contractId}`,
  );
}

async function handleKycCompleted(raw: string): Promise<void> {
  const parsed = JSON.parse(raw);

  if (!isCeoKycCompletedEvent(parsed)) {
    console.warn(`[Flow 2] ceo.kyc.completed schema not recognized — skipped`);
    return;
  }
  const kyc = parsed as CeoKycCompletedEvent;

  if (!isKycApproved(kyc)) {
    console.log(
      `[Flow 2] ⏸ KYC not approved (status=${kyc.kycStatus ?? kyc.status ?? kyc.result}) — skipping property+lease inspection`,
    );
    return;
  }

  // Find the contract this KYC refers to
  let contract = null;
  if (kyc.contractId) {
    const contractUuid = coerceToUuid(kyc.contractId);
    contract = await ContractRepository.findById(contractUuid);
  }
  if (!contract && kyc.customerId) {
    const customerUuid = coerceToUuid(kyc.customerId);
    const list = await ContractRepository.findByCustomerId(customerUuid);
    contract = list.length > 0 ? list[list.length - 1] : null; // latest
  }

  if (!contract) {
    console.warn(
      `[Flow 2] ⚠️ KYC approved but no matching contract found — contractId=${kyc.contractId}, customerId=${kyc.customerId}`,
    );
    return;
  }

  console.log(
    `[Flow 2] ✅ KYC approved — proceeding with property+lease inspection for contractId=${contract.contractId}`,
  );

  await PropertyLeaseInspectedProducer.send({
    inspectionId: uuidv4(),
    contractId: contract.contractId,
    unitId: contract.unitId,
    hasOutstandingLease: false,
    hasEncumbrance: false,
    inspectionResult: 'PASS',
    notes: 'Property title clean; no outstanding lease or encumbrance found',
    inspectedAt: new Date().toISOString(),
  });
  console.log(
    `[Flow 2] ✅ DONE publish property.lease.inspected — contractId=${contract.contractId}`,
  );
}
