'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  subname?: string
  description: string
  price: number
  superWholesalePrice?: number
  superWholesaleQuantity?: number
  cost?: number
  categoryId: string
  category: {
    name: string
  }
  images: Array<{ id: string; url: string; isMain: boolean }>
  suppliers: Array<{ id: string; supplier: { name: string; phone?: string } }>
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
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [newProduct, setNewProduct] = useState({
    name: '',
    subname: '',
    description: '',
    price: '',
    superWholesalePrice: '',
    superWholesaleQuantity: '',
    cost: '',
    categoryId: '',
    supplierId: '',
    supplierName: '',
    supplierPhone: ''
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
  }, [session, status, router])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(Array.isArray(data) ? data : [])
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
            <h1 className="text-3xl font-bold text-gray-900">
              Painel Administrativo
            </h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
              style={{ backgroundColor: '#FC6D36' }}
            >
              Adicionar Produto
            </button>
          </div>
        </div>
      </header>

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
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
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
    </div>
  )
}