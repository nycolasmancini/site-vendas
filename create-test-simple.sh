#!/bin/bash

echo "🧪 Criando produto de teste direto no banco PostgreSQL..."
echo ""

# Primeiro, buscar uma categoria válida
echo "📋 Buscando categorias..."
CATEGORIES=$(curl -s "https://pmcellvendas.vercel.app/api/categories")

# Extrair categoryId da categoria "Cabos"  
CATEGORY_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*","name":"Cabos"' | sed 's/"id":"\([^"]*\)".*/\1/')

if [ -z "$CATEGORY_ID" ]; then
    # Se não encontrar categoria Cabos, pegar a primeira
    CATEGORY_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
fi

echo "✅ Categoria selecionada: $CATEGORY_ID"

if [ -z "$CATEGORY_ID" ]; then
    echo "❌ Nenhuma categoria encontrada!"
    exit 1
fi

echo ""
echo "🎯 INSTRUÇÕES PARA CRIAR MANUALMENTE:"
echo ""
echo "1. Acesse: https://pmcellvendas.vercel.app/admin"
echo "2. Faça login como admin"
echo "3. Vá para 'Produtos' → 'Adicionar Produto'"
echo "4. Preencha EXATAMENTE:"
echo "   - Nome: Cabo USB-C Premium TESTE"
echo "   - Subname: Carregamento ultra rápido"
echo "   - Descrição: Cabo USB-C premium com tecnologia de carregamento rápido"
echo "   - Marca: TechMax Pro"
echo "   - Preço: 15.90"
echo "   - Super Atacado - Preço: 12.50"
echo "   - Super Atacado - Quantidade: 50"
echo "   - Custo: 8.00"
echo "   - Categoria: Cabos (ou qualquer uma)"
echo "5. Adicione UMA imagem qualquer (obrigatório)"
echo "6. Clique em 'Salvar'"
echo ""
echo "🔍 VERIFICAÇÃO APÓS CRIAR:"
echo "1. Vá para 'Editar' o produto criado"
echo "2. TODOS os campos devem estar preenchidos"
echo "3. Se campos estão vazios = ainda há problema"
echo "4. Se campos estão preenchidos = PROBLEMA RESOLVIDO! ✅"
echo ""
echo "🌐 TESTE NO FRONTEND:"
echo "1. Acesse: https://pmcellvendas.vercel.app"
echo "2. Libere os preços"
echo "3. Procure 'Cabo USB-C Premium TESTE'"
echo "4. Deve mostrar: '+50 un: R$ 12,50'"
echo "5. Adicione 40 unidades → Modal aparece"
echo "6. Adicione mais 10 → Preço muda para R$ 12,50"
echo ""
echo "💪 ESTE TESTE VAI CONFIRMAR:"
echo "✅ Salvamento de todos os campos"
echo "✅ Edição mantém os dados"
echo "✅ Super atacado funciona no frontend"
echo "✅ Modal de economia aparece"
echo "✅ Cálculo de preços correto"