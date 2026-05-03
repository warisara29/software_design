import { pool } from '../db.js';
import { InspectionResult } from '../domain/InspectionResult.js';
import { PropertyInspection } from '../domain/PropertyInspection.js';

interface PropertyInspectionRow {
  inspection_id: string;
  contract_id: string;
  unit_id: string;
  inspected_by: string;
  status: string | null;
  has_outstanding_lease: boolean | null;
  has_encumbrance: boolean | null;
  notes: string | null;
  inspected_at: Date | null;
  created_at: Date;
  version: number;
}

function rowToInspection(row: PropertyInspectionRow): PropertyInspection {
  const i = new PropertyInspection();
  i.inspectionId = row.inspection_id;
  i.contractId = row.contract_id;
  i.unitId = row.unit_id;
  i.inspectedBy = row.inspected_by;
  i.createdAt = row.created_at.toISOString();
  i.version = row.version;
  if (row.status && row.inspected_at) {
    i.result = new InspectionResult(
      row.status as 'PASS' | 'FAIL',
      Boolean(row.has_outstanding_lease),
      Boolean(row.has_encumbrance),
      row.notes ?? '',
    );
    i.inspectedAt = row.inspected_at.toISOString();
  }
  return i;
}

export const PropertyInspectionRepository = {
  async save(i: PropertyInspection): Promise<PropertyInspection> {
    await pool.query(
      `INSERT INTO property_inspections (
          inspection_id, contract_id, unit_id, inspected_by,
          status, has_outstanding_lease, has_encumbrance, notes,
          inspected_at, created_at, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (inspection_id) DO UPDATE SET
          status = EXCLUDED.status,
          has_outstanding_lease = EXCLUDED.has_outstanding_lease,
          has_encumbrance = EXCLUDED.has_encumbrance,
          notes = EXCLUDED.notes,
          inspected_at = EXCLUDED.inspected_at,
          version = EXCLUDED.version`,
      [
        i.inspectionId,
        i.contractId,
        i.unitId,
        i.inspectedBy,
        i.result?.status ?? null,
        i.result?.hasOutstandingLease ?? null,
        i.result?.hasEncumbrance ?? null,
        i.result?.notes ?? null,
        i.inspectedAt ?? null,
        i.createdAt,
        i.version,
      ],
    );
    return i;
  },

  async findByContractId(contractId: string): Promise<PropertyInspection | null> {
    const r = await pool.query<PropertyInspectionRow>(
      `SELECT * FROM property_inspections WHERE contract_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [contractId],
    );
    return r.rowCount ? rowToInspection(r.rows[0]) : null;
  },

  async findAll(): Promise<PropertyInspection[]> {
    const r = await pool.query<PropertyInspectionRow>(
      `SELECT * FROM property_inspections ORDER BY created_at DESC`,
    );
    return r.rows.map(rowToInspection);
  },
};
