'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore } from '@/stores/useCartStore'
import { formatPrice } from '@/lib/utils'
import { debounce } from '@/utils/debounce'

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
    priceRange?: {
      min: number
      max: number
      superWholesaleMin?: number
      superWholesaleMax?: number
    }
    isModalProduct?: boolean
  }
  isOpen: boolean
  onClose: () => void
}

export default function ProductVariationModal({ product, isOpen, onClose }: ProductVariationModalProps) {
  const [models, setModels] = useState<ProductModel[]>([])
  const [groupedModels, setGroupedModels] = useState<Record<string, ProductModel[]>>({})
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  // Estado local para valores temporários dos inputs
  const [tempInputValues, setTempInputValues] = useState<Record<string, string>>({})
  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const cartItems = useCartStore((state) => state.items)

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    // Limpar valores temporários ao fechar
    setTempInputValues({})
    setTimeout(() => {
      onClose()
      setIsAnimating(false)
    }, 200)
  }, [onClose, isAnimating])

  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }, [handleClose])

  // Focus trap for accessibility
  const handleTabKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keydown', handleTabKeyPress)
      document.body.style.overflow = 'hidden'
      
      // Focus first interactive element
      setTimeout(() => {
        const firstButton = modalRef.current?.querySelector('button')
        firstButton?.focus()
      }, 100)
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleTabKeyPress)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown, handleTabKeyPress])

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
        
        // Agrupar por marca e ordenar
        const grouped = data.reduce((acc: Record<string, ProductModel[]>, model: ProductModel) => {
          if (!acc[model.brandName]) {
            acc[model.brandName] = []
          }
          acc[model.brandName].push(model)
          return acc
        }, {})
        
        // Ordenar modelos dentro de cada marca
        Object.keys(grouped).forEach(brandName => {
          grouped[brandName].sort((a: any, b: any) => a.modelName.localeCompare(b.modelName))
        })
        
        setGroupedModels(grouped)
        
        // Iniciar com todas as marcas fechadas - usuário clica para expandir
        const expandedState: Record<string, boolean> = {}
        Object.keys(grouped).forEach(brandName => {
          expandedState[brandName] = false
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
    // Limpar valor temporário se existir
    setTempInputValues(prev => {
      const newValues = { ...prev }
      delete newValues[modelId]
      return newValues
    })

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
        superWholesalePrice: model.superWholesalePrice,
        superWholesaleQuantity: product.quickAddIncrement,
        modelId: model.id,
        modelName: `${model.brandName} ${model.modelName}`
      })
    }
  }

  const decrementQuantity = (modelId: string, amount: number = 1) => {
    // Limpar valor temporário se existir
    setTempInputValues(prev => {
      const newValues = { ...prev }
      delete newValues[modelId]
      return newValues
    })

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
        superWholesalePrice: model.superWholesalePrice,
        superWholesaleQuantity: product.quickAddIncrement,
        modelId: model.id,
        modelName: `${model.brandName} ${model.modelName}`
      })
    }
  }

  // Função debounced para atualizar carrinho após digitação
  const debouncedSetQuantity = useCallback(
    debounce((modelId: string, newQuantity: number) => {
      setQuantityDirectly(modelId, newQuantity)
    }, 500), // 500ms de delay após parar de digitar
    [models, product]
  )

  // Função para lidar com mudanças no input
  const handleInputChange = (modelId: string, value: string) => {
    // Atualizar valor temporário no estado local
    setTempInputValues(prev => ({
      ...prev,
      [modelId]: value
    }))

    // Aplicar debounce na atualização do carrinho
    const numValue = parseInt(value) || 0
    debouncedSetQuantity(modelId, numValue)
  }

  // Função para lidar com blur (quando o campo perde o foco)
  const handleInputBlur = (modelId: string) => {
    const tempValue = tempInputValues[modelId]
    if (tempValue !== undefined) {
      const numValue = parseInt(tempValue) || 0
      setQuantityDirectly(modelId, numValue)
      // Limpar o valor temporário após aplicar
      setTempInputValues(prev => {
        const newValues = { ...prev }
        delete newValues[modelId]
        return newValues
      })
    }
  }

  // Função para obter o valor a ser exibido no input
  const getDisplayValue = (modelId: string): string => {
    // Se existe valor temporário sendo digitado, usar ele
    if (tempInputValues[modelId] !== undefined) {
      return tempInputValues[modelId]
    }
    // Caso contrário, usar valor do carrinho
    return getCartQuantityByModel(modelId).toString()
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
      const priceToUse = useSuperPrice ? (model.superWholesalePrice || model.price) : model.price
      
      return total + (priceToUse * cartQty)
    }, 0)
  }

  if (!isOpen) return null

  return (
    <div 
      ref={overlayRef}
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-out ${
        isAnimating ? 'opacity-0' : 'opacity-100 animate-fade-in'
      }`}
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out ${
          isAnimating 
            ? 'scale-95 opacity-0 translate-y-4' 
            : 'scale-100 opacity-100 translate-y-0 animate-scale-in'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Header */}
        <div className="p-3 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <div className="flex-1">
            <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{product.name}</h2>
            {product.description && (
              <p className="text-xs sm:text-sm text-gray-600 opacity-80">{product.description}</p>
            )}
          </div>
          
          {/* Resumo do total no header */}
          <div className="flex items-center gap-6">
            {models.length > 0 && (
              <div className="text-right transform transition-all duration-300 ease-out animate-slide-up">
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  Total: {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''}
                </p>
                <p className="text-lg sm:text-xl font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-lg">
                  {formatPrice(getTotalValue())}
                </p>
              </div>
            )}
            
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Fechar modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        
        {/* Scrollable Content with Sticky Headers */}
        <div className="overflow-y-auto max-h-[calc(85vh-150px)] sm:max-h-[calc(90vh-200px)] custom-scrollbar modal-content-scroll relative">
            
          {loading ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 shadow-lg"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-blue-600 opacity-10 animate-pulse"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Carregando modelos...</p>
              <div className="mt-2 flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-6 pt-2 space-y-3 sm:space-y-6 animate-slide-up">
              {Object.entries(groupedModels)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([brandName, brandModels], index) => (
                <div 
                  key={brandName} 
                  className="border-b border-gray-200 last:border-b-0 sm:border sm:rounded-xl sm:shadow-sm sm:hover:shadow-md transition-all duration-300 ease-out sm:transform sm:hover:-translate-y-1"
                  style={{animationDelay: `${index * 100}ms`}}
                >
                  {/* Brand Header - Sticky */}
                  <button
                    onClick={() => toggleBrandExpansion(brandName)}
                    className={`brand-header w-full px-3 sm:px-6 py-3 sm:py-5 transition-all duration-300 ease-out flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset sticky top-0 z-30 ${
                      expandedBrands[brandName] ? 'expanded' : 'collapsed'
                    }`}
                    style={{
                      backgroundColor: expandedBrands[brandName] 
                        ? 'rgba(219, 234, 254, 0.98)' 
                        : 'rgba(248, 250, 252, 0.98)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      boxShadow: expandedBrands[brandName]
                        ? '0 4px 12px rgba(59, 130, 246, 0.15)'
                        : '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div className="flex items-center">
                      {(() => {
                        const totalQuantity = getTotalQuantityByBrand(brandName)
                        return (
                          <>
                            {totalQuantity > 0 && (
                              <div className="hidden sm:flex mr-3 px-3 py-0.5 bg-blue-500 text-white rounded-full font-medium text-sm items-center justify-center shadow-sm" style={{minHeight: '24px', lineHeight: '1', textAlign: 'center'}}>
                                {totalQuantity} un.
                              </div>
                            )}
                            <span className="text-base sm:text-lg font-semibold text-gray-900">{brandName}</span>
                            <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-500">
                              ({brandModels.length} modelo{brandModels.length !== 1 ? 's' : ''})
                            </span>
                          </>
                        )
                      })()}
                    </div>
                    <svg
                      className={`w-5 h-5 transform transition-all duration-300 ease-out ${
                        expandedBrands[brandName] ? 'rotate-180 text-blue-600' : 'text-gray-400'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Models List */}
                  <div className={`transition-all duration-400 ease-out overflow-hidden ${
                    expandedBrands[brandName] 
                      ? 'max-h-[2000px] opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}>
                    <div className={`transform transition-all duration-300 ease-out ${
                      expandedBrands[brandName] 
                        ? 'translate-y-0 opacity-100' 
                        : '-translate-y-2 opacity-0'
                    }`}>
                      {/* Models container com padding interno para criar recuo */}
                      <div className="models-container models-background relative z-10">
                        {brandModels.map((model, modelIndex) => {
                          const currentQuantity = getCartQuantityByModel(model.id)
                          return (
                            <div 
                              key={model.id} 
                              className="model-item relative z-10"
                              style={{animationDelay: `${modelIndex * 50}ms`}}
                            >
                            {/* Badge verde mobile - canto superior direito */}
                            {(() => {
                              const cartQuantity = getCartQuantityByModel(model.id)
                              if (cartQuantity > 0) {
                                return (
                                  <div 
                                    className="sm:hidden absolute top-1 right-1 z-20 px-1.5 py-0.5 bg-green-500 text-white rounded-full font-medium text-[10px] flex items-center justify-center shadow-sm"
                                    style={{
                                      minWidth: cartQuantity >= 100000 ? '3.5rem' : 
                                               cartQuantity >= 10000 ? '3rem' : 
                                               cartQuantity >= 1000 ? '2.5rem' : 
                                               cartQuantity >= 100 ? '2rem' : 
                                               cartQuantity >= 10 ? '1.75rem' : '1.25rem',
                                      whiteSpace: 'nowrap',
                                      transition: 'all 0.2s ease-in-out',
                                      minHeight: '18px',
                                      lineHeight: '1',
                                      textAlign: 'center'
                                    }}
                                    title={`${cartQuantity} unidades no carrinho`}
                                  >
                                    {cartQuantity.toLocaleString()}
                                  </div>
                                )
                              }
                              return null
                            })()}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                  <h4 className="text-sm sm:text-base font-medium text-gray-900">{model.modelName}</h4>
                                  {/* Badge verde desktop - ao lado do nome */}
                                  {(() => {
                                    const cartQuantity = getCartQuantityByModel(model.id)
                                    if (cartQuantity > 0) {
                                      return (
                                        <div 
                                          className="hidden sm:flex px-2 py-0.5 bg-green-500 text-white rounded-full font-medium text-xs items-center justify-center shadow-sm"
                                          style={{
                                            minWidth: cartQuantity >= 100000 ? '4rem' : 
                                                     cartQuantity >= 10000 ? '3.5rem' : 
                                                     cartQuantity >= 1000 ? '3rem' : 
                                                     cartQuantity >= 100 ? '2.5rem' : 
                                                     cartQuantity >= 10 ? '2rem' : '1.5rem',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s ease-in-out',
                                            minHeight: '20px',
                                            lineHeight: '1',
                                            textAlign: 'center'
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
                                <div className="flex flex-col items-start gap-0.5 sm:gap-1">
                                  {(() => {
                                    // Sempre usar o preço individual do modelo, independente se é modalProduct
                                    const cartQuantity = getCartQuantityByModel(model.id)
                                    const increment = product.quickAddIncrement || 1
                                    const hasReachedSuperWholesale = model.superWholesalePrice && cartQuantity >= increment
                                    const currentPrice = hasReachedSuperWholesale ? (model.superWholesalePrice || 0) : (model.price || 0)
                                    
                                    return (
                                      <div className="flex items-baseline gap-1 sm:gap-2">
                                        <span 
                                          key={`${model.id}-${hasReachedSuperWholesale}`}
                                          className="text-sm sm:text-lg font-bold text-gray-900 transition-all duration-500 ease-in-out animate-price-change"
                                          style={{
                                            animation: 'fadeInPrice 0.5s ease-in-out'
                                          }}
                                        >
                                          {formatPrice(currentPrice)}
                                        </span>
                                        <span className="text-[10px] sm:text-xs text-gray-500">
                                          unidade
                                        </span>
                                      </div>
                                    )
                                  })()}
                                  {/* Super wholesale info para todos os modelos que tenham essa informação */}
                                  {model.superWholesalePrice && (
                                    <div className="text-[10px] sm:text-xs text-green-600 font-medium bg-green-50 px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap inline-flex items-center" style={{minHeight: '16px', lineHeight: '1'}}>
                                      +{product.quickAddIncrement || 1} un.: {formatPrice(model.superWholesalePrice || 0)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Quantity Controls alinhados à direita */}
                              <div className="flex items-center rounded-lg overflow-hidden ml-1 sm:ml-4 shadow-sm border border-gray-200 bg-white">
                                <button
                                  onClick={() => decrementQuantity(model.id, 1)}
                                  disabled={currentQuantity === 0}
                                  className="px-1.5 sm:px-3 py-1 sm:py-2 hover:bg-red-50 hover:text-red-600 text-gray-500 font-bold transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-300 active:scale-95 text-sm sm:text-base"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  value={getDisplayValue(model.id)}
                                  onChange={(e) => handleInputChange(model.id, e.target.value)}
                                  onBlur={() => handleInputBlur(model.id)}
                                  className="w-10 sm:w-16 text-center py-1 sm:py-2 text-xs sm:text-sm font-semibold border-x border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                                  min="0"
                                  aria-label={`Quantidade para ${model.modelName}`}
                                />
                                <button
                                  onClick={() => incrementQuantity(model.id, 1)}
                                  className="px-1.5 sm:px-3 py-1 sm:py-2 hover:bg-green-50 hover:text-green-600 text-gray-500 font-bold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-green-300 active:scale-95 text-sm sm:text-base"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}