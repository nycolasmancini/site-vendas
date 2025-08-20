import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { query as dbQuery, testConnection } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    let models

    // Em produção, usar SQL direto para evitar problemas com Prisma Accelerate
    if (process.env.NODE_ENV === 'production') {
      console.log('📊 Using production SQL direct query for product models')
      
      // Testar conexão primeiro
      const isConnected = await testConnection()
      if (!isConnected) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
      }

      // Query SQL para buscar modelos com suas marcas
      const sqlQuery = `
        SELECT 
          pm.id,
          pm."price",
          pm."superWholesalePrice",
          m.id as model_id,
          m.name as model_name,
          b.name as brand_name
        FROM "ProductModel" pm
        JOIN "Model" m ON pm."modelId" = m.id
        JOIN "Brand" b ON m."brandId" = b.id
        WHERE pm."productId" = $1
        ORDER BY b.name, m.name
      `
      
      const result = await dbQuery(sqlQuery, [productId])
      
      // Transformar dados para o formato esperado pelo frontend
      models = result.rows.map((row: any) => ({
        id: row.model_id,
        brandName: row.brand_name,
        modelName: row.model_name,
        price: parseFloat(row.price) || 0,
        superWholesalePrice: row.superWholesalePrice ? parseFloat(row.superWholesalePrice) : null
      }))
      
    } else {
      console.log('📊 Using development Prisma query for product models')
      
      // Em desenvolvimento, usar Prisma normalmente
      const productModels = await prisma.productModel.findMany({
        where: {
          productId
        },
        include: {
          model: {
            include: {
              brand: true
            }
          }
        },
        orderBy: [
          { model: { brand: { name: 'asc' } } },
          { model: { name: 'asc' } }
        ]
      })

      // Transformar dados para o formato esperado pelo frontend
      models = productModels.map((pm: any) => ({
        id: pm.model.id,
        brandName: pm.model.brand.name,
        modelName: pm.model.name,
        price: pm.price || 0,
        superWholesalePrice: pm.superWholesalePrice
      }))
    }

    return NextResponse.json(models)

  } catch (error) {
    console.error('Erro ao buscar modelos do produto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}