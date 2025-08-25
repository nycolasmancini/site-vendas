import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Tentando buscar brands...')
    
    // Verificar se estamos em produção e as tabelas existem
    if (process.env.NODE_ENV === 'production') {
      try {
        // Testar se as tabelas Brand e Model existem
        await prisma.$queryRaw`SELECT 1 FROM "Brand" LIMIT 1`
        await prisma.$queryRaw`SELECT 1 FROM "Model" LIMIT 1`
        console.log('✅ Tabelas Brand e Model encontradas em produção')
      } catch (tableError) {
        console.error('❌ Tabelas Brand/Model não encontradas em produção:', tableError)
        console.log('🔄 Tentando criar tabelas com db push...')
        
        // Tentar fazer o push do schema
        try {
          const { exec } = require('child_process')
          await new Promise((resolve, reject) => {
            exec('npx prisma db push --accept-data-loss', (error: Error | null, stdout: string, stderr: string) => {
              if (error) {
                console.error('Erro ao executar db push:', error)
                reject(error)
              } else {
                console.log('DB Push resultado:', stdout)
                resolve(stdout)
              }
            })
          })
          console.log('✅ Schema sincronizado com sucesso')
        } catch (pushError) {
          console.error('❌ Erro ao sincronizar schema:', pushError)
          return NextResponse.json([], { status: 200 })
        }
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