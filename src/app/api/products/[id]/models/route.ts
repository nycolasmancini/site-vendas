import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // Buscar todos os modelos associados ao produto
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
    const models = productModels.map((pm: any) => ({
      id: pm.model.id,
      brandName: pm.model.brand.name,
      modelName: pm.model.name,
      price: pm.price || 0,
      superWholesalePrice: pm.superWholesalePrice
    }))

    return NextResponse.json(models)

  } catch (error) {
    console.error('Erro ao buscar modelos do produto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}