'use client'

import { useCartStore } from '@/stores/useCartStore'
import { formatPrice } from '@/lib/utils'
import { X, Plus, Minus, Trash2, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { EconomizerModal } from './EconomizerModal'

export function CartSidebar() {
  const [mounted, setMounted] = useState(false)
  const [showEconomizerModal, setShowEconomizerModal] = useState(false)
  const [previousUpgradesLength, setPreviousUpgradesLength] = useState(-1) // Start with -1 to detect initial state
  const [buttonState, setButtonState] = useState<'hidden' | 'entering' | 'visible' | 'exiting'>('hidden')
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())
  const { 
    items, 
    isOpen, 
    toggleCart, 
    updateQuantity, 
    removeItem, 
    getSubtotal, 
    getItemsCount,
    getSavings,
    getEligibleUpgrades
  } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const subtotal = getSubtotal()
  const savings = getSavings()
  const eligibleUpgrades = getEligibleUpgrades()

  // Simple calculation without complex memoization
  const upgradesLength = eligibleUpgrades.length

  // Smooth button state management with animations
  useEffect(() => {
    if (!mounted) return

    if (upgradesLength > 0 && buttonState === 'hidden') {
      setButtonState('entering')
      setTimeout(() => setButtonState('visible'), 800)
    } else if (upgradesLength === 0 && (buttonState === 'visible' || buttonState === 'entering')) {
      setButtonState('exiting')
      setTimeout(() => setButtonState('hidden'), 600)
    }
  }, [upgradesLength, mounted, buttonState])

  // Handle animated item removal
  const handleRemoveItem = useCallback((itemId: string) => {
    // Add item to removing set
    setRemovingItems(prev => new Set([...prev, itemId]))
    
    // After animation completes, actually remove the item
    setTimeout(() => {
      removeItem(itemId)
      setRemovingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }, 500) // Match animation duration
  }, [removeItem])

  // Simple button styling
  const getButtonClasses = () => {
    const baseClasses = "w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] mb-2 relative overflow-hidden"
    
    if (buttonState === 'entering') return `${baseClasses} economize-button-enter economize-button-shimmer`
    if (buttonState === 'visible') return `${baseClasses} economize-button-glow economize-button-shimmer`
    if (buttonState === 'exiting') return `${baseClasses} economize-button-exit`
    
    return baseClasses
  }

  if (!mounted) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${
          isOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={toggleCart}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl flex flex-col
          transition-all duration-300 ease-out transform ${
            isOpen 
              ? 'translate-x-0 opacity-100' 
              : 'translate-x-full opacity-0'
          }`}
        style={{
          boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1), -10px 0 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b backdrop-blur-sm">
          <h2 className="text-lg font-semibold transition-all duration-200">
            Carrinho ({getItemsCount()})
          </h2>
          <button
            onClick={toggleCart}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="text-center py-8 animate-in fade-in duration-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Carrinho vazio</h3>
              <p className="text-gray-500 text-sm">Adicione produtos para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const currentPrice = item.specialQuantity && item.quantity >= item.specialQuantity && item.specialPrice
                  ? item.specialPrice
                  : item.unitPrice

                const isRemoving = removingItems.has(item.id)
                
                return (
                  <div 
                    key={item.id} 
                    className={`flex gap-4 bg-gray-50 rounded-lg transition-all duration-300 ${
                      isRemoving 
                        ? 'cart-item-removing px-3' 
                        : 'p-3 hover:bg-gray-100 hover:shadow-md transform hover:scale-[1.02] animate-in slide-in-from-right duration-300'
                    }`}
                    style={{
                      animationDelay: isRemoving ? '0ms' : `${index * 50}ms`
                    }}
                  >
                    {/* Image */}
                    <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                      {item.subname && (
                        <p className="text-xs text-gray-500 mt-1">{item.subname}</p>
                      )}
                      {item.modelName && (
                        <p className="text-xs text-blue-600 mt-1">{item.modelName}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={isRemoving}
                            className={`w-7 h-7 rounded flex items-center justify-center border transition-all duration-200 ${
                              isRemoving 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-gray-100 hover:scale-110 active:scale-95'
                            }`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className={`w-8 text-center text-sm font-medium transition-all duration-200 ${
                            isRemoving ? 'opacity-50' : ''
                          }`}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isRemoving}
                            className={`w-7 h-7 rounded flex items-center justify-center border transition-all duration-200 ${
                              isRemoving 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-gray-100 hover:scale-110 active:scale-95'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isRemoving}
                          className={`p-1 rounded transition-all duration-200 ${
                            isRemoving 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-red-500 hover:bg-red-50 hover:scale-110 active:scale-95'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm">
                          <span className="font-semibold">{formatPrice(currentPrice)}</span>
                          <span className="text-gray-500 ml-1">cada</span>
                        </div>
                        <div className="text-sm font-semibold text-right">
                          {formatPrice(currentPrice * item.quantity)}
                        </div>
                      </div>

                      {item.specialQuantity && item.quantity >= item.specialQuantity && item.specialPrice && (
                        <div className="mt-1 text-xs text-green-600 font-medium">
                          Desconto de atacado aplicado!
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3 bg-white/80 backdrop-blur-sm animate-in slide-in-from-bottom duration-300">
            {savings > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-medium">Economia:</span>
                <span className="text-green-600 font-semibold">{formatPrice(savings)}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between font-semibold">
              <span>Total:</span>
              <span className="text-lg">{formatPrice(subtotal)}</span>
            </div>
            

            {/* Botão Economize levando mais com animação suave */}
            {(buttonState === 'entering' || buttonState === 'visible' || buttonState === 'exiting') && (
              <button
                onClick={() => setShowEconomizerModal(true)}
                className={getButtonClasses()}
                disabled={buttonState === 'exiting'}
              >
                <div className="flex items-center justify-center gap-2 relative z-10">
                  <TrendingUp className={`w-5 h-5 transition-all duration-300 ${
                    buttonState === 'entering' ? 'animate-bounce' : 
                    buttonState === 'visible' ? 'animate-pulse' : ''
                  }`} />
                  <span className="font-bold">Economize levando mais!</span>
                  <span className="bg-green-700 bg-opacity-80 px-2 py-1 rounded-full text-xs text-green-50">
                    em {upgradesLength} {upgradesLength === 1 ? 'produto' : 'produtos'}
                  </span>
                </div>

                {/* Particle effects para entrada */}
                {buttonState === 'entering' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full opacity-80"
                        style={{
                          left: `${20 + (i * 12)}%`,
                          top: '50%',
                          animation: `sparkleEffect 0.8s ease-out ${i * 0.1}s forwards`
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )}
            
            <button
              className="w-full bg-[#FC6D36] text-white py-3 rounded-lg font-medium hover:bg-[#e55a2b] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              onClick={() => {
                // TODO: Navigate to checkout
                console.log('Navigate to checkout')
              }}
            >
              Finalizar Pedido
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              Pedido mínimo: 30 peças
            </p>
          </div>
        )}
      </div>
      
      {/* Modal */}
      <EconomizerModal
        isOpen={showEconomizerModal}
        onClose={() => setShowEconomizerModal(false)}
        eligibleItems={eligibleUpgrades}
      />
    </>
  )
}