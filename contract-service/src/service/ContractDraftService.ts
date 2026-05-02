import { v4 as uuidv4 } from 'uuid';
import { Contract } from '../domain/Contract.js';
import { ContractParties } from '../domain/ContractParties.js';
import { ContractRepository } from '../repository/ContractRepository.js';
import { coerceToUuid } from '../util/idCoerce.js';

export interface BookingConfirmedEvent {
  bookingId: string;
  unitId: string;
  customerId: string;
}

export interface ContractDraftCreatedEvent {
  contractId: string;
  bookingId: string;
  unitId: string;
  customerId: string;
  status: string;
  fileUrl: string;
  templateId: string;
  createdAt: string;
  draftedAt: string;
}

/**
 * Application Service สำหรับ Command: CreateContractDraft
 * รับ BookingConfirmedEvent → สร้าง Contract aggregate → คืน ContractDraftCreated event
 */
export const ContractDraftService = {
  async createContractDraft(event: BookingConfirmedEvent): Promise<ContractDraftCreatedEvent> {
    console.log(
      `[Command] CreateContractDraft — bookingId=${event.bookingId}, unitId=${event.unitId}, customerId=${event.customerId}`,
    );

    // Coerce string codes (e.g. "PROP-001") to deterministic UUIDs
    const bookingId = coerceToUuid(event.bookingId);
    const unitId = coerceToUuid(event.unitId);
    const customerId = coerceToUuid(event.customerId);

    // VOs
    const sellerId = uuidv4();
    const parties = new ContractParties(customerId, sellerId);

    // Factory method (Aggregate Root)
    const templateId = uuidv4();
    const fileUrl = `https://storage.realestate.com/contracts/draft-${uuidv4()}.pdf`;

    const contract = Contract.createContractDraft({
      bookingId,
      customerId,
      unitId,
      templateId,
      parties,
      fileUrl,
    });
    await ContractRepository.save(contract);

    console.log(`[Domain Event] ContractDraftCreated: contractId=${contract.contractId}, status=DRAFT`);

    return {
      contractId: contract.contractId,
      bookingId: contract.bookingId,
      unitId: contract.unitId,
      customerId: contract.customerId,
      status: contract.status,
      fileUrl: contract.contractDraft!.fileUrl,
      templateId: contract.templateId,
      createdAt: contract.createdAt,
      draftedAt: contract.contractDraft!.draftedAt,
    };
  },
};
