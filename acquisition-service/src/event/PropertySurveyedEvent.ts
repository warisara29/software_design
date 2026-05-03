/**
 * Inbound event from CEO — ceo.property.survey.completed
 *
 * Accepts the rich schema CEO publishes (single object OR array of objects):
 *
 *   {
 *     propertyId, propertyDeveloper, propertyName, propertyType, propertyCode,
 *     location, city, propertyAddress, currency, registration,
 *     publishDate, createdDtm, createdBy, sellerId,
 *     unitId, unitCode, unitArea, bedroomType, unitAddress,
 *     bathrooms, view, furniture, facility, pictureUrls,
 *     cost, minSalePrice, price, saleTeamLead, commission, status
 *   }
 *
 * Most fields optional — Legal extracts what it needs and keeps the rest.
 */
export interface PropertySurveyedEvent {
  // IDs
  surveyId?: string;
  propertyId: string;
  // Property info
  propertyDeveloper?: string;
  propertyName?: string;
  propertyType?: string;
  propertyCode?: string;
  location?: string;
  city?: string;
  propertyAddress?: string;
  address?: string;          // legacy alias for propertyAddress
  currency?: string;
  registration?: string;
  publishDate?: number[] | string;
  createdDtm?: number | string;
  createdBy?: string;
  // Seller
  sellerId?: string;
  sellerName?: string;
  sellerContact?: string;
  // Unit
  unitId?: string;
  unitCode?: string;
  unitArea?: number;
  areaSqm?: number;          // legacy alias for unitArea
  bedroomType?: string;
  unitAddress?: string;
  bathrooms?: number;
  view?: string;
  furniture?: string;
  facility?: string;
  pictureUrls?: string[];
  // Pricing
  cost?: number;
  minSalePrice?: number;
  price?: number;
  estimatedValue?: number;   // legacy alias for price
  saleTeamLead?: string;
  commission?: number;
  // Misc
  zoneType?: string;
  status?: string;
}
