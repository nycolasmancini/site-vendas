import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    const where: any = {
      isActive: true
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          images: {
            orderBy: { order: 'asc' }
          },
          suppliers: {
            include: {
              supplier: true
            },
            where: { isActive: true }
          },
          models: {
            include: {
              model: {
                include: {
                  brand: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extrair dados do formulário
    const name = formData.get('name') as string
    const subname = formData.get('subname') as string || null
    const description = formData.get('description') as string
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

    // Upload das imagens para Supabase
    const imageFiles = formData.getAll('images') as File[]
    const uploadedImages: { url: string; fileName: string; isMain: boolean }[] = []

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      if (file.size > 0) {
        const fileName = `products/${Date.now()}-${i}-${file.name}`
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file)

        if (error) {
          console.error('Erro no upload da imagem:', error)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        uploadedImages.push({
          url: publicUrl,
          fileName: file.name,
          isMain: i === 0 // Primeira imagem é a principal
        })
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos uma imagem é obrigatória' },
        { status: 400 }
      )
    }

    // Criar produto no banco de dados
    const product = await prisma.product.create({
      data: {
        name,
        subname,
        description,
        price,
        superWholesalePrice,
        superWholesaleQuantity,
        cost,
        categoryId,
        images: {
          create: uploadedImages.map((img, index) => ({
            url: img.url,
            fileName: img.fileName,
            order: index,
            isMain: img.isMain
          }))
        }
      },
      include: {
        category: true,
        images: true
      }
    })

    // Criar/associar fornecedor se fornecido
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

      // Associar produto ao fornecedor
      await prisma.productSupplier.create({
        data: {
          productId: product.id,
          supplierId: supplier.id,
          cost: cost || 0
        }
      })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}