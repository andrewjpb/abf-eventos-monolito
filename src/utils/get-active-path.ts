/**
 * Encontra o caminho ativo baseado em correspondência exata e correspondência de prefixo
 * Ignora completamente a abordagem de Levenshtein
 */
export const getActivePath = (path: string, paths: string[]) => {
  // Caso especial para a rota raiz
  if (path === '/') {
    return { active: '/', activeIndex: paths.indexOf('/') };
  }

  // Primeiro, tentar uma correspondência exata
  if (paths.includes(path)) {
    return { active: path, activeIndex: paths.indexOf(path) };
  }

  // Em seguida, encontrar todos os caminhos que não sejam a raiz e 
  // que sejam prefixos do caminho atual ou o caminho atual seja prefixo deles
  const possibleMatches = paths
    .filter(p => p !== '/')  // Ignorar a rota raiz nas correspondências parciais
    .filter(p => path.startsWith(p) || p.startsWith(path))
    .sort((a, b) => {
      // Ordenar por comprimento (mais longo primeiro)
      // Isso prioriza caminhos mais específicos
      return b.length - a.length;
    });

  if (possibleMatches.length > 0) {
    return {
      active: possibleMatches[0],
      activeIndex: paths.indexOf(possibleMatches[0])
    };
  }

  // Se nenhuma correspondência for encontrada, retornar o primeiro caminho
  return { active: paths[0] || '', activeIndex: 0 };
}