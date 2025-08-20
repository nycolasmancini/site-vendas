'use client'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'
import { useCartStore, type CartItem } from '@/stores/useCartStore'
import { X, Plus, TrendingUp } from 'lucide-react'

interface EconomizerModalProps {
  isOpen: boolean
  onClose: () => void
  eligibleItems: CartItem[]
}

export function EconomizerModal({ isOpen, onClose, eligibleItems }: EconomizerModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  useEffect(() => {
    if (isOpen && eligibleItems.length > 0) {
      setShouldRender(true)
      // Pequeno delay para garantir que o elemento foi renderizado antes da animação
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
      // Remove da DOM após a animação terminar
      setTimeout(() => setShouldRender(false), 300)
    }
  }, [isOpen, eligibleItems.length])

  if (!shouldRender) return null

  const quickAddQuantity = (itemId: string, additionalQuantity: number) => {
    const item = eligibleItems.find(i => i.id === itemId)
    if (item) {
      updateQuantity(itemId, item.quantity + additionalQuantity)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-[60] transition-all duration-300 ease-out ${
          isVisible 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div 
          className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 ease-out transform ${
            isVisible 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-800">Economize levando mais!</h2>
                <p className="text-sm text-green-600">Complete alguns itens e ganhe desconto especial</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {eligibleItems.map((item) => {
              // Determinar se é preço especial ou super atacado
              const hasSpecialPrice = item.specialPrice && item.specialQuantity
              const hasSuperWholesale = item.superWholesalePrice && item.superWholesaleQuantity
              
              // Usar os valores corretos baseado no tipo de desconto
              const neededQuantity = hasSpecialPrice ? item.specialQuantity! : item.superWholesaleQuantity!
              const discountPrice = hasSpecialPrice ? item.specialPrice! : item.superWholesalePrice!
              const discountType = hasSpecialPrice ? 'Preço Especial' : 'Super Atacado'
              
              const currentQuantity = item.quantity
              const missingQuantity = neededQuantity - currentQuantity
              const percentageComplete = (currentQuantity / neededQuantity) * 100
              
              // Calcula a economia real que o cliente terá
              const regularTotalPrice = neededQuantity * item.unitPrice // Preço se comprasse tudo no preço normal
              const discountTotal = neededQuantity * discountPrice // Preço com desconto
              const totalSavings = regularTotalPrice - discountTotal // Economia total
              const savingsPerUnit = item.unitPrice - discountPrice // Economia por unidade

              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                  {/* Product Info */}
                  <div className="flex items-start gap-3 mb-4">
                    {/* Product Image */}
                    <div className="w-10 h-10 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                      {item.subname && (
                        <p className="text-sm text-gray-600 mt-1">{item.subname}</p>
                      )}
                      {item.modelName && (
                        <p className="text-sm text-blue-600 mt-1">{item.modelName}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-green-600">
                        {Math.round(percentageComplete)}%
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        faltam <span className="font-bold text-orange-600">{missingQuantity}</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${percentageComplete}%` }}
                      />
                    </div>
                  </div>

                  {/* Price Comparison */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">PREÇO ATUAL</p>
                      <p className="text-lg font-bold text-gray-700">{formatPrice(item.unitPrice)} <span className="text-sm font-normal text-gray-500">/un.</span></p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-sm">
                      <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">SUPER ATACADO</p>
                      <p className="text-lg font-bold text-orange-600">{formatPrice(discountPrice)} <span className="text-sm font-normal text-orange-400">/un.</span></p>
                    </div>
                  </div>

                  {/* Savings Info */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="text-center mb-2">
                      <p className="font-bold text-green-800 text-lg">Você vai economizar:</p>
                    </div>
                    <div className="text-center mb-3">
                      <p className="text-3xl font-black text-green-600 mb-1">
                        {formatPrice(totalSavings)}
                      </p>
                      <p className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full inline-block">
                        {formatPrice(savingsPerUnit)} por unidade × {neededQuantity} unidades
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-green-600 font-medium">
                        Complete agora e pague apenas {formatPrice(discountTotal)} ao invés de {formatPrice(regularTotalPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => quickAddQuantity(item.id, missingQuantity)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105"
                    >
                      Adicionar {missingQuantity} para ganhar desconto
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-sm font-medium text-gray-600">
              ⚡ Complete agora e economize ainda mais no seu pedido!
            </p>
          </div>
        </div>
      </div>
    </>
  )
}