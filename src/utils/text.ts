/**
 * Capitaliza a primeira letra de cada palavra em tempo real durante a digitação.
 * Exemplo: "arroz branco" -> "Arroz Branco"
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';
  return text.replace(/(?:^|[\s\-])\S/g, (char) => char.toUpperCase());
}

/**
 * Normaliza o texto para buscas ignorando maiúsculas, minúsculas e acentos.
 * Ex: "Feijão" -> "feijao"
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
