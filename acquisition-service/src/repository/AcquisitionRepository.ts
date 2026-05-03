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
  // rich property + unit metadata
  property_developer: string | null;
  property_name: string | null;
  property_type: string | null;
  property_code: string | null;
  city: string | null;
  currency: string | null;
  registration: string | null;
  created_by: string | null;
  unit_id: string | null;
  unit_code: string | null;
  unit_area: string | null;
  bedroom_type: string | null;
  unit_address: string | null;
  bathrooms: number | null;
  view: string | null;
  furniture: string | null;
  facility: string | null;
  picture_urls: string[] | null;
  cost: string | null;
  min_sale_price: string | null;
  price: string | null;
  sale_team_lead: string | null;
  commission: string | null;
  external_status: string | null;
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
  a.propertyDeveloper = row.property_developer ?? undefined;
  a.propertyName = row.property_name ?? undefined;
  a.propertyType = row.property_type ?? undefined;
  a.propertyCode = row.property_code ?? undefined;
  a.city = row.city ?? undefined;
  a.currency = row.currency ?? undefined;
  a.registration = row.registration ?? undefined;
  a.createdBy = row.created_by ?? undefined;
  a.unitId = row.unit_id ?? undefined;
  a.unitCode = row.unit_code ?? undefined;
  a.unitArea = row.unit_area !== null ? Number(row.unit_area) : undefined;
  a.bedroomType = row.bedroom_type ?? undefined;
  a.unitAddress = row.unit_address ?? undefined;
  a.bathrooms = row.bathrooms ?? undefined;
  a.view = row.view ?? undefined;
  a.furniture = row.furniture ?? undefined;
  a.facility = row.facility ?? undefined;
  a.pictureUrls = row.picture_urls ?? undefined;
  a.cost = row.cost !== null ? Number(row.cost) : undefined;
  a.minSalePrice = row.min_sale_price !== null ? Number(row.min_sale_price) : undefined;
  a.price = row.price !== null ? Number(row.price) : undefined;
  a.saleTeamLead = row.sale_team_lead ?? undefined;
  a.commission = row.commission !== null ? Number(row.commission) : undefined;
  a.externalStatus = row.external_status ?? undefined;
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
        `INSERT INTO acquisitions (
            acquisition_id, status, version, created_at, approved_at,
            survey_id, property_id, address, area_sqm, estimated_value, zone_type,
            seller_id, seller_name, seller_contact, willing_contract_id,
            property_developer, property_name, property_type, property_code,
            city, currency, registration, created_by,
            unit_id, unit_code, unit_area, bedroom_type, unit_address,
            bathrooms, view, furniture, facility, picture_urls,
            cost, min_sale_price, price, sale_team_lead, commission, external_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
                 $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,
                 $29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39)
         ON CONFLICT (acquisition_id) DO UPDATE SET
           status = EXCLUDED.status,
           version = EXCLUDED.version,
           approved_at = EXCLUDED.approved_at,
           willing_contract_id = EXCLUDED.willing_contract_id,
           property_developer = COALESCE(EXCLUDED.property_developer, acquisitions.property_developer),
           property_name = COALESCE(EXCLUDED.property_name, acquisitions.property_name),
           property_type = COALESCE(EXCLUDED.property_type, acquisitions.property_type),
           property_code = COALESCE(EXCLUDED.property_code, acquisitions.property_code),
           city = COALESCE(EXCLUDED.city, acquisitions.city),
           currency = COALESCE(EXCLUDED.currency, acquisitions.currency),
           registration = COALESCE(EXCLUDED.registration, acquisitions.registration),
           created_by = COALESCE(EXCLUDED.created_by, acquisitions.created_by),
           unit_id = COALESCE(EXCLUDED.unit_id, acquisitions.unit_id),
           unit_code = COALESCE(EXCLUDED.unit_code, acquisitions.unit_code),
           unit_area = COALESCE(EXCLUDED.unit_area, acquisitions.unit_area),
           bedroom_type = COALESCE(EXCLUDED.bedroom_type, acquisitions.bedroom_type),
           unit_address = COALESCE(EXCLUDED.unit_address, acquisitions.unit_address),
           bathrooms = COALESCE(EXCLUDED.bathrooms, acquisitions.bathrooms),
           view = COALESCE(EXCLUDED.view, acquisitions.view),
           furniture = COALESCE(EXCLUDED.furniture, acquisitions.furniture),
           facility = COALESCE(EXCLUDED.facility, acquisitions.facility),
           picture_urls = COALESCE(EXCLUDED.picture_urls, acquisitions.picture_urls),
           cost = COALESCE(EXCLUDED.cost, acquisitions.cost),
           min_sale_price = COALESCE(EXCLUDED.min_sale_price, acquisitions.min_sale_price),
           price = COALESCE(EXCLUDED.price, acquisitions.price),
           sale_team_lead = COALESCE(EXCLUDED.sale_team_lead, acquisitions.sale_team_lead),
           commission = COALESCE(EXCLUDED.commission, acquisitions.commission),
           external_status = COALESCE(EXCLUDED.external_status, acquisitions.external_status)`,
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
          a.propertyDeveloper ?? null,
          a.propertyName ?? null,
          a.propertyType ?? null,
          a.propertyCode ?? null,
          a.city ?? null,
          a.currency ?? null,
          a.registration ?? null,
          a.createdBy ?? null,
          a.unitId ?? null,
          a.unitCode ?? null,
          a.unitArea ?? null,
          a.bedroomType ?? null,
          a.unitAddress ?? null,
          a.bathrooms ?? null,
          a.view ?? null,
          a.furniture ?? null,
          a.facility ?? null,
          a.pictureUrls ?? null,
          a.cost ?? null,
          a.minSalePrice ?? null,
          a.price ?? null,
          a.saleTeamLead ?? null,
          a.commission ?? null,
          a.externalStatus ?? null,
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
