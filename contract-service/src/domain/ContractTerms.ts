/**
 * Value Object: ContractTerms
 * เงื่อนไขสัญญา immutable — ไม่ควรแก้ไขหลังลงนาม ต้องสร้างใหม่เสมอ
 */
export class ContractTerms {
  constructor(
    public readonly totalPrice: number,
    public readonly depositAmount: number,
    public readonly penaltyConditions: string,
  ) {}
}
