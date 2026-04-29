/**
 * Value Object: CoveragePeriod
 * ช่วงเวลาคุ้มครอง warranty (start, end) immutable
 */
export class CoveragePeriod {
  readonly startsAt: string;
  readonly endsAt: string;

  constructor(startsAt: string, endsAt: string) {
    if (!startsAt || !endsAt) {
      throw new Error('CoveragePeriod requires both startsAt and endsAt');
    }
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      throw new Error('endsAt must be after startsAt');
    }
    this.startsAt = startsAt;
    this.endsAt = endsAt;
  }

  covers(momentIso: string): boolean {
    const m = new Date(momentIso).getTime();
    return m >= new Date(this.startsAt).getTime() && m <= new Date(this.endsAt).getTime();
  }
}
