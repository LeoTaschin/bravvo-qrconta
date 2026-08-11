-- Popula o catálogo (`products`) com o cardápio completo da Bravvo Pizzaria
-- Italiana, já organizado nas categorias do projeto (ver src/lib/categorias.ts).
-- Rode no SQL Editor do Supabase (Dashboard) — insert direto, ignora RLS por
-- rodar como owner, igual ao scripts/seed-teste.sql.
--
-- ⚠️ Rode uma ÚNICA vez: não há UNIQUE em products.name, então rodar de novo
-- duplica todos os itens. Se precisar reprocessar, apague antes:
--   delete from products where restaurant_id = (select id from restaurants where name = 'Bravvo Pizzaria Italiana');
--
-- Convenções adotadas por não haver variantes (products é uma linha "achatada"
-- por combinação de sabor/tamanho/opção):
--   - Pizzas com 2 tamanhos viram 2 linhas ("Nome 25cm" / "Nome 35cm").
--   - Sabores com preço por tipo de destilado (caipiras) viram 2 linhas.
--   - Bebidas "normal e zero" viram 2 linhas (nome já diferencia o zero).
--   - Bordas recheadas e calzones tradicionais (preço único por sabor) viram
--     1 linha por sabor.
--   - Petit Gateau: o cardápio oferece escolha de gelatto de acompanhamento,
--     mas o preço não muda — fica como 1 produto único (app não tem seletor
--     de variante dentro do mesmo item).

