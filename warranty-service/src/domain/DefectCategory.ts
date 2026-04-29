/**
 * Value Object: DefectCategory
 */
export const DefectCategory = {
  STRUCTURAL: 'STRUCTURAL',
  ELECTRICAL: 'ELECTRICAL',
  PLUMBING: 'PLUMBING',
  FINISHING: 'FINISHING',
  APPLIANCE: 'APPLIANCE',
  OTHER: 'OTHER',
} as const;

export type DefectCategory = (typeof DefectCategory)[keyof typeof DefectCategory];

export function parseDefectCategory(raw: string | undefined): DefectCategory {
  if (!raw) return DefectCategory.OTHER;
  const upper = raw.toUpperCase();
  return (upper in DefectCategory ? (upper as DefectCategory) : DefectCategory.OTHER);
}
