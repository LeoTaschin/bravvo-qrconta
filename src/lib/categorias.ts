// Categorias fixas do cardápio da pizzaria, exibidas como filtro na página
// da mesa mesmo antes de existir produto cadastrado em cada uma. Produtos são
// cadastrados pela tela /admin/produtos (ou manualmente via SQL) com o texto
// exato de uma dessas categorias no campo `products.category`.
export const CATEGORIAS_CARDAPIO: string[] = [
  'Entradas',
  'Antipasti',
  'Pizza/Calzone',
  'Sobremesas',
  'Bebidas',
  'Cervejas',
  'Drinks e Doses',
  'Vinhos e Espumantes',
];
