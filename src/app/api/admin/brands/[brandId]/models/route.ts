import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ brandId: string }> }
) {
  try {
    const params = await context.params
    const brandId = params.brandId

    const models = await prisma.model.findMany({
      where: {
        brandId: brandId
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(models)
  } catch (error) {
    console.error('Erro ao buscar modelos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}