import { CoveragePeriod } from '../domain/CoveragePeriod.js';
import { CoverageScope } from '../domain/CoverageScope.js';
import { DefectCategory, parseDefectCategory } from '../domain/DefectCategory.js';
import { Warranty } from '../domain/Warranty.js';
import { WarrantyRepository } from '../repository/WarrantyRepository.js';

export interface WarrantyRegisteredEvent {
  contractId: string;
  unitId: string;
  customerId: string;
  startsAt: string;
  endsAt: string;
  coveredCategories?: string[];
}

export interface DefectReportedEvent {
  defectId: string;
  contractId: string;
  unitId: string;
  customerId: string;
  defectCategory: string;
  description: string;
  reportedAt?: string;
}

export interface WarrantyVerifiedEvent {
  claimId: string;
  warrantyId: string;
  defectId: string;
  contractId: string;
  unitId: string;
  customerId: string;
  coverageStatus: string;
  coverageReason?: string;
  verifiedAt?: string;
  expiresAt: string;
}

const ONE_YEAR_SECONDS = 365 * 24 * 3600;

export const WarrantyVerificationService = {
  async registerWarranty(event: WarrantyRegisteredEvent): Promise<Warranty> {
    console.log(`[Command] RegisterWarranty — contractId=${event.contractId}, unitId=${event.unitId}`);

    const period = new CoveragePeriod(event.startsAt, event.endsAt);
    const categories = (event.coveredCategories ?? Object.values(DefectCategory)).map((c) =>
      parseDefectCategory(c),
    );
    const scope = new CoverageScope(categories);

    const warranty = Warranty.register({
      contractId: event.contractId,
      unitId: event.unitId,
      customerId: event.customerId,
      period,
      scope,
    });
    await WarrantyRepository.save(warranty);

    console.log(`[Domain Event] WarrantyRegistered: warrantyId=${warranty.warrantyId}`);
    return warranty;
  },

  async verifyDefect(event: DefectReportedEvent): Promise<WarrantyVerifiedEvent> {
    console.log(`[Command] VerifyClaim — defectId=${event.defectId}, contractId=${event.contractId}`);

    let warranty = await WarrantyRepository.findByContractId(event.contractId);
    if (!warranty) {
      console.warn(
        `[Service] No warranty found for contractId=${event.contractId}, creating default 1y full-scope warranty`,
      );
      const now = new Date();
      const ends = new Date(now.getTime() + ONE_YEAR_SECONDS * 1000);
      const period = new CoveragePeriod(now.toISOString(), ends.toISOString());
      const scope = new CoverageScope(Object.values(DefectCategory));
      warranty = Warranty.register({
        contractId: event.contractId,
        unitId: event.unitId,
        customerId: event.customerId,
        period,
        scope,
      });
      await WarrantyRepository.save(warranty);
    }

    const category = parseDefectCategory(event.defectCategory);
    const reportedAt = event.reportedAt ?? new Date().toISOString();

    const claim = warranty.verifyClaim({
      defectId: event.defectId,
      defectCategory: category,
      description: event.description,
      reportedAt,
    });
    await WarrantyRepository.save(warranty);

    console.log(
      `[Domain Event] WarrantyVerified: claimId=${claim.claimId}, status=${claim.coverageStatus}, reason=${claim.coverageReason}`,
    );

    return {
      claimId: claim.claimId,
      warrantyId: warranty.warrantyId,
      defectId: claim.defectId,
      contractId: warranty.contractId,
      unitId: warranty.unitId,
      customerId: warranty.customerId,
      coverageStatus: claim.coverageStatus,
      coverageReason: claim.coverageReason,
      verifiedAt: claim.verifiedAt,
      expiresAt: warranty.coveragePeriod.endsAt,
    };
  },
};
