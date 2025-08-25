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
  isModalProduct: boolean
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
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [newModelPrice, setNewModelPrice] = useState('')
  const [newModelWholesalePrice, setNewModelWholesalePrice] = useState('')
  
  // Estados para edição
  const [editingModel, setEditingModel] = useState<string | null>(null)
  const [editData, setEditData] = useState<{[key: string]: {price: string, wholesalePrice: string}}>({})

  // Estados para criar nova marca/modelo
  const [showAddBrand, setShowAddBrand] = useState(false)
  const [showAddModel, setShowAddModel] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newModelName, setNewModelName] = useState('')
  const [selectedBrandForNewModel, setSelectedBrandForNewModel] = useState('')

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
    if (!product || !selectedModel || !newModelPrice) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const selectedModelData = brands
        .flatMap(b => b.models.map(m => ({ ...m, brandName: b.name })))
        .find(m => m.id === selectedModel)

      if (!selectedModelData) {
        alert('Modelo não encontrado')
        return
      }

      const response = await fetch(`/api/products/${product.id}/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brandName: selectedModelData.brandName,
          modelName: selectedModelData.name,
          price: newModelPrice,
          superWholesalePrice: newModelWholesalePrice || null
        })
      })

      if (response.ok) {
        setSelectedBrand('')
        setSelectedModel('')
        setNewModelPrice('')
        setNewModelWholesalePrice('')
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

  const addBrand = async () => {
    if (!newBrandName.trim()) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newBrandName }),
      })

      if (response.ok) {
        setNewBrandName('')
        setShowAddBrand(false)
        loadBrands()
        alert('Marca adicionada com sucesso!')
      } else {
        alert('Erro ao adicionar marca')
      }
    } catch (error) {
      console.error('Erro ao adicionar marca:', error)
      alert('Erro ao adicionar marca')
    } finally {
      setSaving(false)
    }
  }

  const addModelToBrand = async () => {
    if (!newModelName.trim() || !selectedBrandForNewModel) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newModelName, brandId: selectedBrandForNewModel }),
      })

      if (response.ok) {
        setNewModelName('')
        setSelectedBrandForNewModel('')
        setShowAddModel(false)
        loadBrands()
        alert('Modelo adicionado com sucesso!')
      } else {
        alert('Erro ao adicionar modelo')
      }
    } catch (error) {
      console.error('Erro ao adicionar modelo:', error)
      alert('Erro ao adicionar modelo')
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

  const getAvailableModels = () => {
    if (!selectedBrand) return []
    
    const brand = brands.find(b => b.id === selectedBrand)
    if (!brand) return []

    // Filtrar modelos que já estão no produto
    const existingModelIds = productModels.map(pm => pm.id)
    return brand.models.filter(model => !existingModelIds.includes(model.id))
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
                            R$ {model.price.toFixed(2)}
                            {model.superWholesalePrice && ` | Atacado: R$ ${model.superWholesalePrice.toFixed(2)}`}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {editingModel === model.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Preço"
                                value={editData[model.id]?.price || ''}
                                onChange={(e) => updateEditData(model.id, 'price', e.target.value)}
                                className="w-20 px-2 py-1 text-sm border rounded"
                              />
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Atacado"
                                value={editData[model.id]?.wholesalePrice || ''}
                                onChange={(e) => updateEditData(model.id, 'wholesalePrice', e.target.value)}
                                className="w-20 px-2 py-1 text-sm border rounded"
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
                <h4 className="text-md font-medium text-gray-900 mb-3">Adicionar Novo Modelo</h4>
                
                {/* Botões para adicionar marca/modelo */}
                <div className="mb-4 flex space-x-2">
                  <button
                    onClick={() => setShowAddBrand(!showAddBrand)}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                  >
                    + Adicionar Marca
                  </button>
                  <button
                    onClick={() => setShowAddModel(!showAddModel)}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                  >
                    + Adicionar Modelo
                  </button>
                </div>

                {/* Form para adicionar marca */}
                {showAddBrand && (
                  <div className="mb-4 p-3 bg-gray-50 rounded border">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="Nome da nova marca"
                        className="flex-1 px-3 py-2 border rounded"
                      />
                      <button
                        onClick={addBrand}
                        disabled={saving || !newBrandName.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Adicionar
                      </button>
                      <button
                        onClick={() => setShowAddBrand(false)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Form para adicionar modelo */}
                {showAddModel && (
                  <div className="mb-4 p-3 bg-gray-50 rounded border">
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedBrandForNewModel}
                        onChange={(e) => setSelectedBrandForNewModel(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded"
                      >
                        <option value="">Selecione uma marca</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="Nome do novo modelo"
                        className="flex-1 px-3 py-2 border rounded"
                      />
                      <button
                        onClick={addModelToBrand}
                        disabled={saving || !newModelName.trim() || !selectedBrandForNewModel}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Adicionar
                      </button>
                      <button
                        onClick={() => setShowAddModel(false)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Form para adicionar modelo existente */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <select
                    value={selectedBrand}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value)
                      setSelectedModel('')
                    }}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="">Selecione uma marca</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedBrand}
                    className="px-3 py-2 border rounded disabled:bg-gray-100"
                  >
                    <option value="">Selecione um modelo</option>
                    {getAvailableModels().map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Preço *"
                    value={newModelPrice}
                    onChange={(e) => setNewModelPrice(e.target.value)}
                    className="px-3 py-2 border rounded"
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Preço atacado"
                    value={newModelWholesalePrice}
                    onChange={(e) => setNewModelWholesalePrice(e.target.value)}
                    className="px-3 py-2 border rounded"
                  />
                </div>

                <button
                  onClick={handleAddModel}
                  disabled={saving || !selectedModel || !newModelPrice}
                  className="mt-3 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Adicionando...' : 'Adicionar Modelo'}
                </button>
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