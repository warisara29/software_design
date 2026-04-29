import { v4 as uuidv4 } from 'uuid';

/**
 * Entity: ContractDraft
 * ร่างสัญญาจะซื้อจะขาย — สร้างเมื่อ KYC ผ่านและ booking confirmed
 * อยู่ภายใน Contract Aggregate access ผ่าน Contract Root เท่านั้น
 */
export class ContractDraft {
  draftId: string;
  fileUrl: string;
  templateId: string;
  draftedAt: string;

  private constructor(draftId: string, templateId: string, fileUrl: string, draftedAt: string) {
    this.draftId = draftId;
    this.templateId = templateId;
    this.fileUrl = fileUrl;
    this.draftedAt = draftedAt;
  }

  static create(templateId: string, fileUrl: string): ContractDraft {
    return new ContractDraft(uuidv4(), templateId, fileUrl, new Date().toISOString());
  }

  static rehydrate(draftId: string, templateId: string, fileUrl: string, draftedAt: string): ContractDraft {
    return new ContractDraft(draftId, templateId, fileUrl, draftedAt);
  }
}
