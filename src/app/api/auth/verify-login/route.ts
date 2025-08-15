import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email e senha são obrigatórios'
      }, { status: 400 })
    }

    // Use native postgres connection
    const { Pool } = require('pg')
    
    const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'Database URL não configurada'
      }, { status: 500 })
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    try {
      console.log('🔍 Verificando credenciais para:', email)

      // Try to find user in User table first
      let result = await pool.query('SELECT * FROM "User" WHERE email = $1 AND "isActive" = true', [email])
      
      let user = result.rows[0]
      let userSource = 'User'

      // If not found in User table, try Admin table (legacy)
      if (!user) {
        try {
          result = await pool.query('SELECT * FROM "Admin" WHERE email = $1', [email])
          user = result.rows[0]
          userSource = 'Admin'
          
          if (user) {
            // Convert Admin to User format
            user.role = 'ADMIN'
            user.isActive = true
          }
        } catch (adminError) {
          console.log('⚠️ Tabela Admin não encontrada')
        }
      }

      if (!user) {
        console.log('❌ Usuário não encontrado:', email)
        return NextResponse.json({
          success: false,
          error: 'Credenciais inválidas'
        }, { status: 401 })
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password)

      if (!passwordMatch) {
        console.log('❌ Senha incorreta para:', email)
        return NextResponse.json({
          success: false,
          error: 'Credenciais inválidas'
        }, { status: 401 })
      }

      console.log(`✅ Login bem-sucedido: ${email} (fonte: ${userSource})`)

      // Return user data (without password)
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        },
        source: userSource
      })

    } catch (dbError) {
      await pool.end()
      throw dbError
    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('❌ Erro na verificação de login:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}