import type { DefectCategory } from './DefectCategory.js';

/**
 * Value Object: CoverageScope
 * รายการ DefectCategory ที่ warranty ครอบคลุม
 */
export class CoverageScope {
  readonly categories: ReadonlySet<DefectCategory>;

  constructor(categories: Iterable<DefectCategory>) {
    const set = new Set(categories);
    if (set.size === 0) {
      throw new Error('CoverageScope requires at least one category');
    }
    this.categories = set;
  }

  includes(category: DefectCategory): boolean {
    return this.categories.has(category);
  }

  toArray(): DefectCategory[] {
    return [...this.categories];
  }
}
