// Categorias fixas do cardápio da pizzaria, exibidas como filtro na página
// da mesa mesmo antes de existir produto cadastrado em cada uma. Produtos são
// cadastrados manualmente (Supabase Studio/SQL, ver admin-queries.ts) com o
// texto exato de uma dessas categorias no campo `products.category`.
export const CATEGORIAS_CARDAPIO: string[] = ['Pizza/Calzone', 'Antipasti', 'Bebidas', 'Cervejas', 'Vinhos e Espumantes'];
