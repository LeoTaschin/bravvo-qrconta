-- Categoria opcional do produto, usada pelos filtros do cardápio no painel
-- do funcionário (ex.: Pizzas, Bebidas, Porções, Sobremesas). Fica nula até
-- o restaurante categorizar o catálogo; produtos sem categoria continuam
-- aparecendo em "Todos".
alter table products add column category text;
