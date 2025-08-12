import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
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
          // Tentar buscar no banco de dados
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email }
          })

          if (!admin) {
            return null
          }

          const passwordMatch = await bcrypt.compare(credentials.password, admin.password)

          if (!passwordMatch) {
            return null
          }

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name
          }
        } catch (error) {
          console.log('Database unavailable, using mock authentication')
          
          // Credenciais mock para desenvolvimento quando o banco não está acessível
          const mockAdmin = {
            id: 'mock-admin-1',
            email: 'admin@pmcell.com.br',
            name: 'Admin PMCELL',
            password: '$2a$10$K7L1OJ0TfU0vSomRgbJYkuVTXfkVpIx8H8A6ghA0B.qY5wlFWGVWe' // senha: admin123
          }

          if (credentials.email === mockAdmin.email) {
            const passwordMatch = await bcrypt.compare(credentials.password, mockAdmin.password)
            
            if (passwordMatch) {
              return {
                id: mockAdmin.id,
                email: mockAdmin.email,
                name: mockAdmin.name
              }
            }
          }

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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}