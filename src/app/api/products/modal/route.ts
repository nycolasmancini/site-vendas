import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const categoryId = formData.get('categoryId') as string
    const quickAddIncrement = parseInt(formData.get('quickAddIncrement') as string) || 25
    const modelsData = JSON.parse(formData.get('models') as string)

    if (!name || !description || !categoryId) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    if (!modelsData || modelsData.length === 0) {
      return NextResponse.json({ error: 'Pelo menos um modelo deve ser adicionado' }, { status: 400 })
    }

    // Processar imagens - Usando Base64 como o endpoint principal
    const imageFiles = formData.getAll('images') as File[]
    const uploadedImages: { url: string; fileName: string; isMain: boolean }[] = []

    console.log(`Processando ${imageFiles.length} imagens para produto modal`)

    // Processar cada imagem
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      console.log(`Arquivo ${i}: nome=${file.name}, tamanho=${file.size}, tipo=${file.type}`)
      
      if (file.size > 0) {
        try {
          // Verificar tamanho do arquivo (máximo 5MB)
          if (file.size > 5242880) {
            console.error(`Arquivo ${file.name} é muito grande (${file.size} bytes)`)
            continue
          }

          // Converter File para ArrayBuffer e depois para Base64
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const base64 = `data:${file.type};base64,${buffer.toString('base64')}`
          
          uploadedImages.push({
            url: base64,
            fileName: file.name,
            isMain: i === 0 // Primeira imagem é a principal
          })
          console.log(`Imagem ${i} processada com sucesso: ${file.name}`)
        } catch (error) {
          console.error('Erro ao processar imagem:', error)
          continue
        }
      } else {
        console.log(`Arquivo ${i} tem tamanho 0, ignorando`)
      }
    }

    console.log(`Total de imagens processadas: ${uploadedImages.length}`)

    if (uploadedImages.length === 0) {
      return NextResponse.json({ error: 'Pelo menos uma imagem deve ser enviada' }, { status: 400 })
    }

    // Criar produto principal de modal
    const product = await prisma.product.create({
      data: {
        name,
        description,
        categoryId,
        isModalProduct: true,
        quickAddIncrement,
        price: 0, // Será definido pelos modelos
        isActive: true,
        images: {
          create: uploadedImages.map((img, index) => ({
            url: img.url,
            fileName: img.fileName,
            order: index,
            isMain: img.isMain
          }))
        }
      }
    })

    // Processar modelos
    for (const modelData of modelsData) {
      const { brandName, modelName, price, superWholesalePrice } = modelData

      if (!brandName || !modelName || !price) {
        continue // Pular modelos incompletos
      }

      // Encontrar ou criar marca
      let brand = await prisma.brand.findUnique({
        where: { name: brandName }
      })

      if (!brand) {
        brand = await prisma.brand.create({
          data: { name: brandName }
        })
      }

      // Encontrar ou criar modelo
      let model = await prisma.model.findUnique({
        where: {
          brandId_name: {
            brandId: brand.id,
            name: modelName
          }
        }
      })

      if (!model) {
        model = await prisma.model.create({
          data: {
            name: modelName,
            brandId: brand.id
          }
        })
      }

      // Criar relação produto-modelo com preços
      await prisma.productModel.create({
        data: {
          productId: product.id,
          modelId: model.id,
          price: parseFloat(price),
          superWholesalePrice: superWholesalePrice ? parseFloat(superWholesalePrice) : null
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        isModalProduct: product.isModalProduct,
        quickAddIncrement: product.quickAddIncrement
      }
    })

  } catch (error) {
    console.error('Erro ao criar produto de modal:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}