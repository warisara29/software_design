/**
 * Value Object: PropertySurvey
 * ข้อมูล survey ที่ Inventory ส่งมา immutable
 */
export class PropertySurvey {
  constructor(
    public readonly address: string,
    public readonly areaSqm: number,
    public readonly estimatedValue: number,
    public readonly zoneType: string,
  ) {}
}
