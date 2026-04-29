/**
 * Value Object: SellerInfo
 * ข้อมูลผู้ขาย (เจ้าของเดิม) — immutable
 */
export class SellerInfo {
  constructor(
    public readonly sellerId: string,
    public readonly sellerName: string,
    public readonly contactInfo: string,
  ) {}
}
