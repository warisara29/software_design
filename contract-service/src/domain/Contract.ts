import { v4 as uuidv4 } from 'uuid';
import { ContractDraft } from './ContractDraft.js';
import { ContractParties } from './ContractParties.js';
import { ContractStatus } from './ContractStatus.js';
import { ContractTerms } from './ContractTerms.js';

/**
 * Aggregate Root: Contract
 * ควบคุม lifecycle ทั้งหมด ทุก Command ต้องผ่าน Contract เสมอ
 * ครอบคลุม ContractDraft, PurchaseAgreement และ ContractSigning ทั้งหมด
 */
export class Contract {
  contractId!: string;
  status!: ContractStatus;
  version: number = 0;
  templateId!: string;
  createdAt!: string;
  bookingId!: string;
  customerId!: string;
  unitId!: string;
  parties?: ContractParties;
  terms?: ContractTerms;
  contractDraft?: ContractDraft;
  // Booking metadata captured from Sales' sale.booked.complete
  projectName?: string;
  location?: string;
  areaUnit?: string;
  roomType?: string;
  roomNumber?: string;
  totalPrice?: number;
  statusKyc?: string;
  paymentSecondStatus?: string;
  secondPayment?: number;
  // Internal-only: distinguishes willing-to-buy vs final purchase contract.
  // Stored in DB so we can list "all willing contracts" or "all purchase contracts"
  // separately. Not exposed in outbound events — other teams keep their existing schemas.
  contractKind?: 'WILLING' | 'PURCHASE';

  /**
   * Command: CreateContractDraft
   * สร้าง Contract aggregate พร้อม ContractDraft entity
   * Business Rule: ต้องมี KYC = APPROVED ก่อน (ตรวจที่ Policy layer)
   */
  static createContractDraft(input: {
    bookingId: string;
    customerId: string;
    unitId: string;
    templateId: string;
    parties: ContractParties;
    fileUrl: string;
    contractKind?: 'WILLING' | 'PURCHASE';
    projectName?: string;
    location?: string;
    areaUnit?: string;
    roomType?: string;
    roomNumber?: string;
    totalPrice?: number;
    statusKyc?: string;
    paymentSecondStatus?: string;
    secondPayment?: number;
  }): Contract {
    const c = new Contract();
    c.contractId = uuidv4();
    c.bookingId = input.bookingId;
    c.customerId = input.customerId;
    c.unitId = input.unitId;
    c.templateId = input.templateId;
    c.status = ContractStatus.DRAFT;
    c.createdAt = new Date().toISOString();
    c.parties = input.parties;
    c.contractDraft = ContractDraft.create(input.templateId, input.fileUrl);
    c.contractKind = input.contractKind;
    c.projectName = input.projectName;
    c.location = input.location;
    c.areaUnit = input.areaUnit;
    c.roomType = input.roomType;
    c.roomNumber = input.roomNumber;
    c.totalPrice = input.totalPrice;
    c.statusKyc = input.statusKyc;
    c.paymentSecondStatus = input.paymentSecondStatus;
    c.secondPayment = input.secondPayment;
    return c;
  }
}
