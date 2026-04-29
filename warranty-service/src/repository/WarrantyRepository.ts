import { pool, withTx } from '../db.js';
import { Warranty } from '../domain/Warranty.js';
import { CoveragePeriod } from '../domain/CoveragePeriod.js';
import { CoverageScope } from '../domain/CoverageScope.js';
import { WarrantyClaim } from '../domain/WarrantyClaim.js';
import type { DefectCategory } from '../domain/DefectCategory.js';
import type { CoverageStatus } from '../domain/CoverageStatus.js';

interface WarrantyRow {
  warranty_id: string;
  version: number;
  contract_id: string;
  unit_id: string;
  customer_id: string;
  starts_at: Date;
  ends_at: Date;
  registered_at: Date;
}

interface ScopeRow {
  category: string;
}

interface ClaimRow {
  claim_id: string;
  warranty_id: string;
  defect_id: string;
  defect_category: string;
  description: string | null;
  reported_at: Date;
  coverage_status: string;
  coverage_reason: string | null;
  verified_at: Date | null;
}

async function loadWarranty(row: WarrantyRow): Promise<Warranty> {
  const w = new Warranty();
  w.warrantyId = row.warranty_id;
  w.version = row.version;
  w.contractId = row.contract_id;
  w.unitId = row.unit_id;
  w.customerId = row.customer_id;
  w.coveragePeriod = new CoveragePeriod(row.starts_at.toISOString(), row.ends_at.toISOString());
  w.registeredAt = row.registered_at.toISOString();

  const scopeResult = await pool.query<ScopeRow>(
    `SELECT category FROM warranty_scope WHERE warranty_id = $1`,
    [row.warranty_id],
  );
  w.coverageScope = new CoverageScope(scopeResult.rows.map((r) => r.category as DefectCategory));

  const claimResult = await pool.query<ClaimRow>(
    `SELECT * FROM warranty_claims WHERE warranty_id = $1`,
    [row.warranty_id],
  );
  w.claims = claimResult.rows.map(
    (c) =>
      new WarrantyClaim(
        c.claim_id,
        c.defect_id,
        c.defect_category as DefectCategory,
        c.description ?? '',
        c.reported_at.toISOString(),
        c.coverage_status as CoverageStatus,
        c.coverage_reason ?? undefined,
        c.verified_at ? c.verified_at.toISOString() : undefined,
      ),
  );
  return w;
}

export const WarrantyRepository = {
  async save(w: Warranty): Promise<Warranty> {
    await withTx(async (client) => {
      await client.query(
        `INSERT INTO warranties (warranty_id, version, contract_id, unit_id, customer_id,
                                  starts_at, ends_at, registered_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (warranty_id) DO UPDATE SET version = EXCLUDED.version`,
        [
          w.warrantyId,
          w.version,
          w.contractId,
          w.unitId,
          w.customerId,
          w.coveragePeriod.startsAt,
          w.coveragePeriod.endsAt,
          w.registeredAt,
        ],
      );
      for (const cat of w.coverageScope.toArray()) {
        await client.query(
          `INSERT INTO warranty_scope (warranty_id, category) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [w.warrantyId, cat],
        );
      }
      for (const claim of w.claims) {
        await client.query(
          `INSERT INTO warranty_claims (claim_id, warranty_id, defect_id, defect_category,
                                         description, reported_at, coverage_status, coverage_reason, verified_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (claim_id) DO UPDATE SET
             coverage_status = EXCLUDED.coverage_status,
             coverage_reason = EXCLUDED.coverage_reason,
             verified_at = EXCLUDED.verified_at`,
          [
            claim.claimId,
            w.warrantyId,
            claim.defectId,
            claim.defectCategory,
            claim.description,
            claim.reportedAt,
            claim.coverageStatus,
            claim.coverageReason ?? null,
            claim.verifiedAt ?? null,
          ],
        );
      }
    });
    return w;
  },

  async findById(id: string): Promise<Warranty | null> {
    const r = await pool.query<WarrantyRow>(`SELECT * FROM warranties WHERE warranty_id = $1`, [id]);
    return r.rowCount ? loadWarranty(r.rows[0]) : null;
  },

  async findByContractId(contractId: string): Promise<Warranty | null> {
    const r = await pool.query<WarrantyRow>(`SELECT * FROM warranties WHERE contract_id = $1`, [contractId]);
    return r.rowCount ? loadWarranty(r.rows[0]) : null;
  },
};
