import { v4 as uuidv4 } from 'uuid';

/**
 * Entity: WillingContract
 * ร่างสัญญาจะซื้อจะขาย ที่ Legal ทำขึ้นเพื่อซื้อ property จาก seller
 * อยู่ภายใน Acquisition Aggregate
 */
export class WillingContract {
  willingContractId: string;
  fileUrl: string;
  agreedPrice: number;
  templateId: string;
  draftedAt: string;

  private constructor(
    willingContractId: string,
    templateId: string,
    fileUrl: string,
    agreedPrice: number,
    draftedAt: string,
  ) {
    this.willingContractId = willingContractId;
    this.templateId = templateId;
    this.fileUrl = fileUrl;
    this.agreedPrice = agreedPrice;
    this.draftedAt = draftedAt;
  }

  static create(templateId: string, fileUrl: string, agreedPrice: number): WillingContract {
    return new WillingContract(uuidv4(), templateId, fileUrl, agreedPrice, new Date().toISOString());
  }

  static rehydrate(
    willingContractId: string,
    templateId: string,
    fileUrl: string,
    agreedPrice: number,
    draftedAt: string,
  ): WillingContract {
    return new WillingContract(willingContractId, templateId, fileUrl, agreedPrice, draftedAt);
  }
}
