import { config } from '../config.js';
import { producer } from './client.js';
import type { ContractDraftCreatedEvent } from '../service/ContractDraftService.js';
import type { WillingContractDraftedEvent } from '../event/WillingContractDraftedEvent.js';
import type { PropertyLeaseInspectedEvent } from '../event/PropertyLeaseInspectedEvent.js';

/**
 * Flow 2 event 9 — purchase contract drafted (สัญญาซื้อขายจริง)
 * Subscribers: Payment, Post-sales
 */
export const PurchaseContractDraftedProducer = {
  async send(event: ContractDraftCreatedEvent): Promise<void> {
    const topic = config.topics.purchaseContractDrafted;
    await producer.send({
      topic,
      messages: [{ key: event.contractId, value: JSON.stringify(event) }],
    });
    console.log(`[Producer] → ${topic}: contractId=${event.contractId}`);
  },
};

/**
 * Flow 2 event 6 — willing-to-buy contract drafted (สัญญาจะซื้อจะขาย)
 */
export const WillingContractDraftedProducer = {
  async send(event: WillingContractDraftedEvent): Promise<void> {
    const topic = config.topics.willingContractDrafted;
    await producer.send({
      topic,
      messages: [{ key: event.contractId, value: JSON.stringify(event) }],
    });
    console.log(`[Producer] → ${topic}: contractId=${event.contractId}, willingContractId=${event.willingContractId}`);
  },
};

/**
 * Flow 2 event 8 — property and land lease inspected by Legal
 */
export const PropertyLeaseInspectedProducer = {
  async send(event: PropertyLeaseInspectedEvent): Promise<void> {
    const topic = config.topics.propertyLeaseInspected;
    await producer.send({
      topic,
      messages: [{ key: event.contractId, value: JSON.stringify(event) }],
    });
    console.log(`[Producer] → ${topic}: contractId=${event.contractId}, result=${event.inspectionResult}`);
  },
};

/**
 * @deprecated Use PurchaseContractDraftedProducer instead.
 * Alias kept for backward-compatibility — exports the same as Purchase variant.
 */
export const ContractDraftCreatedProducer = PurchaseContractDraftedProducer;
