'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/stores/useCartStore'
import { formatPrice } from '@/lib/utils'

interface ProductModel {
  id: string
  brandName: string
  modelName: string
  price: number
  superWholesalePrice?: number
  specialQuantity?: number
}

interface SelectedModel {
  modelId: string
  brandName: string
  modelName: string
  price: number
  superWholesalePrice?: number
  quantity: number
}

interface ProductVariationModalProps {
  product: {
    id: string
    name: string
    description?: string
    image?: string
    images?: Array<{ id: string; url: string; isMain: boolean }>
    quickAddIncrement?: number
  }
  isOpen: boolean
  onClose: () => void
}

export default function ProductVariationModal({ product, isOpen, onClose }: ProductVariationModalProps) {
  const [models, setModels] = useState<ProductModel[]>([])
  const [groupedModels, setGroupedModels] = useState<Record<string, ProductModel[]>>({})
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const cartItems = useCartStore((state) => state.items)

  // Função para obter quantidade no carrinho por modelId
  const getCartQuantityByModel = (modelId: string): number => {
    const cartItem = cartItems.find(item => 
      item.productId === product.id && item.modelId === modelId
    )
    return cartItem ? cartItem.quantity : 0
  }

  // Função para obter o item do carrinho por modelId
  const getCartItemByModel = (modelId: string) => {
    return cartItems.find(item => 
      item.productId === product.id && item.modelId === modelId
    )
  }

  // Função para calcular total de produtos por marca no carrinho
  const getTotalQuantityByBrand = (brandName: string): number => {
    const brandModels = groupedModels[brandName] || []
    return brandModels.reduce((total, model) => {
      const cartQty = getCartQuantityByModel(model.id)
      return total + cartQty
    }, 0)
  }


  useEffect(() => {
    if (isOpen) {
      fetchProductModels()
    }
  }, [isOpen, product.id])

  const fetchProductModels = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${product.id}/models`)
      if (response.ok) {
        const data = await response.json()
        setModels(data)
        
        // Agrupar por marca
        const grouped = data.reduce((acc: Record<string, ProductModel[]>, model: ProductModel) => {
          if (!acc[model.brandName]) {
            acc[model.brandName] = []
          }
          acc[model.brandName].push(model)
          return acc
        }, {})
        
        setGroupedModels(grouped)
        
        // Expandir todas as marcas por padrão para melhor UX
        const expandedState: Record<string, boolean> = {}
        Object.keys(grouped).forEach(brandName => {
          expandedState[brandName] = true
        })
        setExpandedBrands(expandedState)
      }
    } catch (error) {
      console.error('Erro ao buscar modelos:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleBrandExpansion = (brandName: string) => {
    setExpandedBrands(prev => ({
      ...prev,
      [brandName]: !prev[brandName]
    }))
  }

  const incrementQuantity = (modelId: string, amount: number = 1) => {
    const model = models.find(m => m.id === modelId)
    if (!model) return

    const existingItem = getCartItemByModel(modelId)
    const imageUrl = product.images?.find(img => img.isMain)?.url || product.images?.[0]?.url || product.image

    if (existingItem) {
      // Se já existe no carrinho, atualiza a quantidade
      updateQuantity(existingItem.id, existingItem.quantity + amount)
    } else {
      // Se não existe, adiciona novo item
      addItem({
        productId: product.id,
        name: `${product.name}`,
        subname: `${model.brandName} ${model.modelName}`,
        image: imageUrl,
        quantity: amount,
        unitPrice: model.price,
        specialPrice: model.superWholesalePrice,
        specialQuantity: product.quickAddIncrement,
        modelId: model.id,
        modelName: `${model.brandName} ${model.modelName}`
      })
    }
  }

  const decrementQuantity = (modelId: string, amount: number = 1) => {
    const existingItem = getCartItemByModel(modelId)
    if (!existingItem) return

    const newQuantity = Math.max(0, existingItem.quantity - amount)
    updateQuantity(existingItem.id, newQuantity)
  }

  const setQuantityDirectly = (modelId: string, newQuantity: number) => {
    const model = models.find(m => m.id === modelId)
    if (!model) return

    const existingItem = getCartItemByModel(modelId)
    const imageUrl = product.images?.find(img => img.isMain)?.url || product.images?.[0]?.url || product.image

    if (newQuantity === 0) {
      // Remove do carrinho se quantidade for 0
      if (existingItem) {
        updateQuantity(existingItem.id, 0)
      }
    } else if (existingItem) {
      // Atualiza quantidade existente
      updateQuantity(existingItem.id, newQuantity)
    } else {
      // Adiciona novo item
      addItem({
        productId: product.id,
        name: `${product.name}`,
        subname: `${model.brandName} ${model.modelName}`,
        image: imageUrl,
        quantity: newQuantity,
        unitPrice: model.price,
        specialPrice: model.superWholesalePrice,
        specialQuantity: product.quickAddIncrement,
        modelId: model.id,
        modelName: `${model.brandName} ${model.modelName}`
      })
    }
  }



  const getTotalItems = () => {
    return models.reduce((total, model) => {
      const cartQty = getCartQuantityByModel(model.id)
      return total + cartQty
    }, 0)
  }

  const getTotalValue = () => {
    return models.reduce((total, model) => {
      const cartQty = getCartQuantityByModel(model.id)
      if (cartQty === 0) return total
      
      // Calcular preço baseado na quantidade específica deste modelo
      const increment = product.quickAddIncrement || 1
      const useSuperPrice = model.superWholesalePrice && cartQty >= increment
      const priceToUse = useSuperPrice ? model.superWholesalePrice : model.price
      
      return total + (priceToUse * cartQty)
    }, 0)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            {product.description && (
              <p className="text-sm text-gray-600 mt-1">{product.description}</p>
            )}
          </div>
          
          {/* Resumo do total no header */}
          <div className="flex items-center gap-4">
            {models.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Total: {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''}
                </p>
                <p className="text-lg font-bold text-blue-600">
                  {formatPrice(getTotalValue())}
                </p>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          <h3 className="text-lg font-semibold mb-6">Selecione os modelos e quantidades:</h3>
            
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando modelos...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedModels).map(([brandName, brandModels]) => (
                <div key={brandName} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Brand Header */}
                  <button
                    onClick={() => toggleBrandExpansion(brandName)}
                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                  >
                    <div className="flex items-center">
                      {(() => {
                        const totalQuantity = getTotalQuantityByBrand(brandName)
                        return (
                          <>
                            {totalQuantity > 0 && (
                              <div className="mr-3 px-3 py-1 bg-blue-500 text-white rounded-full font-medium text-sm flex items-center justify-center shadow-sm">
                                {totalQuantity} un.
                              </div>
                            )}
                            <span className="text-lg font-semibold text-gray-900">{brandName}</span>
                            <span className="ml-3 text-sm text-gray-500">
                              ({brandModels.length} modelo{brandModels.length !== 1 ? 's' : ''})
                            </span>
                          </>
                        )
                      })()}
                    </div>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${
                        expandedBrands[brandName] ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Models List */}
                  {expandedBrands[brandName] && (
                    <div className="divide-y divide-gray-200">
                      {brandModels.map((model) => {
                        const currentQuantity = getCartQuantityByModel(model.id)
                        return (
                          <div key={model.id} className="p-4 bg-white">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-base font-medium text-gray-900">{model.modelName}</h4>
                                  {/* Badge verde com quantidade no carrinho */}
                                  {(() => {
                                    const cartQuantity = getCartQuantityByModel(model.id)
                                    if (cartQuantity > 0) {
                                      return (
                                        <div 
                                          className="px-2 py-1 bg-green-500 text-white rounded-full font-medium text-xs flex items-center justify-center shadow-sm"
                                          style={{
                                            minWidth: cartQuantity >= 100000 ? '4rem' : 
                                                     cartQuantity >= 10000 ? '3.5rem' : 
                                                     cartQuantity >= 1000 ? '3rem' : 
                                                     cartQuantity >= 100 ? '2.5rem' : 
                                                     cartQuantity >= 10 ? '2rem' : '1.5rem',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s ease-in-out'
                                          }}
                                          title={`${cartQuantity} unidades no carrinho`}
                                        >
                                          {cartQuantity.toLocaleString()} un.
                                        </div>
                                      )
                                    }
                                    return null
                                  })()}
                                </div>
                                <div className="flex items-center">
                                  <span className="text-lg font-bold text-gray-900">
                                    {formatPrice(model.price)}
                                  </span>
                                  {model.superWholesalePrice && (
                                    <span className="ml-3 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                      +{product.quickAddIncrement || 1} un.: {formatPrice(model.superWholesalePrice)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Quantity Controls alinhados à direita */}
                              <div className="flex items-center rounded-lg overflow-hidden ml-4" style={{ border: '1px solid var(--border)' }}>
                                <button
                                  onClick={() => decrementQuantity(model.id, 1)}
                                  disabled={currentQuantity === 0}
                                  className="interactive px-2 py-1 hover:bg-accent text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{ color: 'var(--muted-foreground)' }}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={currentQuantity}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0
                                    setQuantityDirectly(model.id, value)
                                  }}
                                  className="w-10 text-center py-1 text-sm font-medium border-x"
                                  style={{ 
                                    background: 'var(--surface)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--foreground)'
                                  }}
                                />
                                <button
                                  onClick={() => incrementQuantity(model.id, 1)}
                                  className="interactive px-2 py-1 hover:bg-accent text-sm font-medium"
                                  style={{ color: 'var(--muted-foreground)' }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}