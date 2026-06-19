/**
 * Busca aproximada (Fuzzy Search) adaptada para o catálogo SEAP.
 * Remove acentos (Maranhão -> maranhao) e ignora maiúsculas/minúsculas.
 */
export function fuzzySearch(query, text) {
  if (!query) return true;
  if (!text) return false;

  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const normalizedText = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return normalizedText.includes(normalizedQuery);
}