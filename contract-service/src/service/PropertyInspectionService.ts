import { InspectionResult } from '../domain/InspectionResult.js';
import { PropertyInspection } from '../domain/PropertyInspection.js';
import { PropertyInspectionRepository } from '../repository/PropertyInspectionRepository.js';
import type { PropertyLeaseInspectedEvent } from '../event/PropertyLeaseInspectedEvent.js';

export interface InspectInput {
  contractId: string;
  unitId: string;
  /** Default: 'legal-contract-service' (auto from system). */
  inspectedBy?: string;
  /** Default: PASS. Override for FAIL test cases. */
  result?: InspectionResult;
}

/**
 * Application Service for the property + lease inspection bounded context.
 *
 * Handles the Command "InspectProperty" — produces the domain event
 * PropertyLeaseInspected which is then published via Kafka producer.
 */
export const PropertyInspectionService = {
  async inspectProperty(input: InspectInput): Promise<PropertyLeaseInspectedEvent> {
    console.log(
      `[Command] InspectProperty — contractId=${input.contractId}, unitId=${input.unitId}`,
    );

    const inspection = PropertyInspection.start({
      contractId: input.contractId,
      unitId: input.unitId,
      inspectedBy: input.inspectedBy ?? 'legal-contract-service',
    });

    const result = input.result ?? InspectionResult.pass();
    inspection.complete(result);

    await PropertyInspectionRepository.save(inspection);

    console.log(
      `[Domain Event] PropertyLeaseInspected: inspectionId=${inspection.inspectionId}, status=${result.status}`,
    );

    return {
      inspectionId: inspection.inspectionId,
      contractId: inspection.contractId,
      unitId: inspection.unitId,
      hasOutstandingLease: result.hasOutstandingLease,
      hasEncumbrance: result.hasEncumbrance,
      inspectionResult: result.status,
      notes: result.notes,
      inspectedAt: inspection.inspectedAt!,
    };
  },
};
