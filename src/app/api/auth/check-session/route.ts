import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('Check session API - Verificando sessão...')
    
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      console.log('Check session API - Nenhuma sessão encontrada')
      return NextResponse.json({
        authenticated: false,
        user: null
      }, { status: 200 })
    }
    
    console.log('Check session API - Sessão encontrada:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role
    })
    
    // Verificar se o usuário tem acesso admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE') {
      console.log('Check session API - Role inválido:', session.user.role)
      return NextResponse.json({
        authenticated: false,
        user: null,
        error: 'Invalid role'
      }, { status: 403 })
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      }
    }, { status: 200 })
    
  } catch (error) {
    console.error('Check session API - Erro:', error)
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: 'Session check failed'
    }, { status: 500 })
  }
}