import { v4 as uuidv4 } from 'uuid';
import { AcquisitionStatus } from './AcquisitionStatus.js';
import { PropertySurvey } from './PropertySurvey.js';
import { SellerInfo } from './SellerInfo.js';
import { WillingContract } from './WillingContract.js';

/**
 * Aggregate Root: Acquisition
 * ครอบคลุม lifecycle การเข้าซื้อ property:
 *   SURVEYED → APPROVAL_REQUESTED → APPROVED → CONTRACT_DRAFTED
 * ทุก Command ต้องผ่าน Acquisition Root
 */
export class Acquisition {
  acquisitionId!: string;
  status!: AcquisitionStatus;
  version: number = 0;
  createdAt!: string;
  approvedAt?: string;
  surveyId!: string;
  propertyId!: string;
  survey!: PropertySurvey;
  seller!: SellerInfo;
  willingContract?: WillingContract;
  // Rich property + unit metadata captured from CEO's survey
  propertyDeveloper?: string;
  propertyName?: string;
  propertyType?: string;
  propertyCode?: string;
  city?: string;
  currency?: string;
  registration?: string;
  createdBy?: string;
  unitId?: string;
  unitCode?: string;
  unitArea?: number;
  bedroomType?: string;
  unitAddress?: string;
  bathrooms?: number;
  view?: string;
  furniture?: string;
  facility?: string;
  pictureUrls?: string[];
  cost?: number;
  minSalePrice?: number;
  price?: number;
  saleTeamLead?: string;
  commission?: number;
  externalStatus?: string;

  /**
   * Factory: เริ่ม acquisition จาก property.surveyed event
   */
  static fromSurvey(input: {
    surveyId: string;
    propertyId: string;
    survey: PropertySurvey;
    seller: SellerInfo;
  }): Acquisition {
    const a = new Acquisition();
    a.acquisitionId = uuidv4();
    a.surveyId = input.surveyId;
    a.propertyId = input.propertyId;
    a.survey = input.survey;
    a.seller = input.seller;
    a.status = AcquisitionStatus.SURVEYED;
    a.createdAt = new Date().toISOString();
    return a;
  }

  /**
   * Command: RequestApproval
   */
  requestApproval(): void {
    if (this.status !== AcquisitionStatus.SURVEYED) {
      throw new Error(`Cannot request approval — status must be SURVEYED but was ${this.status}`);
    }
    this.status = AcquisitionStatus.APPROVAL_REQUESTED;
  }

  /**
   * Command: ApproveAcquisition
   */
  approve(): void {
    if (this.status !== AcquisitionStatus.APPROVAL_REQUESTED) {
      throw new Error(`Cannot approve — status must be APPROVAL_REQUESTED but was ${this.status}`);
    }
    this.status = AcquisitionStatus.APPROVED;
    this.approvedAt = new Date().toISOString();
  }

  /**
   * Command: DraftWillingContract
   * Business Rule: ต้องอนุมัติแล้วเท่านั้นจึงร่างสัญญาจะซื้อจะขายได้
   */
  draftWillingContract(templateId: string, fileUrl: string, agreedPrice: number): WillingContract {
    if (this.status !== AcquisitionStatus.APPROVED) {
      throw new Error(`Cannot draft willing contract — status must be APPROVED but was ${this.status}`);
    }
    this.willingContract = WillingContract.create(templateId, fileUrl, agreedPrice);
    this.status = AcquisitionStatus.CONTRACT_DRAFTED;
    return this.willingContract;
  }
}