with restaurante as (
  select id from restaurants where name = 'Bravvo Pizzaria Italiana' limit 1
)
insert into products (restaurant_id, name, price, category)
select restaurante.id, v.name, v.price, v.category
from restaurante, (values

  -- Entradas
  ('Rotolinas', 35.00, 'Entradas'),
  ('Crostata', 25.00, 'Entradas'),
  ('Bruschettas', 40.00, 'Entradas'),
  ('Lanche Italiano de Parma', 49.90, 'Entradas'),
  ('Lanche Italiano de Mortadela', 49.90, 'Entradas'),
  ('Burrata', 89.90, 'Entradas'),
  ('Carpaccio', 54.90, 'Entradas'),
  ('Calabresa ao Forno', 49.00, 'Entradas'),

  -- Antipasti
  ('Abobrinha', 26.00, 'Antipasti'),
  ('Alicci', 32.00, 'Antipasti'),
  ('Berinjela', 26.00, 'Antipasti'),

  -- Pizzas Tradicionais
  ('Calabresa Artesanal 25cm', 59.90, 'Pizza/Calzone'),
  ('Calabresa Artesanal 35cm', 79.90, 'Pizza/Calzone'),
  ('Mussarela Especial 25cm', 59.90, 'Pizza/Calzone'),
  ('Mussarela Especial 35cm', 79.90, 'Pizza/Calzone'),
  ('Marinara 25cm', 59.90, 'Pizza/Calzone'),
  ('Marinara 35cm', 79.90, 'Pizza/Calzone'),
  ('Vegetariana 25cm', 59.90, 'Pizza/Calzone'),
  ('Vegetariana 35cm', 79.90, 'Pizza/Calzone'),

  -- Pizzas Clássicas
  ('Calabresa Castelões 25cm', 64.90, 'Pizza/Calzone'),
  ('Calabresa Castelões 35cm', 84.90, 'Pizza/Calzone'),
  ('5 Queijos 25cm', 64.90, 'Pizza/Calzone'),
  ('5 Queijos 35cm', 84.90, 'Pizza/Calzone'),
  ('Forrada 25cm', 64.90, 'Pizza/Calzone'),
  ('Forrada 35cm', 84.90, 'Pizza/Calzone'),
  ('Frango com Catupiry 25cm', 64.90, 'Pizza/Calzone'),
  ('Frango com Catupiry 35cm', 84.90, 'Pizza/Calzone'),
  ('Bacon 25cm', 64.90, 'Pizza/Calzone'),
  ('Bacon 35cm', 84.90, 'Pizza/Calzone'),
  ('Zucchini 25cm', 64.90, 'Pizza/Calzone'),
  ('Zucchini 35cm', 84.90, 'Pizza/Calzone'),
  ('Brócolis com Bacon 25cm', 64.90, 'Pizza/Calzone'),
  ('Brócolis com Bacon 35cm', 84.90, 'Pizza/Calzone'),
  ('Margherita Tradicional 25cm', 64.90, 'Pizza/Calzone'),
  ('Margherita Tradicional 35cm', 84.90, 'Pizza/Calzone'),
  ('Portuguesa 25cm', 64.90, 'Pizza/Calzone'),
  ('Portuguesa 35cm', 84.90, 'Pizza/Calzone'),
  ('Baiana 25cm', 64.90, 'Pizza/Calzone'),
  ('Baiana 35cm', 84.90, 'Pizza/Calzone'),
  ('Lombo Canadense 25cm', 64.90, 'Pizza/Calzone'),
  ('Lombo Canadense 35cm', 84.90, 'Pizza/Calzone'),
  ('Escarola 25cm', 64.90, 'Pizza/Calzone'),
  ('Escarola 35cm', 84.90, 'Pizza/Calzone'),
  ('Catupiry + 25cm', 64.90, 'Pizza/Calzone'),
  ('Catupiry + 35cm', 84.90, 'Pizza/Calzone'),

  -- Pizzas Gourmets
  ('Sweet Pepper 25cm', 69.90, 'Pizza/Calzone'),
  ('Sweet Pepper 35cm', 89.90, 'Pizza/Calzone'),
  ('Peruggia 25cm', 69.90, 'Pizza/Calzone'),
  ('Peruggia 35cm', 89.90, 'Pizza/Calzone'),
  ('Tomate Seco com Rúcula 25cm', 69.90, 'Pizza/Calzone'),
  ('Tomate Seco com Rúcula 35cm', 89.90, 'Pizza/Calzone'),
  ('Tomate Seco ao Creme de Gorgonzola 25cm', 69.90, 'Pizza/Calzone'),
  ('Tomate Seco ao Creme de Gorgonzola 35cm', 89.90, 'Pizza/Calzone'),
  ('Caprese 25cm', 69.90, 'Pizza/Calzone'),
  ('Caprese 35cm', 89.90, 'Pizza/Calzone'),
  ('Cogumelos 25cm', 69.90, 'Pizza/Calzone'),
  ('Cogumelos 35cm', 89.90, 'Pizza/Calzone'),
  ('Don Corleone 25cm', 69.90, 'Pizza/Calzone'),
  ('Don Corleone 35cm', 89.90, 'Pizza/Calzone'),
  ('Nostra Itália – Pizza Bianca 25cm', 69.90, 'Pizza/Calzone'),
  ('Nostra Itália – Pizza Bianca 35cm', 94.90, 'Pizza/Calzone'),
  ('Mortadela 25cm', 69.90, 'Pizza/Calzone'),
  ('Mortadela 35cm', 89.90, 'Pizza/Calzone'),
  ('Carbonara 25cm', 69.90, 'Pizza/Calzone'),
  ('Carbonara 35cm', 89.90, 'Pizza/Calzone'),
  ('Picanha Cremosa 25cm', 69.90, 'Pizza/Calzone'),
  ('Picanha Cremosa 35cm', 94.90, 'Pizza/Calzone'),
  ('Bacon com Cebola Caramelizada 25cm', 69.90, 'Pizza/Calzone'),
  ('Bacon com Cebola Caramelizada 35cm', 89.90, 'Pizza/Calzone'),
  ('Pepperoni com Geleia de Pimenta e Amêndoas 25cm', 69.90, 'Pizza/Calzone'),
  ('Pepperoni com Geleia de Pimenta e Amêndoas 35cm', 89.90, 'Pizza/Calzone'),
  ('Presunto Parma com Figos 25cm', 69.90, 'Pizza/Calzone'),
  ('Presunto Parma com Figos 35cm', 94.90, 'Pizza/Calzone'),
  ('Pepperoni 25cm', 69.90, 'Pizza/Calzone'),
  ('Pepperoni 35cm', 89.90, 'Pizza/Calzone'),
  ('Margherita di Savoie 25cm', 69.90, 'Pizza/Calzone'),
  ('Margherita di Savoie 35cm', 89.90, 'Pizza/Calzone'),
  ('Alicci 25cm', 89.90, 'Pizza/Calzone'),
  ('Alicci 35cm', 99.90, 'Pizza/Calzone'),

  -- Calzones
  ('Calzone Tradicional', 85.00, 'Pizza/Calzone'),
  ('Calzone Pizzaiolo', 85.00, 'Pizza/Calzone'),
  ('Calzone Siciliano', 85.00, 'Pizza/Calzone'),

  -- Bordas Recheadas
  ('Borda Recheada Catupiry Original', 16.00, 'Pizza/Calzone'),
  ('Borda Recheada Doce de Leite', 16.00, 'Pizza/Calzone'),
  ('Borda Recheada Chocolate ao Leite', 16.00, 'Pizza/Calzone'),

  -- Pizzas Doces
  ('Banana com Canela 25cm', 69.90, 'Pizza/Calzone'),
  ('Banana com Canela Calzone 25cm', 69.90, 'Pizza/Calzone'),
  ('Banana com Canela 35cm', 84.90, 'Pizza/Calzone'),
  ('Banana com Canela Calzone 35cm', 84.90, 'Pizza/Calzone'),
  ('Creme de Pistache 25cm', 69.90, 'Pizza/Calzone'),
  ('Creme de Pistache 35cm', 84.90, 'Pizza/Calzone'),
  ('Creme de Avelã 25cm', 69.90, 'Pizza/Calzone'),
  ('Creme de Avelã Calzone 25cm', 69.90, 'Pizza/Calzone'),
  ('Creme de Avelã 35cm', 84.90, 'Pizza/Calzone'),
  ('Creme de Avelã Calzone 35cm', 84.90, 'Pizza/Calzone'),
  ('Chocolate Preto Cítrico 25cm', 69.90, 'Pizza/Calzone'),
  ('Chocolate Preto Cítrico Calzone 25cm', 69.90, 'Pizza/Calzone'),
  ('Chocolate Preto Cítrico 35cm', 84.90, 'Pizza/Calzone'),
  ('Chocolate Preto Cítrico Calzone 35cm', 84.90, 'Pizza/Calzone'),

  -- Sobremesas
  ('Petit Gateau', 35.00, 'Sobremesas'),
  ('Gelatto Pistache', 18.00, 'Sobremesas'),
  ('Gelatto Chocolate', 16.00, 'Sobremesas'),
  ('Gelatto Fior di Latte', 16.00, 'Sobremesas'),

  -- Bebidas sem álcool
  ('Coca-Cola Lata', 8.00, 'Bebidas'),
  ('Coca-Cola Zero Lata', 8.00, 'Bebidas'),
  ('Guaraná Lata', 8.00, 'Bebidas'),
  ('Sprite Lata', 8.00, 'Bebidas'),
  ('Sprite Zero Lata', 8.00, 'Bebidas'),
  ('Fanta Laranja Lata', 8.00, 'Bebidas'),
  ('Fanta Uva Lata', 8.00, 'Bebidas'),
  ('H2O Limão', 8.00, 'Bebidas'),
  ('Tônica Lata', 7.00, 'Bebidas'),
  ('Água com Gás', 5.00, 'Bebidas'),
  ('Água', 5.00, 'Bebidas'),
  ('Suco de Polpa de Abacaxi', 10.00, 'Bebidas'),
  ('Suco de Polpa de Morango', 10.00, 'Bebidas'),
  ('Suco Natural de Laranja', 12.00, 'Bebidas'),

  -- Cervejas
  ('Heineken Long Neck', 12.00, 'Cervejas'),
  ('Heineken Long Neck Zero', 12.00, 'Cervejas'),
  ('Corona Long Neck', 12.00, 'Cervejas'),
  ('Praya Long Neck Sem Glúten', 12.00, 'Cervejas'),
  ('Amstel 600ml', 14.00, 'Cervejas'),
  ('Stella Artois Sem Glúten', 12.00, 'Cervejas'),
  ('Heineken 600ml', 18.00, 'Cervejas'),
  ('Original 600ml', 15.00, 'Cervejas'),

  -- Caipiras
  ('Caipira de Limão (Absolut)', 29.00, 'Drinks e Doses'),
  ('Caipira de Limão (Cachaça)', 22.00, 'Drinks e Doses'),
  ('Caipira de Morango (Absolut)', 29.00, 'Drinks e Doses'),
  ('Caipira de Morango (Cachaça)', 22.00, 'Drinks e Doses'),
  ('Caipira de Abacaxi (Absolut)', 29.00, 'Drinks e Doses'),
  ('Caipira de Abacaxi (Cachaça)', 22.00, 'Drinks e Doses'),
  ('Caipira de Morango com Leite Condensado (Absolut)', 33.00, 'Drinks e Doses'),
  ('Caipira de Morango com Leite Condensado (Cachaça)', 26.00, 'Drinks e Doses'),

  -- Drinks
  ('Negroni', 30.00, 'Drinks e Doses'),
  ('Aperol Spritz', 29.00, 'Drinks e Doses'),
  ('Margarita', 26.00, 'Drinks e Doses'),
  ('Gin Tônica', 26.00, 'Drinks e Doses'),

  -- Doses
  ('Johnnie Walker Red Label', 27.00, 'Drinks e Doses'),
  ('Johnnie Walker Black Label', 33.00, 'Drinks e Doses'),
  ('Campari', 19.00, 'Drinks e Doses'),
  ('Cointreau', 16.00, 'Drinks e Doses'),
  ('Martini', 19.00, 'Drinks e Doses'),
  ('Bacardi', 19.00, 'Drinks e Doses'),
  ('Cachaça Premium', 19.00, 'Drinks e Doses'),
  ('Vodka Absolut', 29.00, 'Drinks e Doses'),

  -- Vinhos e Espumantes
  ('Vinho Branco em Taça', 15.00, 'Vinhos e Espumantes'),
  ('Vinho Tinto em Taça', 15.00, 'Vinhos e Espumantes'),
  ('Espumante Casa Perini Moscatel 750ml', 69.90, 'Vinhos e Espumantes'),
  ('Espumante Casa Perini Brut 750ml', 69.90, 'Vinhos e Espumantes'),
  ('Vinho Branco Casa Perini Arbo Trebbiano e Moscato', 69.90, 'Vinhos e Espumantes'),
  ('Vinho Tinto Suave Casa Perini Nuances', 79.90, 'Vinhos e Espumantes'),
  ('Vinho Tinto Seco Casillero del Diablo', 72.00, 'Vinhos e Espumantes'),
  ('Vinho Tinto Seco Julia Florista Português', 68.00, 'Vinhos e Espumantes'),
  ('Vinho Tinto Seco Pata Negra Oro Tempranillo', 68.00, 'Vinhos e Espumantes'),
  ('Vinho Tinto Seco Angelica Zapata Malbec', 220.00, 'Vinhos e Espumantes'),
  ('Vinho Tinto Seco DV Catena Cabernet/Malbec', 169.00, 'Vinhos e Espumantes'),
  ('Taxa de Rolha', 50.00, 'Vinhos e Espumantes')

) as v(name, price, category);

-- Depois de rodar, confira em /admin/produtos (deve mostrar 157 produtos).
