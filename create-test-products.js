// Script para criar produtos de teste com super atacado

const products = [
  {
    name: 'Cabo USB-C Premium TESTE',
    subname: 'Carregamento rápido',
    description: 'Cabo USB-C com tecnologia de carregamento rápido',
    brand: 'TechPremium',
    price: '15.90',
    superWholesalePrice: '12.50',
    superWholesaleQuantity: '50',
    cost: '8.00',
    categoryId: 'cabos-category-id' // Precisa ser um ID real
  },
  {
    name: 'Capa TPU Transparente TESTE',
    subname: 'Anti-impacto',
    description: 'Capa de silicone transparente com proteção anti-impacto',
    brand: 'ProtectCase',
    price: '8.50',
    superWholesalePrice: '6.90',
    superWholesaleQuantity: '100',
    cost: '4.50',
    categoryId: 'capas-category-id' // Precisa ser um ID real
  },
  {
    name: 'Carregador Turbo TESTE',
    subname: '20W Fast Charging',
    description: 'Carregador rápido com certificação de segurança',
    brand: 'PowerMax',
    price: '24.90',
    superWholesalePrice: '19.90',
    superWholesaleQuantity: '30',
    cost: '12.00',
    categoryId: 'carregadores-category-id' // Precisa ser um ID real
  }
];

console.log('🛠️ PRODUTOS DE TESTE PARA SUPER ATACADO\n');

products.forEach((product, index) => {
  console.log(`${index + 1}. ${product.name}`);
  console.log(`   Preço normal: R$ ${product.price}`);
  console.log(`   Super atacado: R$ ${product.superWholesalePrice} (${product.superWholesaleQuantity}+ un)`);
  console.log(`   Economia por unidade: R$ ${(parseFloat(product.price) - parseFloat(product.superWholesalePrice)).toFixed(2)}`);
  console.log('');
});

console.log('📝 INSTRUÇÕES:');
console.log('1. Acesse: pmcellvendas.vercel.app/admin/login');
console.log('2. Faça login como admin');
console.log('3. Vá para "Produtos" → "Adicionar Produto"');
console.log('4. Crie um dos produtos acima com os valores de super atacado');
console.log('5. Teste o fluxo completo no frontend');
console.log('');
console.log('🔍 VERIFICAÇÃO:');
console.log('- ProductCard deve mostrar: "+X un: R$ Y.YY"');
console.log('- Carrinho deve calcular preço correto quando atingir quantidade');
console.log('- Modal "Economize levando mais" deve aparecer entre 80-99% da quantidade');

// SQL para inserir diretamente no banco (se necessário)
console.log('\n💾 SQL ALTERNATIVO (se admin não funcionar):');
console.log('-- Execute no banco de dados PostgreSQL:');
products.forEach((product, index) => {
  console.log(`
INSERT INTO "Product" (
  id, name, subname, description, brand, price, 
  "superWholesalePrice", "superWholesaleQuantity", cost, 
  "categoryId", "isActive", "featured", "isModalProduct",
  "createdAt", "updatedAt"
) VALUES (
  'test-product-${index + 1}',
  '${product.name}',
  '${product.subname}',
  '${product.description}',
  '${product.brand}',
  ${product.price},
  ${product.superWholesalePrice},
  ${product.superWholesaleQuantity},
  ${product.cost},
  (SELECT id FROM "Category" WHERE name ILIKE '%cabo%' OR name ILIKE '%capa%' OR name ILIKE '%carregador%' LIMIT 1),
  true,
  true,
  false,
  NOW(),
  NOW()
);`);
});