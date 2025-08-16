import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Em produção, usar conexão direta por enquanto
    if (process.env.NODE_ENV === 'production') {
      const { Pool } = require('pg')
      const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
      
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        max: 1, // Limit connections for serverless
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
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
          whereConditions.push('p."isActive" = true')
        }

        if (categoryId) {
          whereConditions.push('p."categoryId" = $' + (queryParams.length + 1))
          queryParams.push(categoryId)
        }

        if (featured === 'true') {
          whereConditions.push('p."featured" = $' + (queryParams.length + 1))
          queryParams.push(true)
        }

        if (search) {
          const searchParam = queryParams.length + 1
          whereConditions.push(`(
            p."name" ILIKE $${searchParam} OR 
            p."description" ILIKE $${searchParam} OR 
            p."brand" ILIKE $${searchParam}
          )`)
          queryParams.push(`%${search}%`)
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

        // Adicionar limit e offset aos parâmetros ANTES de construir a query
        queryParams.push(limit, offset)

        // Query para produtos com imagens
        const productsQuery = `
          SELECT 
            p.id, p.name, p.price, 
            p."superWholesalePrice" as "superWholesalePrice", 
            p."superWholesaleQuantity" as "superWholesaleQuantity",
            p."isActive", p."createdAt",
            COALESCE(
              JSON_AGG(
                CASE WHEN i.id IS NOT NULL THEN
                  JSON_BUILD_OBJECT(
                    'id', i.id,
                    'url', i.url,
                    'fileName', i."fileName",
                    'order', i."order",
                    'isMain', i."isMain"
                  )
                END ORDER BY i."order"
              ) FILTER (WHERE i.id IS NOT NULL),
              '[]'::json
            ) as images
          FROM "Product" p
          LEFT JOIN "ProductImage" i ON i."productId" = p.id
          ${whereClause}
          GROUP BY p.id
          ORDER BY p."createdAt" DESC
          LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
        `

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

        if (!productsResult.rows) {
          throw new Error('No data returned from products query')
        }

        const products = productsResult.rows.map((row: any) => {
          const product = {
            id: row.id,
            name: row.name,
            price: parseFloat(row.price || 0),
            superWholesalePrice: row.superWholesalePrice ? parseFloat(row.superWholesalePrice) : null,
            superWholesaleQuantity: row.superWholesaleQuantity ? parseInt(row.superWholesaleQuantity) : null,
            isActive: row.isActive,
            createdAt: row.createdAt,
            // Add minimal required fields for frontend
            subname: null,
            description: null,
            brand: null,
            featured: false,
            isModalProduct: false,
            category: null,
            images: Array.isArray(row.images) ? row.images : [],
            suppliers: [],
            models: [],
            hasModels: false
          }
          
          // Debug: Log produtos com super atacado
          if (product.superWholesalePrice && product.superWholesaleQuantity) {
            console.log('🔍 Produto com super atacado encontrado:', {
              name: product.name,
              superWholesalePrice: product.superWholesalePrice,
              superWholesaleQuantity: product.superWholesaleQuantity,
              rawData: { 
                superWholesalePrice: row.superWholesalePrice, 
                superWholesaleQuantity: row.superWholesaleQuantity 
              }
            })
          }
          
          return product
        })

        const total = parseInt(totalResult.rows[0].total)
        
        // Debug: Log resumo dos produtos
        const comSuperAtacado = products.filter(p => p.superWholesalePrice && p.superWholesaleQuantity).length
        console.log('📊 Produtos retornados da API:', {
          total: products.length,
          comSuperAtacado,
          exemplos: products.slice(0, 2).map(p => ({
            name: p.name,
            hasSuperWholesale: !!(p.superWholesalePrice && p.superWholesaleQuantity)
          }))
        })

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
        console.error('Production query error:', error)
        throw error
      } finally {
        try {
          await pool.end()
        } catch (endError) {
          console.error('Error closing pool:', endError)
        }
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
        select: {
          id: true,
          name: true,
          price: true,
          superWholesalePrice: true,
          superWholesaleQuantity: true,
          isActive: true,
          createdAt: true,
          // Add minimal fields needed for frontend
          subname: true,
          description: true,
          brand: true,
          featured: true,
          isModalProduct: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])


    // Simplificar produtos para produção
    const processedProducts = products.map((product: any) => ({
      ...product,
      images: [],
      suppliers: [],
      models: [],
      hasModels: false
    }))

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
    
    // More detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      env: process.env.NODE_ENV
    })
    
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Debug: Log todos os campos recebidos
    console.log('🔍 FormData recebido:', {
      name: formData.get('name'),
      subname: formData.get('subname'),
      description: formData.get('description'),
      brand: formData.get('brand'),
      price: formData.get('price'),
      superWholesalePrice: formData.get('superWholesalePrice'),
      superWholesaleQuantity: formData.get('superWholesaleQuantity'),
      cost: formData.get('cost'),
      categoryId: formData.get('categoryId'),
      supplierName: formData.get('supplierName'),
      supplierPhone: formData.get('supplierPhone')
    })
    
    // Extrair dados do formulário
    const name = formData.get('name') as string
    const subname = formData.get('subname') as string
    const subnameValue = subname && subname.trim() !== '' ? subname : null
    const description = formData.get('description') as string
    const brand = formData.get('brand') as string
    const brandValue = brand && brand.trim() !== '' ? brand : null
    const price = parseFloat(formData.get('price') as string)
    
    const superWholesalePriceStr = formData.get('superWholesalePrice') as string
    const superWholesalePrice = superWholesalePriceStr && superWholesalePriceStr.trim() !== '' ? 
      parseFloat(superWholesalePriceStr) : null
    
    const superWholesaleQuantityStr = formData.get('superWholesaleQuantity') as string
    const superWholesaleQuantity = superWholesaleQuantityStr && superWholesaleQuantityStr.trim() !== '' ? 
      parseInt(superWholesaleQuantityStr) : null
    
    const costStr = formData.get('cost') as string
    const cost = costStr && costStr.trim() !== '' ? parseFloat(costStr) : null
    const categoryId = formData.get('categoryId') as string
    const supplierName = formData.get('supplierName') as string || null
    const supplierPhone = formData.get('supplierPhone') as string || null

    // Debug: Log dados processados
    console.log('📋 Dados processados para criação:', {
      name,
      subname: subnameValue,
      description,
      brand: brandValue,
      price,
      superWholesalePrice,
      superWholesaleQuantity,
      cost,
      categoryId
    })

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

    // Permitir produtos sem imagens para teste
    // if (uploadedImages.length === 0) {
    //   return NextResponse.json(
    //     { error: 'Nenhuma imagem válida foi enviada. Verifique se os arquivos não estão corrompidos.' },
    //     { status: 400 }
    //   )
    // }

    // Criar produto no banco de dados
    const product = await prisma.product.create({
      data: {
        name,
        subname: subnameValue,
        description,
        brand: brandValue,
        price,
        superWholesalePrice,
        superWholesaleQuantity,
        cost,
        categoryId,
        // Só criar imagens se houver alguma
        ...(uploadedImages.length > 0 && {
          images: {
            create: uploadedImages.map((img, index) => ({
              url: img.url,
              fileName: img.fileName,
              order: index,
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
        images: true
      }
    })

    // Debug: Log produto criado
    console.log('✅ Produto criado com sucesso:', {
      id: product.id,
      name: product.name,
      price: product.price,
      superWholesalePrice: product.superWholesalePrice,
      superWholesaleQuantity: product.superWholesaleQuantity,
      subname: product.subname,
      brand: product.brand,
      cost: product.cost
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
      { error: 'Erro ao criar produto: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    )
  }
}