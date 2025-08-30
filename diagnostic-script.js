#!/usr/bin/env node

/**
 * Script de diagnóstico para identificar problemas específicos na produção
 */

async function diagnosticTests() {
  console.log('🔍 Iniciando diagnóstico do sistema...')
  const BASE_URL = 'https://pmcellvendas.vercel.app'
  
  // 1. Testar se API básica funciona
  console.log('\n📋 Teste 1: API básica de produtos')
  try {
    const response = await fetch(`${BASE_URL}/api/products?admin=true`)
    const data = await response.json()
    console.log('✅ API de produtos funciona:', {
      status: response.status,
      productsCount: data.products?.length || 0,
      hasProducts: !!data.products
    })
    
    if (data.products && data.products.length > 0) {
      const firstProduct = data.products[0]
      console.log('📦 Primeiro produto:', {
        id: firstProduct.id,
        name: firstProduct.name,
        isActive: firstProduct.isActive,
        hasCategory: !!firstProduct.category,
        hasImages: !!firstProduct.images && firstProduct.images.length > 0
      })
      
      // 2. Testar GET específico do produto
      console.log('\n📋 Teste 2: GET específico do produto')
      try {
        const productResponse = await fetch(`${BASE_URL}/api/products/${firstProduct.id}`)
        console.log('✅ GET produto específico:', {
          status: productResponse.status,
          ok: productResponse.ok
        })
        
        if (productResponse.ok) {
          const productData = await productResponse.json()
          console.log('📊 Dados do produto:', {
            hasAllFields: !!(productData.name && productData.price && productData.categoryId),
            fieldsCount: Object.keys(productData).length
          })
        } else {
          const errorText = await productResponse.text()
          console.error('❌ Erro no GET:', errorText.slice(0, 100))
        }
      } catch (getError) {
        console.error('❌ Erro no GET produto:', getError.message)
      }
      
      // 3. Testar conexão com banco diretamente
      console.log('\n📋 Teste 3: Verificar tabelas no banco')
      try {
        const tablesResponse = await fetch(`${BASE_URL}/api/db/sync`, { method: 'POST' })
        const tablesData = await tablesResponse.json()
        console.log('✅ Status das tabelas:', tablesData)
      } catch (tablesError) {
        console.error('❌ Erro ao verificar tabelas:', tablesError.message)
      }
      
    } else {
      console.log('⚠️ Nenhum produto encontrado para testar')
    }
    
  } catch (error) {
    console.error('❌ Erro na API básica:', error.message)
  }
  
  console.log('\n✅ Diagnóstico concluído')
}

diagnosticTests().catch(console.error)