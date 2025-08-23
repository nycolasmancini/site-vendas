'use client'

import AdminDashboardClient from './AdminDashboardClient'

export default function AdminDashboard() {
  console.log('Dashboard - Acesso livre ao painel administrativo')
  
  // Dados padrão para o usuário (sem autenticação)
  const userData = {
    id: 'admin-default',
    email: 'admin@pmcell.com.br',
    name: 'Administrador',
    role: 'ADMIN'
  }
  
  // Renderizar componente cliente com dados padrão
  return <AdminDashboardClient user={userData} />
}