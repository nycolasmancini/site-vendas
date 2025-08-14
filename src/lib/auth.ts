import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma, testDatabaseConnection, checkDatabaseTables } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
          // Verificar se o banco está disponível
          const dbConnected = await testDatabaseConnection()
          
          if (dbConnected) {
            console.log('🔍 Tentando autenticar com banco de dados...')
            
            // Tentar buscar no novo modelo User primeiro
            let user = await prisma.user.findUnique({
              where: { email: credentials.email }
            })

            // Se não encontrar, buscar no modelo Admin legado
            if (!user) {
              try {
                const admin = await prisma.admin.findUnique({
                  where: { email: credentials.email }
                })

                if (admin) {
                  console.log('👤 Usuário encontrado na tabela Admin legada')
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
                console.log('⚠️ Tabela Admin não encontrada, continuando...')
              }
            } else {
              console.log('👤 Usuário encontrado na tabela User')
            }

            if (!user || !user.isActive) {
              console.log('❌ Usuário não encontrado ou inativo')
              return null
            }

            const passwordMatch = await bcrypt.compare(credentials.password, user.password)

            if (!passwordMatch) {
              console.log('❌ Senha incorreta')
              return null
            }

            console.log('✅ Autenticação bem-sucedida via banco de dados')
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
          console.log('⚠️ Banco de dados indisponível, usando autenticação mock')
          console.log('Erro:', error instanceof Error ? error.message : 'Erro desconhecido')
          
          // Credenciais mock para desenvolvimento quando o banco não está acessível
          const mockUsers = [
            {
              id: 'mock-admin-1',
              email: 'admin@pmcell.com.br',
              name: 'Admin PMCELL (Mock)',
              password: '$2a$10$K7L1OJ0TfU0vSomRgbJYkuVTXfkVpIx8H8A6ghA0B.qY5wlFWGVWe', // senha: admin123
              role: 'ADMIN'
            },
            {
              id: 'mock-employee-1',
              email: 'funcionario@pmcell.com.br',
              name: 'Funcionário PMCELL (Mock)',
              password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // senha: password
              role: 'EMPLOYEE'
            }
          ]

          const mockUser = mockUsers.find(user => user.email === credentials.email)
          
          if (mockUser) {
            const passwordMatch = await bcrypt.compare(credentials.password, mockUser.password)
            
            if (passwordMatch) {
              console.log(`✅ Autenticação mock bem-sucedida para ${mockUser.role}`)
              return {
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role
              }
            }
          }

          console.log('❌ Credenciais mock inválidas')
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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  }
}