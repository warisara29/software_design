import { v4 as uuidv4 } from 'uuid';
import { Acquisition } from '../domain/Acquisition.js';
import { PropertySurvey } from '../domain/PropertySurvey.js';
import { SellerInfo } from '../domain/SellerInfo.js';
import { AcquisitionRepository } from '../repository/AcquisitionRepository.js';
import { coerceToUuid } from '../util/idCoerce.js';

export type { PropertySurveyedEvent } from '../event/PropertySurveyedEvent.js';
import type { PropertySurveyedEvent } from '../event/PropertySurveyedEvent.js';

export interface AcquisitionApprovalRequestedEvent {
  acquisitionId: string;
  surveyId: string;
  propertyId: string;
  address: string;
  estimatedValue: number;
  sellerName: string;
  requestedAt: string;
}

export interface AcquisitionApprovedEvent {
  acquisitionId: string;
  approvedPrice?: number;
  approvedBy?: string;
}

export interface AcquisitionContractDraftedEvent {
  acquisitionId: string;
  willingContractId: string;
  propertyId: string;
  fileUrl: string;
  agreedPrice: number;
  templateId: string;
  draftedAt: string;
}

export const AcquisitionService = {
  /**
   * Command: ReceiveSurvey + RequestApproval
   */
  async receiveSurvey(event: PropertySurveyedEvent): Promise<AcquisitionApprovalRequestedEvent> {
    console.log(
      `[Command] ReceiveSurvey — propertyId=${event.propertyId}, name=${event.propertyName ?? 'n/a'}, price=${event.price ?? 'n/a'}`,
    );

    // Coerce string codes (e.g. CEO sends "PROP-001") to deterministic UUIDs
    const surveyId = coerceToUuid(event.surveyId ?? event.propertyId);
    const propertyId = coerceToUuid(event.propertyId);
    const sellerId = event.sellerId ? coerceToUuid(event.sellerId) : uuidv4();

    // Backfill from new schema where fields differ in name
    const address = event.propertyAddress ?? event.address ?? '';
    const areaSqm = event.unitArea ?? event.areaSqm ?? 0;
    const estimatedValue = event.price ?? event.estimatedValue ?? 0;
    const zoneType = event.zoneType ?? event.propertyType ?? '';
    const sellerName = event.sellerName ?? event.propertyDeveloper ?? '';
    const sellerContact = event.sellerContact ?? '';

    const survey = new PropertySurvey(address, areaSqm, estimatedValue, zoneType);
    const seller = new SellerInfo(sellerId, sellerName, sellerContact);

    const acquisition = Acquisition.fromSurvey({
      surveyId,
      propertyId,
      survey,
      seller,
    });
    // Capture rich property + unit + pricing metadata
    acquisition.propertyDeveloper = event.propertyDeveloper;
    acquisition.propertyName = event.propertyName;
    acquisition.propertyType = event.propertyType;
    acquisition.propertyCode = event.propertyCode;
    acquisition.city = event.city;
    acquisition.currency = event.currency;
    acquisition.registration = event.registration;
    acquisition.createdBy = event.createdBy;
    acquisition.unitId = event.unitId ? coerceToUuid(event.unitId) : undefined;
    acquisition.unitCode = event.unitCode;
    acquisition.unitArea = event.unitArea;
    acquisition.bedroomType = event.bedroomType;
    acquisition.unitAddress = event.unitAddress;
    acquisition.bathrooms = event.bathrooms;
    acquisition.view = event.view;
    acquisition.furniture = event.furniture;
    acquisition.facility = event.facility;
    acquisition.pictureUrls = event.pictureUrls;
    acquisition.cost = event.cost;
    acquisition.minSalePrice = event.minSalePrice;
    acquisition.price = event.price;
    acquisition.saleTeamLead = event.saleTeamLead;
    acquisition.commission = event.commission;
    acquisition.externalStatus = event.status;

    acquisition.requestApproval();
    await AcquisitionRepository.save(acquisition);

    console.log(
      `[Domain Event] AcquisitionApprovalRequested: acquisitionId=${acquisition.acquisitionId}, status=${acquisition.status}`,
    );

    return {
      acquisitionId: acquisition.acquisitionId,
      surveyId: acquisition.surveyId,
      propertyId: acquisition.propertyId,
      address: survey.address,
      estimatedValue: survey.estimatedValue,
      sellerName: seller.sellerName,
      requestedAt: acquisition.createdAt,
    };
  },

  /**
   * Command: ApproveAcquisition + DraftWillingContract
   */
  async draftContractAfterApproval(event: AcquisitionApprovedEvent): Promise<AcquisitionContractDraftedEvent> {
    console.log(`[Command] DraftWillingContract — acquisitionId=${event.acquisitionId}`);

    const acquisition = await AcquisitionRepository.findById(event.acquisitionId);
    if (!acquisition) {
      throw new Error(`Acquisition not found: ${event.acquisitionId}`);
    }

    acquisition.approve();

    const templateId = uuidv4();
    const fileUrl = `https://storage.realestate.com/willing-contracts/draft-${uuidv4()}.pdf`;
    const agreedPrice = event.approvedPrice ?? acquisition.survey.estimatedValue;

    const willingContract = acquisition.draftWillingContract(templateId, fileUrl, agreedPrice);
    await AcquisitionRepository.save(acquisition);

    console.log(
      `[Domain Event] AcquisitionContractDrafted: acquisitionId=${acquisition.acquisitionId}, willingContractId=${willingContract.willingContractId}`,
    );

    return {
      acquisitionId: acquisition.acquisitionId,
      willingContractId: willingContract.willingContractId,
      propertyId: acquisition.propertyId,
      fileUrl: willingContract.fileUrl,
      agreedPrice: willingContract.agreedPrice,
      templateId: willingContract.templateId,
      draftedAt: willingContract.draftedAt,
    };
  },
};
