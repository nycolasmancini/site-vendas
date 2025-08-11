'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  subname?: string
  description: string
  brand?: string
  price: number
  superWholesalePrice?: number
  superWholesaleQuantity?: number
  cost?: number
  categoryId: string
  isActive: boolean
  isModalProduct?: boolean
  quickAddIncrement?: number
  category: {
    name: string
  }
  images: Array<{ id: string; url: string; isMain: boolean }>
  suppliers: Array<{ id: string; supplier: { name: string; phone?: string } }>
  models?: Array<{
    id: string
    price: number
    superWholesalePrice?: number
    model: {
      id: string
      name: string
      brand: { name: string }
    }
  }>
  createdAt: string
}

interface Category {
  id: string
  name: string
}

interface Supplier {
  id: string
  name: string
  phone?: string
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showModalForm, setShowModalForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showManageModels, setShowManageModels] = useState(false)
  const [managingProduct, setManagingProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [newProduct, setNewProduct] = useState({
    name: '',
    subname: '',
    description: '',
    brand: '',
    price: '',
    superWholesalePrice: '',
    superWholesaleQuantity: '',
    cost: '',
    categoryId: '',
    supplierId: '',
    supplierName: '',
    supplierPhone: ''
  })

  const [newModalProduct, setNewModalProduct] = useState({
    name: '',
    description: '',
    categoryId: '',
    quickAddIncrement: '25',
    models: [] as { brandName: string; modelName: string; price: string; superWholesalePrice: string }[]
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/admin/login')
      return
    }

    fetchProducts()
    fetchCategories()
    fetchSuppliers()
    fetchCompanySettings()
  }, [session, status, router])

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedImages(prev => [...prev, ...files])
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedImages.length === 0) {
      alert('Por favor, selecione pelo menos uma imagem')
      return
    }
    
    try {
      const formData = new FormData()
      
      // Adicionar dados do produto
      formData.append('name', newProduct.name)
      formData.append('subname', newProduct.subname)
      formData.append('description', newProduct.description)
      formData.append('brand', newProduct.brand)
      formData.append('price', newProduct.price)
      formData.append('superWholesalePrice', newProduct.superWholesalePrice)
      formData.append('superWholesaleQuantity', newProduct.superWholesaleQuantity)
      formData.append('cost', newProduct.cost)
      formData.append('categoryId', newProduct.categoryId)
      formData.append('supplierName', newProduct.supplierName)
      formData.append('supplierPhone', newProduct.supplierPhone)
      
      // Adicionar imagens
      console.log(`Enviando ${selectedImages.length} imagens`)
      selectedImages.forEach((file, index) => {
        console.log(`Imagem ${index}: ${file.name}, ${file.size} bytes, ${file.type}`)
        formData.append('images', file)
        if (index === 0) formData.append('mainImageIndex', '0')
      })

      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        alert('Produto adicionado com sucesso!')
        await fetchProducts()
        setShowAddForm(false)
        setSelectedImages([])
        setNewProduct({
          name: '',
          subname: '',
          description: '',
          brand: '',
          price: '',
          superWholesalePrice: '',
          superWholesaleQuantity: '',
          cost: '',
          categoryId: '',
          supplierId: '',
          supplierName: '',
          supplierPhone: ''
        })
      } else {
        const errorData = await response.json()
        alert(`Erro ao adicionar produto: ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao adicionar produto:', error)
      alert('Erro ao adicionar produto')
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      subname: product.subname || '',
      description: product.description || '',
      brand: product.brand || '',
      price: product.price.toString(),
      superWholesalePrice: product.superWholesalePrice?.toString() || '',
      superWholesaleQuantity: product.superWholesaleQuantity?.toString() || '',
      cost: product.cost?.toString() || '',
      categoryId: product.categoryId,
      supplierId: '',
      supplierName: product.suppliers[0]?.supplier.name || '',
      supplierPhone: product.suppliers[0]?.supplier.phone || ''
    })
    setSelectedImages([])
    setShowEditForm(true)
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingProduct) return
    
    try {
      const formData = new FormData()
      
      // Adicionar dados do produto
      formData.append('name', newProduct.name)
      formData.append('subname', newProduct.subname)
      formData.append('description', newProduct.description)
      formData.append('brand', newProduct.brand)
      formData.append('price', newProduct.price)
      formData.append('superWholesalePrice', newProduct.superWholesalePrice)
      formData.append('superWholesaleQuantity', newProduct.superWholesaleQuantity)
      formData.append('cost', newProduct.cost)
      formData.append('categoryId', newProduct.categoryId)
      formData.append('supplierName', newProduct.supplierName)
      formData.append('supplierPhone', newProduct.supplierPhone)
      
      // Adicionar novas imagens se houver
      selectedImages.forEach((file, index) => {
        formData.append('images', file)
        if (index === 0) formData.append('mainImageIndex', '0')
      })

      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        body: formData,
      })

      if (response.ok) {
        alert('Produto atualizado com sucesso!')
        await fetchProducts()
        setShowEditForm(false)
        setEditingProduct(null)
        setSelectedImages([])
        setNewProduct({
          name: '',
          subname: '',
          description: '',
          brand: '',
          price: '',
          superWholesalePrice: '',
          superWholesaleQuantity: '',
          cost: '',
          categoryId: '',
          supplierId: '',
          supplierName: '',
          supplierPhone: ''
        })
      } else {
        const errorData = await response.json()
        alert(`Erro ao atualizar produto: ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      alert('Erro ao atualizar produto')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchProducts()
        } else {
          alert('Erro ao excluir produto')
        }
      } catch (error) {
        console.error('Erro ao excluir produto:', error)
        alert('Erro ao excluir produto')
      }
    }
  }

  const addModalProductModel = () => {
    setNewModalProduct(prev => ({
      ...prev,
      models: [...prev.models, { brandName: '', modelName: '', price: '', superWholesalePrice: '' }]
    }))
  }

  const removeModalProductModel = (index: number) => {
    setNewModalProduct(prev => ({
      ...prev,
      models: prev.models.filter((_, i) => i !== index)
    }))
  }

  const updateModalProductModel = (index: number, field: string, value: string) => {
    setNewModalProduct(prev => ({
      ...prev,
      models: prev.models.map((model, i) => 
        i === index ? { ...model, [field]: value } : model
      )
    }))
  }

  const handleAddModalProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedImages.length === 0) {
      alert('Por favor, selecione pelo menos uma imagem')
      return
    }
    
    if (newModalProduct.models.length === 0) {
      alert('Por favor, adicione pelo menos um modelo')
      return
    }
    
    try {
      const formData = new FormData()
      
      // Dados do produto de modal
      formData.append('name', newModalProduct.name)
      formData.append('description', newModalProduct.description)
      formData.append('categoryId', newModalProduct.categoryId)
      formData.append('quickAddIncrement', newModalProduct.quickAddIncrement)
      formData.append('isModalProduct', 'true')
      formData.append('models', JSON.stringify(newModalProduct.models))
      
      // Adicionar imagens
      selectedImages.forEach((file, index) => {
        formData.append('images', file)
        if (index === 0) formData.append('mainImageIndex', '0')
      })

      const response = await fetch('/api/products/modal', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        alert('Produto de modal adicionado com sucesso!')
        await fetchProducts()
        setShowModalForm(false)
        setSelectedImages([])
        setNewModalProduct({
          name: '',
          description: '',
          categoryId: '',
          quickAddIncrement: '25',
          models: []
        })
      } else {
        const errorData = await response.json()
        alert(`Erro ao adicionar produto: ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao adicionar produto de modal:', error)
      alert('Erro ao adicionar produto de modal')
    }
  }

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        await fetchProducts()
        const newStatus = !currentStatus ? 'disponível' : 'indisponível'
        alert(`Produto marcado como ${newStatus}`)
      } else {
        alert('Erro ao alterar disponibilidade do produto')
      }
    } catch (error) {
      console.error('Erro ao alterar disponibilidade do produto:', error)
      alert('Erro ao alterar disponibilidade do produto')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {companySettings?.logo && (
                <img 
                  src={companySettings.logo} 
                  alt="PMCELL" 
                  className="h-13 w-auto object-contain"
                />
              )}
              <div className="flex flex-col justify-center">
                <span className="text-2xl font-bold text-black leading-none">PMCELL</span>
                <span className="text-sm font-light text-black leading-tight">São Paulo</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Painel Administrativo
              </h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                style={{ backgroundColor: '#FC6D36' }}
              >
                Produto Normal
              </button>
              <button
                onClick={() => setShowModalForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Produto Modal
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Seção de Upload do Logo */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Logo da Empresa</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Logo Atual */}
              <div className="flex-shrink-0">
                <div className="h-20 w-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  {companySettings?.logo ? (
                    <img
                      src={companySettings.logo}
                      alt="Logo atual"
                      className="h-full w-full object-contain rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm text-center">Sem logo</span>
                  )}
                </div>
              </div>
              
              {/* Upload Controls */}
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                  <button
                    onClick={handleLogoUpload}
                    disabled={!logoFile}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    style={{ backgroundColor: logoFile ? '#FC6D36' : undefined }}
                  >
                    Salvar Logo
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Formatos aceitos: PNG, JPG, GIF. Tamanho recomendado: 200x80px.
                </p>
                
                {/* Preview do novo logo */}
                {logoFile && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Preview do novo logo:</p>
                    <img
                      src={URL.createObjectURL(logoFile)}
                      alt="Preview do logo"
                      className="h-16 w-auto object-contain border border-gray-200 rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Lista de produtos */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {products.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Nenhum produto encontrado. Adicione o primeiro produto!
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {products.map((product) => (
                <li key={product.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {product.images && product.images.length > 0 && (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={product.images.find(img => img.isMain)?.url || product.images[0]?.url}
                          alt={product.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      <div className={product.images && product.images.length > 0 ? "ml-4" : ""}>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name || 'Produto sem nome'}
                          {product.subname && <span className="text-gray-500"> - {product.subname}</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.category?.name || 'Sem categoria'} • R$ {(product.price || 0).toFixed(2)}
                          {product.superWholesalePrice && (
                            <span> • Super Atacado: R$ {product.superWholesalePrice.toFixed(2)} ({product.superWholesaleQuantity}+ unid.)</span>
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.isActive ? 'Disponível' : 'Indisponível'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => handleToggleAvailability(product.id, product.isActive)}
                        className={`text-xs px-3 py-1 rounded-md font-medium ${
                          product.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {product.isActive ? 'Marcar Indisponível' : 'Marcar Disponível'}
                      </button>
                      {product.isModalProduct && (
                        <button
                          onClick={() => {
                            setManagingProduct(product)
                            setShowManageModels(true)
                          }}
                          className="text-purple-600 hover:text-purple-900 text-sm"
                        >
                          Gerenciar Modelos
                        </button>
                      )}
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Modal para adicionar produto */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Adicionar Novo Produto
            </h3>
            <form onSubmit={handleAddProduct} className="max-h-screen overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome do Produto */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Subnome */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Subnome (tipo de saída, etc.)
                  </label>
                  <input
                    type="text"
                    value={newProduct.subname}
                    onChange={(e) => setNewProduct({ ...newProduct, subname: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ex: USB-C, Lightning, P2..."
                  />
                </div>
              </div>
              
              {/* Descrição */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Descrição *
                </label>
                <textarea
                  required
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                />
              </div>

              {/* Marca */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Marca
                </label>
                <input
                  type="text"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: Samsung, Apple, Xiaomi..."
                />
              </div>

              {/* Preços */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Preço Atacado *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Preço Super Atacado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.superWholesalePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, superWholesalePrice: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Qtd. Mín. Super Atacado
                  </label>
                  <input
                    type="number"
                    value={newProduct.superWholesaleQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, superWholesaleQuantity: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Informações Internas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Valor de Custo (interno)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Categoria *
                  </label>
                  <select
                    required
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fornecedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Nome do Fornecedor (interno)
                  </label>
                  <input
                    type="text"
                    value={newProduct.supplierName}
                    onChange={(e) => setNewProduct({ ...newProduct, supplierName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Telefone do Fornecedor (interno)
                  </label>
                  <input
                    type="tel"
                    value={newProduct.supplierPhone}
                    onChange={(e) => setNewProduct({ ...newProduct, supplierPhone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Upload de Imagens */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Imagens do Produto *
                </label>
                <div className="mt-1 space-y-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500">
                    Selecione uma ou mais imagens. A primeira será a imagem principal.
                  </p>
                </div>
                
                {/* Preview das imagens */}
                {selectedImages.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedImages.length} imagem{selectedImages.length !== 1 ? 's' : ''} selecionada{selectedImages.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 flex items-center justify-center"
                          >
                            ×
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-0 left-0 bg-green-500 text-white text-xs px-1 rounded-tr">
                              Principal
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setSelectedImages([])
                    setNewProduct({
                      name: '',
                      subname: '',
                      description: '',
                      brand: '',
                      price: '',
                      superWholesalePrice: '',
                      superWholesaleQuantity: '',
                      cost: '',
                      categoryId: '',
                      supplierId: '',
                      supplierName: '',
                      supplierPhone: ''
                    })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
                  style={{ backgroundColor: '#FC6D36' }}
                >
                  Adicionar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar produto */}
      {showEditForm && editingProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Editar Produto: {editingProduct.name}
            </h3>
            <form onSubmit={handleUpdateProduct} className="max-h-screen overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome do Produto */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Subnome */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Subnome (tipo de saída, etc.)
                  </label>
                  <input
                    type="text"
                    value={newProduct.subname}
                    onChange={(e) => setNewProduct({ ...newProduct, subname: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ex: USB-C, Lightning, P2..."
                  />
                </div>
              </div>
              
              {/* Descrição */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Descrição *
                </label>
                <textarea
                  required
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                />
              </div>

              {/* Marca */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Marca
                </label>
                <input
                  type="text"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: Samsung, Apple, Xiaomi..."
                />
              </div>

              {/* Preços */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Preço Atacado *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Preço Super Atacado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.superWholesalePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, superWholesalePrice: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Qtd. Mín. Super Atacado
                  </label>
                  <input
                    type="number"
                    value={newProduct.superWholesaleQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, superWholesaleQuantity: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Informações Internas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Valor de Custo (interno)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Categoria *
                  </label>
                  <select
                    required
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Imagens Atuais */}
              {editingProduct.images && editingProduct.images.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagens Atuais
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {editingProduct.images.map((image, index) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.url}
                          alt={`Imagem ${index}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        {image.isMain && (
                          <span className="absolute bottom-0 left-0 bg-green-500 text-white text-xs px-1 rounded-tr">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload de Novas Imagens */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Adicionar Novas Imagens (opcional)
                </label>
                <div className="mt-1 space-y-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500">
                    Selecione novas imagens se desejar adicionar mais. Elas serão adicionadas às imagens existentes.
                  </p>
                </div>
                
                {/* Preview das novas imagens */}
                {selectedImages.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedImages.length} nova{selectedImages.length !== 1 ? 's' : ''} imagem{selectedImages.length !== 1 ? 'ns' : ''} a ser{selectedImages.length !== 1 ? 'em' : ''} adicionada{selectedImages.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Nova imagem ${index}`}
                            className="w-full h-20 object-cover rounded border border-blue-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingProduct(null)
                    setSelectedImages([])
                    setNewProduct({
                      name: '',
                      subname: '',
                      description: '',
                      brand: '',
                      price: '',
                      superWholesalePrice: '',
                      superWholesaleQuantity: '',
                      cost: '',
                      categoryId: '',
                      supplierId: '',
                      supplierName: '',
                      supplierPhone: ''
                    })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
                  style={{ backgroundColor: '#FC6D36' }}
                >
                  Atualizar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para adicionar produto de modal (capas/películas) */}
      {showModalForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Adicionar Produto de Modal (Capas/Películas)
            </h3>
            <form onSubmit={handleAddModalProduct} className="max-h-screen overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome do Produto */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newModalProduct.name}
                    onChange={(e) => setNewModalProduct({ ...newModalProduct, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Película 3D, Capa de Silicone..."
                  />
                </div>

                {/* Categoria */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Categoria *
                  </label>
                  <select
                    required
                    value={newModalProduct.categoryId}
                    onChange={(e) => setNewModalProduct({ ...newModalProduct, categoryId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Descrição *
                </label>
                <textarea
                  required
                  value={newModalProduct.description}
                  onChange={(e) => setNewModalProduct({ ...newModalProduct, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Descreva o produto..."
                />
              </div>

              {/* Incremento de Adição Rápida */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Incremento para Adição Rápida *
                </label>
                <select
                  required
                  value={newModalProduct.quickAddIncrement}
                  onChange={(e) => setNewModalProduct({ ...newModalProduct, quickAddIncrement: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1">1 em 1</option>
                  <option value="5">5 em 5</option>
                  <option value="10">10 em 10</option>
                  <option value="25">25 em 25</option>
                  <option value="50">50 em 50</option>
                  <option value="100">100 em 100</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Quantidade que será adicionada/removida nos botões de incremento rápido
                </p>
              </div>

              {/* Upload de Imagens */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">
                  Imagens do Produto *
                </label>
                <div className="mt-1 space-y-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    Selecione uma ou mais imagens. A primeira será a imagem principal.
                  </p>
                </div>
                
                {/* Preview das imagens */}
                {selectedImages.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedImages.length} imagem{selectedImages.length !== 1 ? 's' : ''} selecionada{selectedImages.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 flex items-center justify-center"
                          >
                            ×
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-0 left-0 bg-green-500 text-white text-xs px-1 rounded-tr">
                              Principal
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modelos */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900">Modelos e Preços</h4>
                  <button
                    type="button"
                    onClick={addModalProductModel}
                    className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                  >
                    + Adicionar Modelo
                  </button>
                </div>

                {newModalProduct.models.length === 0 && (
                  <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded">
                    Nenhum modelo adicionado. Clique em "Adicionar Modelo" para começar.
                  </div>
                )}

                <div className="space-y-4">
                  {newModalProduct.models.map((model, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <h5 className="text-sm font-medium text-gray-800">Modelo {index + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeModalProductModel(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600">
                            Marca do Celular *
                          </label>
                          <input
                            type="text"
                            required
                            value={model.brandName}
                            onChange={(e) => updateModalProductModel(index, 'brandName', e.target.value)}
                            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Ex: Samsung, Apple, Xiaomi..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">
                            Modelo do Celular *
                          </label>
                          <input
                            type="text"
                            required
                            value={model.modelName}
                            onChange={(e) => updateModalProductModel(index, 'modelName', e.target.value)}
                            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Ex: Galaxy S23, iPhone 14 Pro..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">
                            Preço Atacado *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={model.price}
                            onChange={(e) => updateModalProductModel(index, 'price', e.target.value)}
                            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">
                            Preço Super Atacado
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={model.superWholesalePrice}
                            onChange={(e) => updateModalProductModel(index, 'superWholesalePrice', e.target.value)}
                            className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalForm(false)
                    setSelectedImages([])
                    setNewModalProduct({
                      name: '',
                      description: '',
                      categoryId: '',
                      quickAddIncrement: '25',
                      models: []
                    })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Adicionar Produto de Modal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para gerenciar modelos de produto de modal */}
      {showManageModels && managingProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Gerenciar Modelos: {managingProduct.name}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Tipo: Produto de Modal | Incremento: {managingProduct.quickAddIncrement || 25}
              </p>
            </div>

            {managingProduct.models && managingProduct.models.length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Modelos Cadastrados:</h4>
                <div className="grid gap-4">
                  {managingProduct.models.map((productModel) => (
                    <div key={productModel.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            {productModel.model.brand.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {productModel.model.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Preço Atacado</p>
                          <p className="font-semibold text-blue-600">
                            R$ {productModel.price.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Super Atacado</p>
                          <p className="font-semibold text-green-600">
                            {productModel.superWholesalePrice 
                              ? `R$ ${productModel.superWholesalePrice.toFixed(2)}`
                              : 'Não definido'
                            }
                          </p>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              // TODO: Implement edit model
                              console.log('Edit model:', productModel.id)
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              // TODO: Implement remove model
                              console.log('Remove model:', productModel.id)
                            }}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Adicionar Novos Modelos</h5>
                  <p className="text-sm text-blue-700 mb-4">
                    Para adicionar novos modelos, use o formulário "Produto Modal" no menu principal.
                    Você pode criar um produto temporário só com os novos modelos e depois transferir os modelos para este produto.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h4 className="mt-2 text-lg font-medium text-gray-900">Nenhum modelo cadastrado</h4>
                <p className="mt-2 text-sm text-gray-500">
                  Use o formulário "Produto Modal" para adicionar modelos a este produto.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowManageModels(false)
                  setManagingProduct(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}