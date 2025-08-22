'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Iniciando processo de login...')
      
      // Primeiro tentar o método padrão do NextAuth com redirecionamento automático
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/admin/dashboard',
        redirect: false
      })

      console.log('Resultado do signIn:', result)

      if (result?.error) {
        console.error('Erro no login:', result.error)
        setError('Email ou senha inválidos')
        setLoading(false)
      } else if (result?.ok) {
        console.log('Login bem-sucedido! Redirecionando...')
        
        // Verificar sessão via API antes de redirecionar
        setTimeout(async () => {
          try {
            console.log('Verificando sessão via API...')
            const checkResponse = await fetch('/api/auth/check-session')
            const checkData = await checkResponse.json()
            
            console.log('Resposta da verificação:', checkData)
            
            if (checkData.authenticated && checkData.user) {
              console.log('✅ Sessão confirmada via API! Redirecionando...')
              router.push('/admin/dashboard')
            } else {
              console.log('⚠️ Sessão não confirmada, tentando getSession...')
              const session = await getSession()
              console.log('Resultado getSession:', session)
              
              if (session?.user) {
                console.log('✅ Sessão encontrada via getSession!')
                router.push('/admin/dashboard')
              } else {
                console.log('Aguardando mais tempo para sessão...')
                setTimeout(() => {
                  router.push('/admin/dashboard')
                }, 2000)
              }
            }
          } catch (error) {
            console.error('Erro ao verificar sessão:', error)
            // Tentar redirecionamento direto como fallback
            router.push('/admin/dashboard')
          }
          setLoading(false)
        }, 2000)
      } else {
        console.error('Login falhou sem error específico:', result)
        setError('Erro inesperado no login')
        setLoading(false)
      }
    } catch (error) {
      console.error('Erro no processo de login:', error)
      setError('Erro ao fazer login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Painel Administrativo
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Faça login para acessar o painel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#FC6D36' }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}