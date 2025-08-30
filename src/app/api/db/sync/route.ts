import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronização do banco de dados...')

    // Verificar se as tabelas principais existem
    const tablesToCheck = ['User', 'Product', 'ProductImage', 'Category', 'Brand']
    const missingTables: string[] = []

    for (const table of tablesToCheck) {
      try {
        await prisma.$queryRaw`SELECT 1 FROM ${table} LIMIT 1`
        console.log(`✅ Tabela ${table} encontrada`)
      } catch (error: any) {
        if (error.code === 'P2021') {
          missingTables.push(table)
          console.log(`❌ Tabela ${table} não encontrada`)
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

    // Tentar sincronizar o schema
    try {
      const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss')
      console.log('DB Push resultado:', stdout)
      if (stderr) {
        console.warn('DB Push warnings:', stderr)
      }

      // Verificar novamente se as tabelas foram criadas
      const stillMissing: string[] = []
      for (const table of missingTables) {
        try {
          await prisma.$queryRaw`SELECT 1 FROM ${table} LIMIT 1`
          console.log(`✅ Tabela ${table} criada com sucesso`)
        } catch (error: any) {
          if (error.code === 'P2021') {
            stillMissing.push(table)
          }
        }
      }

      if (stillMissing.length === 0) {
        console.log('✅ Sincronização concluída com sucesso')
        return NextResponse.json({ 
          message: 'Banco de dados sincronizado com sucesso',
          createdTables: missingTables
        })
      } else {
        console.error(`❌ Ainda faltam tabelas: ${stillMissing.join(', ')}`)
        return NextResponse.json({ 
          error: 'Sincronização parcial. Algumas tabelas não foram criadas.',
          stillMissing 
        }, { status: 500 })
      }

    } catch (pushError) {
      console.error('❌ Erro ao executar prisma db push:', pushError)
      return NextResponse.json({ 
        error: 'Erro ao sincronizar schema do banco de dados',
        details: pushError instanceof Error ? pushError.message : String(pushError)
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Erro na sincronização do banco:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor durante sincronização',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}