import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            order: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const formData = await request.formData()
    
    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
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
      where: { id },
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            order: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        },
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
          productId: id,
          supplierId: supplier.id
        }
      })

      if (!existingProductSupplier) {
        // Criar nova relação
        await prisma.productSupplier.create({
          data: {
            productId: id,
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { isActive } = body

    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Atualizar apenas o status de disponibilidade
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isActive },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            order: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        },
        suppliers: {
          where: { isActive: true },
          include: {
            supplier: true
          }
        }
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade do produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Usar transação para excluir produto e todos os registros relacionados
    await prisma.$transaction(async (tx) => {
      // 1. Excluir relações produto-fornecedor
      await tx.productSupplier.deleteMany({
        where: { productId: id }
      })

      // 2. Excluir relações produto-modelo (para capas/películas)
      await tx.productModel.deleteMany({
        where: { productId: id }
      })

      // 3. Excluir itens de pedidos relacionados
      await tx.orderItem.deleteMany({
        where: { productId: id }
      })

      // 4. Excluir produtos de kits
      await tx.kitProduct.deleteMany({
        where: { productId: id }
      })

      // 5. Excluir produto (imagens serão excluídas automaticamente pelo cascade)
      await tx.product.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'Produto excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir produto: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    )
  }
}