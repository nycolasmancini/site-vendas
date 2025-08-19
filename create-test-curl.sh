#!/bin/bash

echo "🧪 Criando produto de teste via curl..."
echo ""

# Primeiro, pegar uma categoria válida
echo "📋 Buscando categorias disponíveis..."
CATEGORIES=$(curl -s "https://pmcellvendas.vercel.app/api/categories")
echo "Categorias encontradas: $CATEGORIES"

# Extrair o primeiro categoryId (simples com grep/sed)
CATEGORY_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
echo "✅ Categoria selecionada: $CATEGORY_ID"

if [ -z "$CATEGORY_ID" ]; then
    echo "❌ Nenhuma categoria encontrada!"
    exit 1
fi

echo ""
echo "📤 Enviando produto para API..."

# Criar produto via curl com multipart/form-data
curl -X POST "https://pmcellvendas.vercel.app/api/products" \
  -F "name=Cabo USB-C Premium TESTE" \
  -F "subname=Carregamento ultra rápido" \
  -F "description=Cabo USB-C premium com tecnologia de carregamento rápido e certificação de qualidade. Compatível com todos os dispositivos USB-C." \
  -F "brand=TechMax Pro" \
  -F "price=15.90" \
  -F "superWholesalePrice=12.50" \
  -F "superWholesaleQuantity=50" \
  -F "cost=8.00" \
  -F "categoryId=$CATEGORY_ID" \
  -F "supplierName=Fornecedor Teste" \
  -F "supplierPhone=11999999999" \
  -v

echo ""
echo ""
echo "🎯 VERIFICAÇÃO APÓS CRIAÇÃO:"
echo "1. Acesse: https://pmcellvendas.vercel.app"
echo "2. Libere os preços" 
echo "3. Procure \"Cabo USB-C Premium TESTE\""
echo "4. Deve mostrar: \"+50 un: R$ 12,50\""
echo "5. Adicione 40 unidades → Modal aparece"
echo "6. Adicione mais 10 → Preço muda para R$ 12,50"
echo ""
echo "🔍 TESTE DE EDIÇÃO:"
echo "1. Acesse: https://pmcellvendas.vercel.app/admin"
echo "2. Vá para \"Produtos\" → \"Editar\" o produto criado"  
echo "3. TODOS os campos devem estar preenchidos"
echo "4. Se estiverem vazios = ainda há problema"
echo "5. Se estiverem preenchidos = problema resolvido! ✅"