/**
 * Capitaliza a primeira letra de cada palavra em tempo real durante a digitação.
 * Exemplo: "arroz branco" -> "Arroz Branco"
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';
  return text.replace(/(?:^|[\s\-])\S/g, (char) => char.toUpperCase());
}
