import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' }
        },
        models: {
          include: {
            model: {
              include: {
                brand: true
              }
            }
          }
        },
        suppliers: {
          where: { isActive: true },
          include: {
            supplier: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    
    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        suppliers: true
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Extrair dados do formulário
    const name = formData.get('name') as string
    const subname = formData.get('subname') as string || null
    const description = formData.get('description') as string
    const brand = formData.get('brand') as string || null
    const price = parseFloat(formData.get('price') as string)
    const superWholesalePrice = formData.get('superWholesalePrice') ? 
      parseFloat(formData.get('superWholesalePrice') as string) : null
    const superWholesaleQuantity = formData.get('superWholesaleQuantity') ? 
      parseInt(formData.get('superWholesaleQuantity') as string) : null
    const cost = formData.get('cost') ? 
      parseFloat(formData.get('cost') as string) : null
    const categoryId = formData.get('categoryId') as string
    const supplierName = formData.get('supplierName') as string || null
    const supplierPhone = formData.get('supplierPhone') as string || null

    // Processar novas imagens se houver
    const imageFiles = formData.getAll('images') as File[]
    const uploadedImages: { url: string; fileName: string; isMain: boolean }[] = []

    if (imageFiles.length > 0) {
      console.log(`Processando ${imageFiles.length} novas imagens`)

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
              isMain: false // Novas imagens não são principais por padrão
            })
            console.log(`Imagem ${i} processada com sucesso: ${file.name}`)
          } catch (error) {
            console.error('Erro ao processar imagem:', error)
            continue
          }
        }
      }
    }

    // Atualizar produto no banco de dados
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        subname,
        description,
        brand,
        price,
        superWholesalePrice,
        superWholesaleQuantity,
        cost,
        categoryId,
        // Adicionar novas imagens se houver
        ...(uploadedImages.length > 0 && {
          images: {
            create: uploadedImages.map((img, index) => ({
              url: img.url,
              fileName: img.fileName,
              order: existingProduct.images.length + index,
              isMain: img.isMain
            }))
          }
        })
      },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // Atualizar/criar fornecedor se fornecido
    if (supplierName) {
      // Procurar fornecedor existente ou criar novo
      let supplier = await prisma.supplier.findFirst({
        where: { name: supplierName }
      })

      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: {
            name: supplierName,
            phone: supplierPhone
          }
        })
      }

      // Verificar se já existe relação produto-fornecedor
      const existingProductSupplier = await prisma.productSupplier.findFirst({
        where: {
          productId: params.id,
          supplierId: supplier.id
        }
      })

      if (!existingProductSupplier) {
        // Criar nova relação
        await prisma.productSupplier.create({
          data: {
            productId: params.id,
            supplierId: supplier.id,
            cost: cost || 0
          }
        })
      } else {
        // Atualizar custo se necessário
        await prisma.productSupplier.update({
          where: { id: existingProductSupplier.id },
          data: { cost: cost || 0 }
        })
      }
    }

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Deletar produto (cascade irá deletar as imagens automaticamente)
    await prisma.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Produto excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}