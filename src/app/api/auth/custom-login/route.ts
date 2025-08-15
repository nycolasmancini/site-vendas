import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

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
    
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    try {
      console.log('🔐 Tentativa de login para:', email)

      // Try User table first
      let result = await pool.query('SELECT * FROM "User" WHERE email = $1 AND "isActive" = true', [email])
      let user = result.rows[0]

      // If not found, try Admin table (legacy)
      if (!user) {
        try {
          result = await pool.query('SELECT * FROM "Admin" WHERE email = $1', [email])
          user = result.rows[0]
          
          if (user) {
            user.role = 'ADMIN'
            user.isActive = true
          }
        } catch (adminError) {
          console.log('⚠️ Tabela Admin não encontrada')
        }
      }

      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'Credenciais inválidas'
        }, { status: 401 })
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password)

      if (!passwordMatch) {
        return NextResponse.json({
          success: false,
          error: 'Credenciais inválidas'
        }, { status: 401 })
      }

      // Create JWT token
      const token = await new SignJWT({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret)

      console.log('✅ Login bem-sucedido para:', email)

      // Set cookie and return success
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        redirectTo: '/admin/dashboard'
      })

      // Set authentication cookie
      response.cookies.set('pmcell-auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
      })

      return response

    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('❌ Erro no login customizado:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}