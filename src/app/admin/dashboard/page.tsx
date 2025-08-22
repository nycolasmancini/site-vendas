import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboard() {
  console.log('Dashboard Server Component - Verificando sessão...')
  
  // Verificar sessão no servidor
  const session = await getServerSession(authOptions)
  
  console.log('Dashboard Server Component - Sessão:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role
    } : null
  })
  
  // Se não há sessão, redirecionar para login
  if (!session || !session.user || !session.user.email) {
    console.log('Dashboard Server Component - Sem sessão ou dados incompletos, redirecionando...')
    redirect('/admin/login')
  }
  
  // Verificar se o usuário tem acesso (ADMIN ou EMPLOYEE)
  if (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE') {
    console.log('Dashboard Server Component - Role inválido:', session.user.role)
    redirect('/admin/login')
  }
  
  console.log('Dashboard Server Component - Usuário autorizado, renderizando cliente...')
  
  // Garantir que os dados estão no formato correto para o componente cliente
  const userData = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || undefined,
    role: session.user.role || 'USER'
  }
  
  // Renderizar componente cliente com dados da sessão
  return <AdminDashboardClient user={userData} />
}