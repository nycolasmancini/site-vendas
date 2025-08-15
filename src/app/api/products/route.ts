import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Em produção, usar conexão direta
    if (process.env.NODE_ENV === 'production') {
      const { Pool } = require('pg')
      const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
      
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      })

      try {
        const searchParams = request.nextUrl.searchParams
        const categoryId = searchParams.get('categoryId')
        const featured = searchParams.get('featured')
        const search = searchParams.get('search')
        const admin = searchParams.get('admin')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '12')
        const offset = (page - 1) * limit

        let whereConditions = []
        let queryParams = []

        // Para requisições admin, mostrar todos os produtos. Para público, apenas ativos
        if (admin !== 'true') {
          whereConditions.push('"Product"."isActive" = $' + (queryParams.length + 1))
          queryParams.push(true)
        }

        if (categoryId) {
          whereConditions.push('"Product"."categoryId" = $' + (queryParams.length + 1))
          queryParams.push(categoryId)
        }

        if (featured === 'true') {
          whereConditions.push('"Product"."featured" = $' + (queryParams.length + 1))
          queryParams.push(true)
        }

        if (search) {
          const searchParam = queryParams.length + 1
          whereConditions.push(`(
            "Product"."name" ILIKE $${searchParam} OR 
            "Product"."description" ILIKE $${searchParam} OR 
            "Product"."brand" ILIKE $${searchParam}
          )`)
          queryParams.push(`%${search}%`)
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

        // Query principal para produtos
        const productsQuery = `
          SELECT 
            p.*,
            c.id as category_id, c.name as category_name, c.slug as category_slug,
            c."order" as category_order, c."isActive" as category_isActive,
            c."createdAt" as category_createdAt, c."updatedAt" as category_updatedAt,
            (
              SELECT json_agg(
                json_build_object(
                  'id', i.id, 'url', i.url, 'fileName', i."fileName", 
                  'order', i."order", 'isMain', i."isMain"
                ) ORDER BY i."order"
              )
              FROM "ProductImage" i 
              WHERE i."productId" = p.id
            ) as images
          FROM "Product" p
          LEFT JOIN "Category" c ON p."categoryId" = c.id
          ${whereClause}
          ORDER BY p."createdAt" DESC
          LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `
        queryParams.push(limit, offset)

        // Query para contar total
        const countQuery = `
          SELECT COUNT(*) as total
          FROM "Product" p
          ${whereClause}
        `
        const countParams = queryParams.slice(0, -2) // Remove limit e offset

        const [productsResult, totalResult] = await Promise.all([
          pool.query(productsQuery, queryParams),
          pool.query(countQuery, countParams)
        ])

        const products = productsResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          subname: row.subname,
          description: row.description,
          brand: row.brand,
          price: parseFloat(row.price || 0),
          superWholesalePrice: row.superWholesalePrice ? parseFloat(row.superWholesalePrice) : null,
          superWholesaleQuantity: row.superWholesaleQuantity,
          cost: row.cost ? parseFloat(row.cost) : null,
          featured: row.featured,
          isActive: row.isActive,
          isModalProduct: row.isModalProduct || false,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          category: row.category_id ? {
            id: row.category_id,
            name: row.category_name,
            slug: row.category_slug,
            order: row.category_order,
            isActive: row.category_isActive,
            createdAt: row.category_createdAt,
            updatedAt: row.category_updatedAt
          } : null,
          images: row.images || [],
          suppliers: [], // Simplificado para produção
          models: [], // Simplificado para produção
          hasModels: false
        }))

        const total = parseInt(totalResult.rows[0].total)

        return NextResponse.json({
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        })
      } finally {
        await pool.end()
      }
    }

    // Em desenvolvimento, usar Prisma
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const admin = searchParams.get('admin')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    const where: any = {}

    // For admin requests, show all products. For public, only show active products
    if (admin !== 'true') {
      where.isActive = true
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
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
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

    // Processar produtos para incluir dados de modal
    const processedProducts = products.map(product => {
      const baseProduct: any = {
        ...product,
        hasModels: product.models.length > 0,
        isModalProduct: product.isModalProduct
      }

      // Se é produto de modal, calcular range de preços
      if (product.isModalProduct && product.models.length > 0) {
        const prices = product.models
          .map(pm => pm.price)
          .filter(price => price !== null) as number[]
        
        const superWholesalePrices = product.models
          .map(pm => pm.superWholesalePrice)
          .filter(price => price !== null) as number[]

        if (prices.length > 0) {
          baseProduct.priceRange = {
            min: Math.min(...prices),
            max: Math.max(...prices),
            ...(superWholesalePrices.length > 0 && {
              superWholesaleMin: Math.min(...superWholesalePrices),
              superWholesaleMax: Math.max(...superWholesalePrices)
            })
          }
        }
      }

      return baseProduct
    })

    return NextResponse.json({
      products: processedProducts,
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

    // Processar imagens - Solução usando Buffer (Node.js)
    const imageFiles = formData.getAll('images') as File[]
    const uploadedImages: { url: string; fileName: string; isMain: boolean }[] = []

    console.log(`Processando ${imageFiles.length} imagens`)

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
      return NextResponse.json(
        { error: 'Nenhuma imagem válida foi enviada. Verifique se os arquivos não estão corrompidos.' },
        { status: 400 }
      )
    }

    // Criar produto no banco de dados
    const product = await prisma.product.create({
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