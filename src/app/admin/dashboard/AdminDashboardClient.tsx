'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  subname?: string
  categoryId: string
  supplierId: string
  price: number
  isActive: boolean
  createdAt: string
}

interface Category {
  id: string
  name: string
  icon?: string
  order?: number
}

interface Supplier {
  id: string
  name: string
  contact?: string
}

interface CompanySettings {
  id: string
  logoUrl?: string
  companyName: string
}

interface User {
  id: string
  email: string
  name?: string
  role: string
}

interface Props {
  user: User
}

export default function AdminDashboardClient({ user }: Props) {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '',
    order: ''
  })
  const [svgFile, setSvgFile] = useState<File | null>(null)

  useEffect(() => {
    console.log('AdminDashboardClient - Usuário autenticado:', user)
    
    // Carregar dados iniciais
    fetchProducts()
    fetchCategories()
    fetchSuppliers()
    fetchCompanySettings()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?admin=true')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        console.error('Erro ao buscar produtos:', response.status)
        setProducts([])
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data) ? data : [])
      } else {
        console.error('Erro ao buscar categorias:', response.status)
        setCategories([])
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      setCategories([])
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(Array.isArray(data) ? data : [])
      } else {
        console.error('Erro ao buscar fornecedores:', response.status)
        setSuppliers([])
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error)
      setSuppliers([])
    }
  }

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/company-settings')
      if (response.ok) {
        const data = await response.json()
        setCompanySettings(data)
      }
    } catch (error) {
      console.error('Erro ao buscar configurações da empresa:', error)
    }
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) return

    try {
      const formData = new FormData()
      formData.append('logo', logoFile)

      const response = await fetch('/api/company-settings', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        alert('Logo atualizado com sucesso!')
        await fetchCompanySettings()
        setLogoFile(null)
      } else {
        alert('Erro ao atualizar logo')
      }
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error)
      alert('Erro ao fazer upload do logo')
    }
  }

  const handleSvgSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
        alert('Por favor, selecione apenas arquivos SVG (.svg)')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const svgContent = e.target?.result as string
        setNewCategory(prev => ({ ...prev, icon: svgContent }))
      }
      reader.readAsText(file)
      setSvgFile(file)
    }
  }

  const handleSvgTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSvgFile(null)
    setNewCategory(prev => ({ ...prev, icon: e.target.value }))
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCategory.name) {
      alert('Por favor, digite o nome da categoria')
      return
    }
    
    try {
      const formData = new FormData()
      formData.append('name', newCategory.name)
      formData.append('icon', newCategory.icon)
      formData.append('order', newCategory.order || '0')

      const response = await fetch('/api/categories', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        alert('Categoria adicionada com sucesso!')
        setNewCategory({ name: '', icon: '', order: '' })
        setSvgFile(null)
        setShowAddCategoryForm(false)
        await fetchCategories()
      } else {
        const errorData = await response.text()
        console.error('Erro ao adicionar categoria:', errorData)
        alert('Erro ao adicionar categoria')
      }
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error)
      alert('Erro ao adicionar categoria')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {user.role}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Bem-vindo, {user.name || user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total de Produtos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {products.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">C</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Categorias
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {categories.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">F</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Fornecedores
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {suppliers.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">A</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Produtos Ativos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {products.filter(p => p.isActive).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Settings Section */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Configurações da Empresa
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Logo Atual
                  </label>
                  {companySettings?.logoUrl ? (
                    <img 
                      src={companySettings.logoUrl} 
                      alt="Logo da empresa" 
                      className="mt-2 h-20 w-auto"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Nenhum logo carregado</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Alterar Logo
                  </label>
                  <div className="mt-2 flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="text-sm text-gray-500"
                    />
                    <button
                      onClick={handleLogoUpload}
                      disabled={!logoFile}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                    >
                      Upload Logo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Categorias ({categories.length})
                </h3>
                <button
                  onClick={() => setShowAddCategoryForm(!showAddCategoryForm)}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  {showAddCategoryForm ? 'Cancelar' : 'Adicionar Categoria'}
                </button>
              </div>

              {showAddCategoryForm && (
                <form onSubmit={handleAddCategory} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nome da Categoria
                      </label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Smartphones"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Ordem (opcional)
                      </label>
                      <input
                        type="number"
                        value={newCategory.order}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, order: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Upload SVG
                      </label>
                      <input
                        type="file"
                        accept=".svg,image/svg+xml"
                        onChange={handleSvgSelect}
                        className="mt-1 block w-full text-sm text-gray-500"
                      />
                      {svgFile && (
                        <p className="mt-1 text-xs text-green-600">
                          Arquivo selecionado: {svgFile.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Ou cole o código SVG:
                    </label>
                    <textarea
                      value={newCategory.icon}
                      onChange={handleSvgTextChange}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="<svg>...</svg>"
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Salvar Categoria
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      {category.icon && (
                        <div 
                          className="w-8 h-8 flex-shrink-0"
                          dangerouslySetInnerHTML={{ __html: category.icon }}
                        />
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {category.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Ordem: {category.order || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}