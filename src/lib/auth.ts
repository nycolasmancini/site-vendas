import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma, testDatabaseConnection, checkDatabaseTables } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // Configuração específica para produção no Vercel
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
      }
    }
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Em produção, usar conexão direta com PostgreSQL
          if (process.env.NODE_ENV === 'production') {
            console.log('🔍 Usando autenticação direta para produção...')
            
            const { Pool } = require('pg')
            const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
            
            const pool = new Pool({
              connectionString: databaseUrl,
              ssl: { rejectUnauthorized: false }
            })

            try {
              // Try User table first
              let result = await pool.query('SELECT * FROM "User" WHERE email = $1 AND "isActive" = true', [credentials.email])
              let user = result.rows[0]

              // If not found, try Admin table (legacy)
              if (!user) {
                try {
                  result = await pool.query('SELECT * FROM "Admin" WHERE email = $1', [credentials.email])
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
                console.log('❌ Usuário não encontrado:', credentials.email)
                return null
              }

              const passwordMatch = await bcrypt.compare(credentials.password, user.password)

              if (!passwordMatch) {
                console.log('❌ Senha incorreta')
                return null
              }

              console.log('✅ Autenticação bem-sucedida via conexão direta:', {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
              })
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
              }

            } finally {
              await pool.end()
            }
          }

          // Em desenvolvimento, usar Prisma
          console.log('🔍 Usando Prisma para desenvolvimento...')
          const dbConnected = await testDatabaseConnection()
          
          if (dbConnected) {
            let user = await prisma.user.findUnique({
              where: { email: credentials.email }
            })

            if (!user) {
              try {
                const admin = await prisma.admin.findUnique({
                  where: { email: credentials.email }
                })

                if (admin) {
                  user = {
                    id: admin.id,
                    email: admin.email,
                    password: admin.password,
                    name: admin.name,
                    role: 'ADMIN' as any,
                    isActive: true,
                    createdAt: admin.createdAt,
                    updatedAt: admin.updatedAt
                  }
                }
              } catch (adminError) {
                console.log('⚠️ Tabela Admin não encontrada')
              }
            }

            if (!user || !user.isActive) {
              return null
            }

            const passwordMatch = await bcrypt.compare(credentials.password, user.password)

            if (!passwordMatch) {
              return null
            }

            console.log('✅ Autenticação bem-sucedida via Prisma:', {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            })
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            }
          } else {
            throw new Error('Database connection failed')
          }
        } catch (error) {
          console.error('Authentication failed:', error instanceof Error ? error.message : 'Unknown error')
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        console.log('JWT callback - User autenticado:', { id: user.id, email: user.email, role: user.role })
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session callback iniciado - Token:', { id: token.id, role: token.role })
      console.log('Session callback iniciado - Session inicial:', session)
      
      if (session.user && token.id && token.role) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        console.log('Session callback - Sessão processada:', { 
          id: session.user.id, 
          email: session.user.email, 
          role: session.user.role 
        })
      } else {
        console.error('Session callback - Dados incompletos:', {
          hasSessionUser: !!session.user,
          hasTokenId: !!token.id,
          hasTokenRole: !!token.role
        })
      }
      
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback - URL:', url, 'BaseURL:', baseUrl)
      
      // Para login do admin, sempre redirecionar para o dashboard
      if (url.includes('/admin/dashboard') || url === '/admin/dashboard') {
        console.log('Redirecionando para admin dashboard')
        return `${baseUrl}/admin/dashboard`
      }
      
      // Se a URL é relativa, adicionar baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      
      // Se a URL é do mesmo domínio, permitir
      if (url.startsWith(baseUrl)) {
        return url
      }
      
      // Caso contrário, redirecionar para a home
      return baseUrl
    }
  }
}