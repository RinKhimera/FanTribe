/**
 * French-aware pluralization.
 * In French, 0 and 1 are singular; 2+ is plural.
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  return count <= 1 ? singular : (plural ?? `${singular}s`)
}
