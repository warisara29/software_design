import { pool, withTx } from '../db.js';
import { Contract } from '../domain/Contract.js';
import { ContractDraft } from '../domain/ContractDraft.js';
import { ContractParties } from '../domain/ContractParties.js';
import { ContractStatus } from '../domain/ContractStatus.js';

interface ContractRow {
  contract_id: string;
  status: string;
  version: number;
  template_id: string | null;
  created_at: Date;
  booking_id: string;
  customer_id: string;
  unit_id: string;
  buyer_id: string | null;
  seller_id: string | null;
  total_price: string | null;
  deposit_amount: string | null;
  penalty_conditions: string | null;
  draft_id: string | null;
  // joined
  draft_file_url?: string | null;
  draft_template_id?: string | null;
  draft_drafted_at?: Date | null;
}

const SELECT_WITH_DRAFT = `
  SELECT c.*,
         d.file_url    AS draft_file_url,
         d.template_id AS draft_template_id,
         d.drafted_at  AS draft_drafted_at
  FROM contracts c
  LEFT JOIN contract_drafts d ON d.draft_id = c.draft_id
`;

function rowToContract(row: ContractRow): Contract {
  const c = new Contract();
  c.contractId = row.contract_id;
  c.status = row.status as ContractStatus;
  c.version = row.version;
  c.templateId = row.template_id ?? '';
  c.createdAt = row.created_at.toISOString();
  c.bookingId = row.booking_id;
  c.customerId = row.customer_id;
  c.unitId = row.unit_id;
  if (row.buyer_id && row.seller_id) {
    c.parties = new ContractParties(row.buyer_id, row.seller_id);
  }
  if (row.draft_id && row.draft_drafted_at) {
    c.contractDraft = ContractDraft.rehydrate(
      row.draft_id,
      row.draft_template_id ?? '',
      row.draft_file_url ?? '',
      row.draft_drafted_at.toISOString(),
    );
  }
  return c;
}

export const ContractRepository = {
  async save(c: Contract): Promise<Contract> {
    await withTx(async (client) => {
      if (c.contractDraft) {
        await client.query(
          `INSERT INTO contract_drafts (draft_id, file_url, template_id, drafted_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (draft_id) DO NOTHING`,
          [
            c.contractDraft.draftId,
            c.contractDraft.fileUrl,
            c.contractDraft.templateId,
            c.contractDraft.draftedAt,
          ],
        );
      }
      await client.query(
        `INSERT INTO contracts (contract_id, status, version, template_id, created_at,
                                booking_id, customer_id, unit_id, buyer_id, seller_id, draft_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (contract_id) DO UPDATE SET
           status = EXCLUDED.status,
           version = EXCLUDED.version,
           draft_id = EXCLUDED.draft_id`,
        [
          c.contractId,
          c.status,
          c.version,
          c.templateId,
          c.createdAt,
          c.bookingId,
          c.customerId,
          c.unitId,
          c.parties?.buyerId ?? null,
          c.parties?.sellerId ?? null,
          c.contractDraft?.draftId ?? null,
        ],
      );
    });
    return c;
  },

  async findById(id: string): Promise<Contract | null> {
    const result = await pool.query<ContractRow>(
      `${SELECT_WITH_DRAFT} WHERE c.contract_id = $1`,
      [id],
    );
    return result.rowCount ? rowToContract(result.rows[0]) : null;
  },

  async findByCustomerId(customerId: string): Promise<Contract[]> {
    const result = await pool.query<ContractRow>(
      `${SELECT_WITH_DRAFT} WHERE c.customer_id = $1`,
      [customerId],
    );
    return result.rows.map(rowToContract);
  },

  async findAll(): Promise<Contract[]> {
    const result = await pool.query<ContractRow>(SELECT_WITH_DRAFT);
    return result.rows.map(rowToContract);
  },
};
