'use client'

import { useCartStore } from '@/stores/useCartStore'
import { formatPrice } from '@/lib/utils'
import { X, Plus, Minus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export function CartSidebar() {
  const [mounted, setMounted] = useState(false)
  const { 
    items, 
    isOpen, 
    toggleCart, 
    updateQuantity, 
    removeItem, 
    getSubtotal, 
    getItemsCount,
    getSavings 
  } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) return null

  const subtotal = getSubtotal()
  const savings = getSavings()

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-50"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={toggleCart}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Carrinho ({getItemsCount()})</h2>
          <button
            onClick={toggleCart}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Carrinho vazio</h3>
              <p className="text-gray-500 text-sm">Adicione produtos para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const currentPrice = item.specialQuantity && item.quantity >= item.specialQuantity && item.specialPrice
                  ? item.specialPrice
                  : item.unitPrice

                return (
                  <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
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
                            className="w-7 h-7 rounded flex items-center justify-center border hover:bg-gray-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded flex items-center justify-center border hover:bg-gray-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
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
          <div className="border-t p-4 space-y-3">
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
            
            <button
              className="w-full bg-[#FC6D36] text-white py-3 rounded-lg font-medium hover:bg-[#e55a2b] transition-colors"
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
    </>
  )
}