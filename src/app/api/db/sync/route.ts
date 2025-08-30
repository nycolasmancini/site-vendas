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

    // Se há tabelas faltando, tentar sincronizar todo o schema usando prisma db push
    if (missingTables.length > 0) {
      console.log('🔄 Executando sincronização completa do schema...')
      
      try {
        const { exec } = require('child_process')
        const { promisify } = require('util')
        const execAsync = promisify(exec)
        
        // Executar prisma db push para sincronizar schema
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss')
        
        if (stderr && !stderr.includes('warn')) {
          console.error('❌ Erro ao sincronizar schema:', stderr)
          throw new Error(stderr)
        }
        
        console.log('✅ Schema sincronizado:', stdout)
        
      } catch (syncError) {
        console.error('❌ Erro ao sincronizar schema:', syncError)
        
        // Fallback: tentar criar a tabela ProductImage manualmente
        if (missingTables.includes('ProductImage')) {
          try {
            await createProductImageTableIfNeeded()
            console.log('✅ Tabela ProductImage criada com sucesso (fallback)')
          } catch (createError) {
            console.error('❌ Erro ao criar tabela ProductImage:', createError)
            return NextResponse.json({ 
              error: 'Erro ao sincronizar banco de dados',
              details: syncError instanceof Error ? syncError.message : String(syncError)
            }, { status: 500 })
          }
        }
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