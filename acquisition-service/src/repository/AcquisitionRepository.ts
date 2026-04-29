import { pool, withTx } from '../db.js';
import { Acquisition } from '../domain/Acquisition.js';
import { AcquisitionStatus } from '../domain/AcquisitionStatus.js';
import { PropertySurvey } from '../domain/PropertySurvey.js';
import { SellerInfo } from '../domain/SellerInfo.js';
import { WillingContract } from '../domain/WillingContract.js';

interface AcquisitionRow {
  acquisition_id: string;
  status: string;
  version: number;
  created_at: Date;
  approved_at: Date | null;
  survey_id: string;
  property_id: string;
  address: string | null;
  area_sqm: string | null;
  estimated_value: string | null;
  zone_type: string | null;
  seller_id: string | null;
  seller_name: string | null;
  seller_contact: string | null;
  willing_contract_id: string | null;
  // joined
  wc_file_url?: string | null;
  wc_agreed_price?: string | null;
  wc_template_id?: string | null;
  wc_drafted_at?: Date | null;
}

const SELECT_WITH_WC = `
  SELECT a.*,
         w.file_url     AS wc_file_url,
         w.agreed_price AS wc_agreed_price,
         w.template_id  AS wc_template_id,
         w.drafted_at   AS wc_drafted_at
  FROM acquisitions a
  LEFT JOIN willing_contracts w ON w.willing_contract_id = a.willing_contract_id
`;

function num(s: string | null): number {
  return s == null ? 0 : Number(s);
}

function rowToAcquisition(row: AcquisitionRow): Acquisition {
  const a = new Acquisition();
  a.acquisitionId = row.acquisition_id;
  a.status = row.status as AcquisitionStatus;
  a.version = row.version;
  a.createdAt = row.created_at.toISOString();
  a.approvedAt = row.approved_at ? row.approved_at.toISOString() : undefined;
  a.surveyId = row.survey_id;
  a.propertyId = row.property_id;
  a.survey = new PropertySurvey(
    row.address ?? '',
    num(row.area_sqm),
    num(row.estimated_value),
    row.zone_type ?? '',
  );
  a.seller = new SellerInfo(row.seller_id ?? '', row.seller_name ?? '', row.seller_contact ?? '');
  if (row.willing_contract_id && row.wc_drafted_at) {
    a.willingContract = WillingContract.rehydrate(
      row.willing_contract_id,
      row.wc_template_id ?? '',
      row.wc_file_url ?? '',
      num(row.wc_agreed_price ?? null),
      row.wc_drafted_at.toISOString(),
    );
  }
  return a;
}

export const AcquisitionRepository = {
  async save(a: Acquisition): Promise<Acquisition> {
    await withTx(async (client) => {
      if (a.willingContract) {
        await client.query(
          `INSERT INTO willing_contracts (willing_contract_id, file_url, agreed_price, template_id, drafted_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (willing_contract_id) DO NOTHING`,
          [
            a.willingContract.willingContractId,
            a.willingContract.fileUrl,
            a.willingContract.agreedPrice,
            a.willingContract.templateId,
            a.willingContract.draftedAt,
          ],
        );
      }
      await client.query(
        `INSERT INTO acquisitions (acquisition_id, status, version, created_at, approved_at,
                                    survey_id, property_id, address, area_sqm, estimated_value, zone_type,
                                    seller_id, seller_name, seller_contact, willing_contract_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (acquisition_id) DO UPDATE SET
           status = EXCLUDED.status,
           version = EXCLUDED.version,
           approved_at = EXCLUDED.approved_at,
           willing_contract_id = EXCLUDED.willing_contract_id`,
        [
          a.acquisitionId,
          a.status,
          a.version,
          a.createdAt,
          a.approvedAt ?? null,
          a.surveyId,
          a.propertyId,
          a.survey?.address ?? null,
          a.survey?.areaSqm ?? null,
          a.survey?.estimatedValue ?? null,
          a.survey?.zoneType ?? null,
          a.seller?.sellerId ?? null,
          a.seller?.sellerName ?? null,
          a.seller?.contactInfo ?? null,
          a.willingContract?.willingContractId ?? null,
        ],
      );
    });
    return a;
  },

  async findById(id: string): Promise<Acquisition | null> {
    const r = await pool.query<AcquisitionRow>(`${SELECT_WITH_WC} WHERE a.acquisition_id = $1`, [id]);
    return r.rowCount ? rowToAcquisition(r.rows[0]) : null;
  },

  async findBySurveyId(surveyId: string): Promise<Acquisition | null> {
    const r = await pool.query<AcquisitionRow>(`${SELECT_WITH_WC} WHERE a.survey_id = $1`, [surveyId]);
    return r.rowCount ? rowToAcquisition(r.rows[0]) : null;
  },

  async findByStatus(status: AcquisitionStatus): Promise<Acquisition[]> {
    const r = await pool.query<AcquisitionRow>(`${SELECT_WITH_WC} WHERE a.status = $1`, [status]);
    return r.rows.map(rowToAcquisition);
  },

  async findAll(): Promise<Acquisition[]> {
    const r = await pool.query<AcquisitionRow>(SELECT_WITH_WC);
    return r.rows.map(rowToAcquisition);
  },
};
