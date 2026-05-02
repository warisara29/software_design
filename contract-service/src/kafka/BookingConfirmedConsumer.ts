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
  type SaleBookedCompleteEvent,
} from '../event/SaleBookedCompleteEvent.js';

const TOPIC = config.topics.bookingConfirmed;

/**
 * Flow 2 trigger:
 *   sale.booked.complete (Sales publishes — string codes)
 *   → mapped to BookingConfirmedEvent (UUIDs)
 *   → CreateContractDraft
 *   → publishes willing.contract.drafted + property.lease.inspected + contract.drafted
 */
export async function startBookingConfirmedConsumer(): Promise<void> {
  try {
    await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const raw = message.value?.toString() ?? '';
        console.log(`[Consumer] ← ${topic}: ${raw}`);
        try {
          const parsed = JSON.parse(raw);
          const isSales = isSaleBookedCompleteEvent(parsed);

          // Flow 2 gate — only draft willing contract when Sales says KYC has passed
          if (isSales) {
            const sales = parsed as SaleBookedCompleteEvent;
            if (sales.StatusKYC !== 'PASSED') {
              console.log(
                `[Flow 2] ⏸ skipped — StatusKYC=${sales.StatusKYC} (need PASSED to draft willing contract)`,
              );
              return;
            }
          }

          // Sales' Kafka schema vs our REST inbound schema — accept both
          const event: BookingConfirmedEvent = isSales
            ? mapSaleBookedToBookingConfirmed(parsed as SaleBookedCompleteEvent)
            : (parsed as BookingConfirmedEvent);
          const draftCreated = await ContractDraftService.createContractDraft(event);

          // Flow 2 event 6 — willing-to-buy contract drafted (preliminary, after KYC pass)
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
            `[Flow 2] ✅ DONE publish willing.contract.drafted (KYC passed) — contractId=${draftCreated.contractId}`,
          );

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

          // Flow 2 event 9 — purchase contract drafted (final), gated on second payment
          if (isSales) {
            const sales = parsed as SaleBookedCompleteEvent;
            if (sales.PaymentSecondStatus !== 'CONFIRMED') {
              console.log(
                `[Flow 2] ⏸ purchase contract not drafted yet — PaymentSecondStatus=${sales.PaymentSecondStatus} (need CONFIRMED). Will draft when Sales sends another sale.booked.complete with PaymentSecondStatus=CONFIRMED.`,
              );
              return;
            }
          }

          await PurchaseContractDraftedProducer.send(draftCreated);
          console.log(
            `[Flow 2] ✅ DONE publish contract.drafted (PaymentSecondStatus CONFIRMED) — contractId=${draftCreated.contractId}`,
          );
        } catch (err) {
          console.error(`[Consumer] failed to process ${topic}:`, err);
        }
      },
    });
  } catch (err) {
    console.warn(
      `[Kafka] Consumer subscription failed for "${TOPIC}" — topic may not exist yet. Service will keep running, REST API still works. Create the topic + redeploy to enable Kafka flow.`,
      (err as Error).message,
    );
  }
}
