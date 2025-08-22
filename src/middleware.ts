import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Proteção de rotas admin (excluir APIs)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/')) {
    // Se está tentando acessar /admin/login, permitir
    if (pathname === '/admin/login') {
      return response
    }
    
    // Verificar token de autenticação para outras rotas admin
    try {
      console.log('Middleware: Tentando obter token para:', pathname)
      console.log('Middleware: NEXTAUTH_SECRET definido:', !!process.env.NEXTAUTH_SECRET)
      console.log('Middleware: Cookies disponíveis:', request.cookies.getAll().map(c => c.name))
      
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      })
      
      console.log('Middleware: Token resultado:', token ? 'encontrado' : 'não encontrado')
      
      if (!token) {
        console.log('Middleware: Token não encontrado para:', pathname)
        const loginUrl = new URL('/admin/login', request.url)
        return NextResponse.redirect(loginUrl)
      }
      
      const role = token.role as string
      if (role !== 'ADMIN' && role !== 'EMPLOYEE') {
        console.log('Middleware: Role inválido:', role, 'para:', pathname)
        const loginUrl = new URL('/admin/login', request.url)
        return NextResponse.redirect(loginUrl)
      }
      
      console.log('Middleware: Acesso autorizado para:', token.email)
    } catch (error) {
      console.error('Middleware: Erro ao verificar token para:', pathname, error)
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Headers de compressão para todas as requisições
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  if (acceptEncoding.includes('br')) {
    response.headers.set('Content-Encoding', 'br')
  } else if (acceptEncoding.includes('gzip')) {
    response.headers.set('Content-Encoding', 'gzip')
  }

  // Configurar headers específicos por rota
  if (pathname.startsWith('/api/products')) {
    // Cache otimizado para produtos
    if (pathname.includes('/optimized')) {
      response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400')
    } else {
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800')
    }
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=1800')
    response.headers.set('Vary', 'Accept-Encoding, If-None-Match')
  }

  if (pathname.startsWith('/api/images')) {
    // Cache longo para imagens (1 dia)
    response.headers.set('Cache-Control', 'public, s-maxage=86400, immutable')
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=86400')
    response.headers.set('Vary', 'Accept-Encoding')
  }

  if (pathname.startsWith('/api/cart')) {
    // Cache dinâmico para carrinho - não cachear no CDN
    response.headers.set('Cache-Control', 'private, no-cache')
    response.headers.set('CDN-Cache-Control', 'no-store')
    
    // Rate limiting headers
    if (pathname.includes('/optimized')) {
      response.headers.set('X-RateLimit-Limit', '15')
      response.headers.set('X-RateLimit-Window', '60')
    }
  }

  // Headers gerais para APIs
  if (pathname.startsWith('/api/')) {
    response.headers.set('Vary', 'Accept-Encoding')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // Compression hints
    response.headers.set('Content-Type', 'application/json; charset=utf-8')
  }

  // Headers de performance para páginas estáticas
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
  }

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}