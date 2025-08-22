'use client'

import { useState, useEffect } from 'react'

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
    model?: {
      id: string
      name: string
      brand: { name: string }
    }
    brandName?: string
    modelName?: string
  }>
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
  phone?: string
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
  
  // Estados para produtos
  const [showAddForm, setShowAddForm] = useState(false)
  const [showModalProductForm, setShowModalProductForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
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

  // Estados para produto modal
  const [newModalProduct, setNewModalProduct] = useState({
    name: '',
    description: '',
    brand: '',
    categoryId: '',
    quickAddIncrement: '',
    isModalProduct: true
  })

  // Estados para gerenciamento de modelos
  const [showModelsManager, setShowModelsManager] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productModels, setProductModels] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [showAddModelForm, setShowAddModelForm] = useState(false)
  const [newModel, setNewModel] = useState({
    brandName: '',
    modelName: '',
    price: '',
    superWholesalePrice: ''
  })

  // Estados para visualização global de marcas/modelos
  const [showBrandModels, setShowBrandModels] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [brandModels, setBrandModels] = useState<any[]>([])

  // Estados para fornecedores
  const [showAddSupplierForm, setShowAddSupplierForm] = useState(false)
  const [showEditSupplierForm, setShowEditSupplierForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    notes: ''
  })

  useEffect(() => {
    console.log('AdminDashboardClient - Usuário autenticado:', user)
    
    // Carregar dados iniciais
    fetchProducts()
    fetchCategories()
    fetchSuppliers()
    fetchCompanySettings()
    fetchBrands()
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

  // Handlers para produtos
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
      selectedImages.forEach((file, index) => {
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

  const handleAddModalProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const productData = {
        name: newModalProduct.name,
        description: newModalProduct.description,
        brand: newModalProduct.brand,
        categoryId: newModalProduct.categoryId,
        quickAddIncrement: newModalProduct.quickAddIncrement
      }

      const response = await fetch('/api/products/modal-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        alert('Produto modal criado com sucesso! Agora você pode adicionar modelos específicos.')
        await fetchProducts()
        setShowModalProductForm(false)
        setNewModalProduct({
          name: '',
          description: '',
          brand: '',
          categoryId: '',
          quickAddIncrement: '',
          isModalProduct: true
        })
      } else {
        const errorData = await response.json()
        alert(`Erro ao criar produto modal: ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao criar produto modal:', error)
      alert('Erro ao criar produto modal')
    }
  }

  const handleManageModels = async (product: Product) => {
    setSelectedProduct(product)
    setShowModelsManager(true)
    await fetchProductModels(product.id)
    await fetchBrands()
  }

  const fetchProductModels = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/models`)
      if (response.ok) {
        const models = await response.json()
        setProductModels(models)
      } else {
        console.error('Erro ao buscar modelos do produto')
        setProductModels([])
      }
    } catch (error) {
      console.error('Erro ao buscar modelos:', error)
      setProductModels([])
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/admin/brands')
      if (response.ok) {
        const brandsData = await response.json()
        setBrands(brandsData)
      } else {
        console.error('Erro ao buscar marcas')
        setBrands([])
      }
    } catch (error) {
      console.error('Erro ao buscar marcas:', error)
      setBrands([])
    }
  }

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProduct) return
    
    try {
      const response = await fetch(`/api/products/${selectedProduct.id}/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newModel),
      })

      if (response.ok) {
        alert('Modelo adicionado com sucesso!')
        await fetchProductModels(selectedProduct.id)
        setShowAddModelForm(false)
        setNewModel({
          brandName: '',
          modelName: '',
          price: '',
          superWholesalePrice: ''
        })
      } else {
        const errorData = await response.json()
        alert(`Erro ao adicionar modelo: ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao adicionar modelo:', error)
      alert('Erro ao adicionar modelo')
    }
  }

  const handleViewBrandModels = async (brand: any) => {
    setSelectedBrand(brand)
    setShowBrandModels(true)
    await fetchBrandModels(brand.id)
  }

  const fetchBrandModels = async (brandId: string) => {
    try {
      const response = await fetch(`/api/admin/brands/${brandId}/models`)
      if (response.ok) {
        const models = await response.json()
        setBrandModels(models)
      } else {
        console.error('Erro ao buscar modelos da marca')
        setBrandModels([])
      }
    } catch (error) {
      console.error('Erro ao buscar modelos da marca:', error)
      setBrandModels([])
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
      supplierId: product.suppliers?.[0]?.supplier?.id || '',
      supplierName: product.suppliers?.[0]?.supplier?.name || '',
      supplierPhone: product.suppliers?.[0]?.supplier?.phone || ''
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
          alert('Produto excluído com sucesso!')
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

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/products/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        await fetchProducts()
      } else {
        alert('Erro ao alterar status do produto')
      }
    } catch (error) {
      console.error('Erro ao alterar status do produto:', error)
      alert('Erro ao alterar status do produto')
    }
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

  // Funções para fornecedores
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newSupplier.name) {
      alert('Por favor, digite o nome do fornecedor')
      return
    }
    
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSupplier),
      })

      if (response.ok) {
        alert('Fornecedor adicionado com sucesso!')
        setNewSupplier({
          name: '',
          phone: '',
          address: '',
          email: '',
          notes: ''
        })
        setShowAddSupplierForm(false)
        await fetchSuppliers()
      } else {
        const errorData = await response.json()
        console.error('Erro ao adicionar fornecedor:', errorData)
        alert('Erro ao adicionar fornecedor')
      }
    } catch (error) {
      console.error('Erro ao adicionar fornecedor:', error)
      alert('Erro ao adicionar fornecedor')
    }
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setNewSupplier({
      name: supplier.name,
      phone: supplier.phone || '',
      address: supplier.address || '',
      email: supplier.email || '',
      notes: supplier.notes || ''
    })
    setShowEditSupplierForm(true)
  }

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingSupplier) return
    
    try {
      const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSupplier),
      })

      if (response.ok) {
        alert('Fornecedor atualizado com sucesso!')
        setNewSupplier({
          name: '',
          phone: '',
          address: '',
          email: '',
          notes: ''
        })
        setShowEditSupplierForm(false)
        setEditingSupplier(null)
        await fetchSuppliers()
      } else {
        const errorData = await response.json()
        alert(`Erro ao atualizar fornecedor: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error)
      alert('Erro ao atualizar fornecedor')
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        const response = await fetch(`/api/suppliers/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          alert('Fornecedor excluído com sucesso!')
          await fetchSuppliers()
        } else {
          const errorData = await response.json()
          alert(`Erro ao excluir fornecedor: ${errorData.error}`)
        }
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error)
        alert('Erro ao excluir fornecedor')
      }
    }
  }

  const handleToggleSupplierStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        await fetchSuppliers()
      } else {
        alert('Erro ao alterar status do fornecedor')
      }
    } catch (error) {
      console.error('Erro ao alterar status do fornecedor:', error)
      alert('Erro ao alterar status do fornecedor')
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

          {/* Brands and Models Section */}
          <div className="bg-white shadow rounded-lg mt-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Marcas e Modelos ({brands.length} marcas)
                </h3>
                <button
                  onClick={() => fetchBrands()}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  Atualizar Lista
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {brands.map((brand) => (
                  <div key={brand.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-md font-medium text-gray-900">{brand.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {brand._count?.models || 0} modelo{(brand._count?.models || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewBrandModels(brand)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Ver Modelos
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {brands.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">Nenhuma marca cadastrada ainda.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Marcas são criadas automaticamente ao adicionar modelos aos produtos modais.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Suppliers Section */}
          <div className="bg-white shadow rounded-lg mt-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Fornecedores ({suppliers.length})
                </h3>
                <button
                  onClick={() => setShowAddSupplierForm(!showAddSupplierForm)}
                  className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
                >
                  {showAddSupplierForm ? 'Cancelar' : 'Adicionar Fornecedor'}
                </button>
              </div>

              {/* Add Supplier Form */}
              {showAddSupplierForm && (
                <form onSubmit={handleAddSupplier} className="mb-6 p-4 bg-orange-50 rounded-lg">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome *</label>
                      <input
                        type="text"
                        value={newSupplier.name}
                        onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        required
                        placeholder="Nome do fornecedor"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Telefone</label>
                      <input
                        type="text"
                        value={newSupplier.phone}
                        onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        placeholder="(XX) XXXXX-XXXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        placeholder="email@fornecedor.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Endereço</label>
                      <input
                        type="text"
                        value={newSupplier.address}
                        onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Endereço completo"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Observações</label>
                    <textarea
                      value={newSupplier.notes}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Observações internas sobre o fornecedor..."
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
                    >
                      Salvar Fornecedor
                    </button>
                  </div>
                </form>
              )}

              {/* Suppliers List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fornecedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.name}
                            </div>
                            {supplier.address && (
                              <div className="text-sm text-gray-500">
                                {supplier.address}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {supplier.phone && (
                              <div>📞 {supplier.phone}</div>
                            )}
                            {supplier.email && (
                              <div>✉️ {supplier.email}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            supplier.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {supplier.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditSupplier(supplier)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleSupplierStatus(supplier.id, supplier.isActive)}
                              className={`${
                                supplier.isActive 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {supplier.isActive ? 'Desativar' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {suppliers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          Nenhum fornecedor cadastrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white shadow rounded-lg mt-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Produtos ({products.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAddForm(!showAddForm)
                      setShowModalProductForm(false)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    {showAddForm ? 'Cancelar' : 'Adicionar Produto'}
                  </button>
                  <button
                    onClick={() => {
                      setShowModalProductForm(!showModalProductForm)
                      setShowAddForm(false)
                    }}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                  >
                    {showModalProductForm ? 'Cancelar' : 'Produto Modal'}
                  </button>
                </div>
              </div>

              {/* Add Product Form */}
              {showAddForm && (
                <form onSubmit={handleAddProduct} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome</label>
                      <input
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subnome</label>
                      <input
                        type="text"
                        value={newProduct.subname}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, subname: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Marca</label>
                      <input
                        type="text"
                        value={newProduct.brand}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preço</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preço Super Atacado</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newProduct.superWholesalePrice}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, superWholesalePrice: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantidade Super Atacado</label>
                      <input
                        type="number"
                        value={newProduct.superWholesaleQuantity}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, superWholesaleQuantity: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Custo</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newProduct.cost}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, cost: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Categoria</label>
                      <select
                        value={newProduct.categoryId}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, categoryId: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                      <select
                        value={newProduct.supplierId}
                        onChange={(e) => {
                          const selectedSupplierId = e.target.value
                          const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId)
                          setNewProduct(prev => ({ 
                            ...prev, 
                            supplierId: selectedSupplierId,
                            supplierName: selectedSupplier?.name || '',
                            supplierPhone: selectedSupplier?.phone || ''
                          }))
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione um fornecedor</option>
                        {suppliers.filter(s => s.isActive).map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name} {supplier.phone ? `(${supplier.phone})` : ''}
                          </option>
                        ))}
                      </select>
                      {newProduct.supplierId === '' && (
                        <p className="mt-1 text-xs text-gray-500">
                          Ou adicione um fornecedor personalizado nos campos abaixo
                        </p>
                      )}
                    </div>

                    {newProduct.supplierId === '' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nome do Fornecedor (Personalizado)</label>
                          <input
                            type="text"
                            value={newProduct.supplierName}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, supplierName: e.target.value }))}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nome do fornecedor"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Telefone do Fornecedor (Personalizado)</label>
                          <input
                            type="text"
                            value={newProduct.supplierPhone}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, supplierPhone: e.target.value }))}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="(XX) XXXXX-XXXX"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Imagens</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="mt-1 block w-full text-sm text-gray-500"
                    />
                    {selectedImages.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">{selectedImages.length} imagem(ns) selecionada(s)</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedImages.map((file, index) => (
                            <div key={index} className="relative">
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      Salvar Produto
                    </button>
                  </div>
                </form>
              )}

              {/* Add Modal Product Form */}
              {showModalProductForm && (
                <form onSubmit={handleAddModalProduct} className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="text-lg font-medium text-purple-900 mb-4">Adicionar Produto Modal (Capas/Películas)</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome do Produto *</label>
                      <input
                        type="text"
                        value={newModalProduct.name}
                        onChange={(e) => setNewModalProduct({ ...newModalProduct, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        required
                        placeholder="ex: Capa de Silicone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Categoria *</label>
                      <select
                        value={newModalProduct.categoryId}
                        onChange={(e) => setNewModalProduct({ ...newModalProduct, categoryId: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        required
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Marca (opcional)</label>
                      <input
                        type="text"
                        value={newModalProduct.brand}
                        onChange={(e) => setNewModalProduct({ ...newModalProduct, brand: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        placeholder="ex: Genérica"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Incremento para Super Atacado</label>
                      <select
                        value={newModalProduct.quickAddIncrement}
                        onChange={(e) => setNewModalProduct({ ...newModalProduct, quickAddIncrement: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      >
                        <option value="">Selecione o incremento</option>
                        <option value="25">25 unidades</option>
                        <option value="50">50 unidades</option>
                        <option value="100">100 unidades</option>
                        <option value="200">200 unidades</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Descrição</label>
                      <textarea
                        value={newModalProduct.description}
                        onChange={(e) => setNewModalProduct({ ...newModalProduct, description: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        placeholder="Descrição do produto..."
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>Produto Modal:</strong> Após criar este produto, você poderá adicionar modelos específicos (ex: iPhone 12, Samsung S21) com preços individuais para cada modelo.
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                    >
                      Criar Produto Modal
                    </button>
                  </div>
                </form>
              )}

              {/* Products List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                {product.isModalProduct && (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                    Modal
                                  </span>
                                )}
                              </div>
                              {product.subname && (
                                <div className="text-sm text-gray-500">
                                  {product.subname}
                                </div>
                              )}
                              {product.isModalProduct && product.models && product.models.length > 0 && (
                                <div className="text-xs text-purple-600">
                                  {product.models.length} modelo{product.models.length !== 1 ? 's' : ''} cadastrado{product.models.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.category?.name || 'Sem categoria'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R$ {product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-1">
                            <div className="space-x-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleToggleAvailability(product.id, product.isActive)}
                                className={`${
                                  product.isActive 
                                    ? 'text-red-600 hover:text-red-900' 
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                              >
                                {product.isActive ? 'Desativar' : 'Ativar'}
                              </button>
                            </div>
                            {product.isModalProduct && (
                              <button
                                onClick={() => handleManageModels(product)}
                                className="text-purple-600 hover:text-purple-900 text-xs"
                              >
                                Gerenciar Modelos
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de Gestão de Modelos */}
      {showModelsManager && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Gerenciar Modelos - {selectedProduct.name}
              </h3>
              <button
                onClick={() => setShowModelsManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={() => setShowAddModelForm(!showAddModelForm)}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
              >
                {showAddModelForm ? 'Cancelar' : 'Adicionar Modelo'}
              </button>
            </div>

            {/* Formulário de Adicionar Modelo */}
            {showAddModelForm && (
              <form onSubmit={handleAddModel} className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-md font-medium text-purple-900 mb-4">Novo Modelo</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Marca *</label>
                    <input
                      type="text"
                      value={newModel.brandName}
                      onChange={(e) => setNewModel({ ...newModel, brandName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      required
                      placeholder="ex: Apple, Samsung"
                      list="brands-list"
                    />
                    <datalist id="brands-list">
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Modelo *</label>
                    <input
                      type="text"
                      value={newModel.modelName}
                      onChange={(e) => setNewModel({ ...newModel, modelName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      required
                      placeholder="ex: iPhone 13, Galaxy S21"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preço Atacado *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newModel.price}
                      onChange={(e) => setNewModel({ ...newModel, price: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preço Super Atacado</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newModel.superWholesalePrice}
                      onChange={(e) => setNewModel({ ...newModel, superWholesalePrice: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {selectedProduct.quickAddIncrement && (
                  <div className="mt-3 p-2 bg-purple-100 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>Super Atacado:</strong> Ativado a partir de {selectedProduct.quickAddIncrement} unidades
                    </p>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                  >
                    Adicionar Modelo
                  </button>
                </div>
              </form>
            )}

            {/* Lista de Modelos */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marca / Modelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço Atacado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Super Atacado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productModels.map((model) => (
                    <tr key={model.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {model.brandName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {model.modelName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {model.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {model.superWholesalePrice ? `R$ ${model.superWholesalePrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-2">
                          Editar
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {productModels.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Nenhum modelo cadastrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Modelos por Marca */}
      {showBrandModels && selectedBrand && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Modelos da Marca: {selectedBrand.name}
              </h3>
              <button
                onClick={() => setShowBrandModels(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Criação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produtos Relacionados
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {brandModels.map((model) => (
                    <tr key={model.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {model.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(model.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {model._count?.productModels || 0} produto{(model._count?.productModels || 0) !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  ))}
                  {brandModels.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                        Nenhum modelo encontrado para esta marca
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Dica:</strong> Para adicionar novos modelos a esta marca, vá até um produto modal 
                e use a função "Gerenciar Modelos".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Fornecedor */}
      {showEditSupplierForm && editingSupplier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Editar Fornecedor - {editingSupplier.name}
              </h3>
              <button
                onClick={() => {
                  setShowEditSupplierForm(false)
                  setEditingSupplier(null)
                  setNewSupplier({
                    name: '',
                    phone: '',
                    address: '',
                    email: '',
                    notes: ''
                  })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateSupplier} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome *</label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    required
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    placeholder="(XX) XXXXX-XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    placeholder="email@fornecedor.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Endereço</label>
                  <input
                    type="text"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Endereço completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea
                  value={newSupplier.notes}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Observações internas sobre o fornecedor..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSupplierForm(false)
                    setEditingSupplier(null)
                    setNewSupplier({
                      name: '',
                      phone: '',
                      address: '',
                      email: '',
                      notes: ''
                    })
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
                >
                  Atualizar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}