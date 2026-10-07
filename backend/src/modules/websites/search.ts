/**
 * Normalize text for case-insensitive Vietnamese search by removing combining accents
 * and folding đ to d.
 */
export function fold(value: string): string {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('đ', 'd')
}
