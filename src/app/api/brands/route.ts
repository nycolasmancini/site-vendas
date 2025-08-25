import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Tentando buscar brands...')
    
    // Verificar se estamos em produção e a tabela existe
    if (process.env.NODE_ENV === 'production') {
      // Testar se a tabela Brand existe fazendo uma query simples
      try {
        await prisma.$queryRaw`SELECT 1 FROM "Brand" LIMIT 1`
        console.log('✅ Tabela Brand encontrada em produção')
      } catch (tableError) {
        console.error('❌ Tabela Brand não encontrada em produção:', tableError)
        // Retornar array vazio se a tabela não existir
        return NextResponse.json([], { status: 200 })
      }
    }

    const brands = await prisma.brand.findMany({
      include: {
        models: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log(`✅ ${brands.length} brands encontradas`)
    return NextResponse.json(brands)
  } catch (error) {
    console.error('Erro ao buscar brands:', error)
    // Retornar array vazio em caso de erro para evitar problemas no frontend
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome da marca é obrigatório' },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        order: 0
      },
      include: {
        models: true
      }
    })

    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar brand:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}