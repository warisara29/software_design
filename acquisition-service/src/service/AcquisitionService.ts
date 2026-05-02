import { v4 as uuidv4 } from 'uuid';
import { Acquisition } from '../domain/Acquisition.js';
import { PropertySurvey } from '../domain/PropertySurvey.js';
import { SellerInfo } from '../domain/SellerInfo.js';
import { AcquisitionRepository } from '../repository/AcquisitionRepository.js';
import { coerceToUuid } from '../util/idCoerce.js';

export interface PropertySurveyedEvent {
  surveyId: string;
  propertyId: string;
  address: string;
  areaSqm: number;
  estimatedValue: number;
  zoneType: string;
  sellerId?: string;
  sellerName: string;
  sellerContact: string;
}

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
    console.log(`[Command] ReceiveSurvey — surveyId=${event.surveyId}, propertyId=${event.propertyId}`);

    // Coerce string codes (e.g. CEO sends "PROP-001") to deterministic UUIDs
    const surveyId = coerceToUuid(event.surveyId);
    const propertyId = coerceToUuid(event.propertyId);
    const sellerId = event.sellerId ? coerceToUuid(event.sellerId) : uuidv4();

    const survey = new PropertySurvey(event.address ?? '', event.areaSqm ?? 0, event.estimatedValue ?? 0, event.zoneType ?? '');
    const seller = new SellerInfo(sellerId, event.sellerName ?? '', event.sellerContact ?? '');

    const acquisition = Acquisition.fromSurvey({
      surveyId,
      propertyId,
      survey,
      seller,
    });
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
