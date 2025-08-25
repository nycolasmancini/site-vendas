'use client'

import { useState, useEffect } from 'react'

interface Brand {
  id: string
  name: string
  models: Model[]
}

interface Model {
  id: string
  name: string
  brandId: string
  brand?: Brand
}

interface ProductModel {
  id: string
  brandName: string
  modelName: string
  price: number
  superWholesalePrice?: number
}

interface Product {
  id: string
  name: string
  isModalProduct?: boolean
}

interface EditProductModelsModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onUpdate: () => void
}

export default function EditProductModelsModal({
  isOpen,
  onClose,
  product,
  onUpdate
}: EditProductModelsModalProps) {
  const [productModels, setProductModels] = useState<ProductModel[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Estados para adicionar novo modelo
  const [showAddModelForm, setShowAddModelForm] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newModelName, setNewModelName] = useState('')
  const [newModelPrice, setNewModelPrice] = useState('')
  const [newModelSuperWholesalePrice, setNewModelSuperWholesalePrice] = useState('')
  
  // Estados para edição
  const [editingModel, setEditingModel] = useState<string | null>(null)
  const [editData, setEditData] = useState<{[key: string]: {price: string, wholesalePrice: string}}>({})

  useEffect(() => {
    if (isOpen && product) {
      loadProductModels()
      loadBrands()
    }
  }, [isOpen, product])

  const loadProductModels = async () => {
    if (!product) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${product.id}/models`)
      if (response.ok) {
        const data = await response.json()
        setProductModels(data)
        
        // Inicializar dados de edição
        const initialEditData: {[key: string]: {price: string, wholesalePrice: string}} = {}
        data.forEach((model: ProductModel) => {
          initialEditData[model.id] = {
            price: model.price.toString(),
            wholesalePrice: model.superWholesalePrice?.toString() || ''
          }
        })
        setEditData(initialEditData)
      }
    } catch (error) {
      console.error('Erro ao carregar modelos do produto:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrands(data)
      }
    } catch (error) {
      console.error('Erro ao carregar marcas:', error)
    }
  }

  const handleAddModel = async () => {
    if (!product || !newBrandName || !newModelName || !newModelPrice) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/products/${product.id}/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brandName: newBrandName,
          modelName: newModelName,
          price: newModelPrice,
          superWholesalePrice: newModelSuperWholesalePrice || null
        })
      })

      if (response.ok) {
        setNewBrandName('')
        setNewModelName('')
        setNewModelPrice('')
        setNewModelSuperWholesalePrice('')
        setShowAddModelForm(false)
        loadProductModels()
        onUpdate()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao adicionar modelo')
      }
    } catch (error) {
      console.error('Erro ao adicionar modelo:', error)
      alert('Erro ao adicionar modelo')
    } finally {
      setSaving(false)
    }
  }

  const handleEditModel = async (modelId: string) => {
    if (!product || !editData[modelId]) return

    setSaving(true)
    try {
      const response = await fetch(`/api/products/${product.id}/models/${modelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price: editData[modelId].price,
          superWholesalePrice: editData[modelId].wholesalePrice || null
        })
      })

      if (response.ok) {
        setEditingModel(null)
        loadProductModels()
        onUpdate()
      } else {
        alert('Erro ao atualizar modelo')
      }
    } catch (error) {
      console.error('Erro ao atualizar modelo:', error)
      alert('Erro ao atualizar modelo')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveModel = async (modelId: string, modelName: string) => {
    if (!product) return
    
    if (!confirm(`Tem certeza que deseja remover o modelo "${modelName}" deste produto?`)) {
      return
    }

    setSaving(true)
    try {
      const productModel = productModels.find(pm => pm.id === modelId)
      if (!productModel) {
        alert('Modelo não encontrado')
        return
      }

      // Encontrar o ProductModel ID correto
      const response = await fetch(`/api/products/${product.id}/models/${modelId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadProductModels()
        onUpdate()
      } else {
        alert('Erro ao remover modelo')
      }
    } catch (error) {
      console.error('Erro ao remover modelo:', error)
      alert('Erro ao remover modelo')
    } finally {
      setSaving(false)
    }
  }


  const updateEditData = (modelId: string, field: 'price' | 'wholesalePrice', value: string) => {
    setEditData(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        [field]: value
      }
    }))
  }


  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Gerenciar Modelos - {product.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="text-lg">Carregando modelos...</div>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {/* Modelos existentes */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Modelos Atuais ({productModels.length})
                </h4>
                {productModels.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhum modelo adicionado ainda</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {productModels.map((model) => (
                      <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{model.brandName} - {model.modelName}</div>
                          <div className="text-sm text-gray-500">
                            Atacado: R$ {model.price.toFixed(2)}
                            {model.superWholesalePrice && ` | Super Atacado: R$ ${model.superWholesalePrice.toFixed(2)}`}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {editingModel === model.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Atacado"
                                value={editData[model.id]?.price || ''}
                                onChange={(e) => updateEditData(model.id, 'price', e.target.value)}
                                className="w-24 px-2 py-1 text-sm border rounded"
                              />
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Super Atacado"
                                value={editData[model.id]?.wholesalePrice || ''}
                                onChange={(e) => updateEditData(model.id, 'wholesalePrice', e.target.value)}
                                className="w-28 px-2 py-1 text-sm border rounded"
                              />
                              <button
                                onClick={() => handleEditModel(model.id)}
                                disabled={saving}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingModel(null)}
                                className="text-gray-600 hover:text-gray-800 text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingModel(model.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleRemoveModel(model.id, `${model.brandName} - ${model.modelName}`)}
                                disabled={saving}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remover
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Adicionar novo modelo */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-900">Adicionar Novo Modelo</h4>
                  <button
                    onClick={() => setShowAddModelForm(!showAddModelForm)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
                  >
                    {showAddModelForm ? 'Cancelar' : '+ Adicionar Modelo'}
                  </button>
                </div>

                {showAddModelForm && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marca *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Apple, Samsung..."
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Modelo *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: iPhone 15, Galaxy S24..."
                          value={newModelName}
                          onChange={(e) => setNewModelName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preço Atacado *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newModelPrice}
                          onChange={(e) => setNewModelPrice(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preço Super Atacado
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newModelSuperWholesalePrice}
                          onChange={(e) => setNewModelSuperWholesalePrice(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleAddModel}
                        disabled={saving || !newBrandName || !newModelName || !newModelPrice}
                        className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                      >
                        {saving ? 'Adicionando...' : 'Adicionar Modelo'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddModelForm(false)
                          setNewBrandName('')
                          setNewModelName('')
                          setNewModelPrice('')
                          setNewModelSuperWholesalePrice('')
                        }}
                        className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}