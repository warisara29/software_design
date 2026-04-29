/**
 * Value Object: ContractParties
 * คู่สัญญาคงที่ตลอดอายุสัญญา ไม่มี identity, immutable
 */
export class ContractParties {
  constructor(
    public readonly buyerId: string,
    public readonly sellerId: string,
  ) {}
}
