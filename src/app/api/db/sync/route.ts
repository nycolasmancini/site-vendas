import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createProductImageTableIfNeeded } from '@/lib/prisma-helpers'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronização do banco de dados...')

    // Verificar se as tabelas principais existem
    const tablesToCheck = [
      { name: 'User', query: 'SELECT 1 FROM "User" LIMIT 1' },
      { name: 'Product', query: 'SELECT 1 FROM "Product" LIMIT 1' },
      { name: 'ProductImage', query: 'SELECT 1 FROM "ProductImage" LIMIT 1' },
      { name: 'Category', query: 'SELECT 1 FROM "Category" LIMIT 1' },
      { name: 'Brand', query: 'SELECT 1 FROM "Brand" LIMIT 1' }
    ]
    
    const missingTables: string[] = []

    for (const table of tablesToCheck) {
      try {
        await prisma.$queryRawUnsafe(table.query)
        console.log(`✅ Tabela ${table.name} encontrada`)
      } catch (error: any) {
        if (error.code === 'P2021') {
          missingTables.push(table.name)
          console.log(`❌ Tabela ${table.name} não encontrada`)
        }
      }
    }

    if (missingTables.length === 0) {
      console.log('✅ Todas as tabelas necessárias já existem')
      return NextResponse.json({ 
        message: 'Banco de dados já sincronizado',
        missingTables: []
      })
    }

    console.log(`🔧 Tabelas ausentes: ${missingTables.join(', ')}`)

    // Tentar criar a tabela ProductImage especificamente
    if (missingTables.includes('ProductImage')) {
      try {
        await createProductImageTableIfNeeded()
        console.log('✅ Tabela ProductImage criada com sucesso')
      } catch (createError) {
        console.error('❌ Erro ao criar tabela ProductImage:', createError)
        return NextResponse.json({ 
          error: 'Erro ao criar tabela ProductImage',
          details: createError instanceof Error ? createError.message : String(createError)
        }, { status: 500 })
      }
    }

    // Verificar novamente se as tabelas foram criadas
    const stillMissing: string[] = []
    for (const table of tablesToCheck) {
      try {
        await prisma.$queryRawUnsafe(table.query)
        console.log(`✅ Tabela ${table.name} verificada`)
      } catch (error: any) {
        if (error.code === 'P2021') {
          stillMissing.push(table.name)
        }
      }
    }

    if (stillMissing.length === 0) {
      console.log('✅ Sincronização concluída com sucesso')
      return NextResponse.json({ 
        message: 'Banco de dados sincronizado com sucesso',
        createdTables: missingTables.filter(t => !stillMissing.includes(t))
      })
    } else {
      console.warn(`⚠️ Algumas tabelas ainda estão ausentes: ${stillMissing.join(', ')}`)
      return NextResponse.json({ 
        message: 'Sincronização parcial realizada',
        createdTables: missingTables.filter(t => !stillMissing.includes(t)),
        stillMissing 
      }, { status: 206 })
    }

  } catch (error) {
    console.error('❌ Erro na sincronização do banco:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor durante sincronização',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}