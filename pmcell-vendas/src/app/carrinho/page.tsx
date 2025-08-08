'use client'

import { useState } from 'react'
import Link from 'next/link'
import SuperWholesaleUpgrade from '@/components/cart/SuperWholesaleUpgrade'
import MinimumOrderAlert from '@/components/cart/MinimumOrderAlert'
import { formatPrice } from '@/lib/utils'

// Mock data para demonstração
const mockCartItems = [
  {
    productId: '1',
    name: 'iPhone 15 Pro Max',
    subname: '256GB Titanium Natural',
    image: '/placeholder.jpg',
    quantity: 8,
    unitPrice: 4200,
    superWholesalePrice: 3900,
    superWholesaleQuantity: 10
  },
  {
    productId: '2', 
    name: 'Capinha Transparente',
    subname: 'iPhone 15 Series',
    image: '/placeholder.jpg',
    quantity: 15,
    unitPrice: 25,
    superWholesalePrice: 20,
    superWholesaleQuantity: 20
  },
  {
    productId: '3',
    name: 'Película de Vidro 9H',
    subname: 'iPhone 15 Pro Max',
    image: '/placeholder.jpg',
    quantity: 12,
    unitPrice: 18,
    superWholesalePrice: 15,
    superWholesaleQuantity: 15
  }
]

export default function CarrinhoPage() {
  const [cartItems, setCartItems] = useState(mockCartItems)

  const updateQuantity = (productId: string, newQuantity: number) => {
    setCartItems(items => 
      items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item
      )
    )
  }

  const removeItem = (productId: string) => {
    setCartItems(items => items.filter(item => item.productId !== productId))
  }

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = cartItems.reduce((sum, item) => {
    const price = item.superWholesaleQuantity && item.quantity >= item.superWholesaleQuantity && item.superWholesalePrice
      ? item.superWholesalePrice 
      : item.unitPrice
    return sum + (price * item.quantity)
  }, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                PMCELL São Paulo
              </Link>
              <p className="text-xs text-gray-500 font-medium ml-2">Atacado para Lojistas</p>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Carrinho de Compras</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-gray-200 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🛒 Seu Carrinho</h1>
              <p className="text-gray-600">{totalQuantity} itens selecionados</p>
            </div>

            {/* Minimum Order Alert */}
            <MinimumOrderAlert />

            {/* Super Wholesale Upgrade */}
            <SuperWholesaleUpgrade cartItems={cartItems} />

            {/* Cart Items List */}
            <div className="space-y-4">
              {cartItems.map((item) => {
                const isWholesaleActive = item.superWholesaleQuantity && 
                  item.quantity >= item.superWholesaleQuantity && 
                  item.superWholesalePrice
                
                const currentPrice = isWholesaleActive ? item.superWholesalePrice : item.unitPrice

                return (
                  <div key={item.productId} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                        📱
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                        {item.subname && (
                          <p className="text-gray-600 text-sm font-medium">{item.subname}</p>
                        )}
                        
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex items-center bg-gray-50 rounded-lg border">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="px-3 py-2 hover:bg-gray-100 font-bold text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                              className="w-16 text-center py-2 bg-white border-x font-semibold"
                            />
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="px-3 py-2 hover:bg-gray-100 font-bold text-gray-600"
                            >
                              +
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-red-600 hover:text-red-700 font-semibold text-sm"
                          >
                            🗑️ Remover
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(currentPrice)}
                        </div>
                        <div className="text-sm text-gray-500">por unidade</div>
                        
                        {isWholesaleActive && (
                          <div className="mt-1">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                              💰 Super Atacado Ativo!
                            </span>
                          </div>
                        )}
                        
                        <div className="mt-2 text-lg font-semibold text-orange-600">
                          Total: {formatPrice(currentPrice * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-96">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Resumo do Pedido</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de itens:</span>
                    <span className="font-semibold">{totalQuantity} unidades</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Valor Total:</span>
                    <span className="text-orange-600">{formatPrice(totalValue)}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Economia com Super Atacado:</span>
                      <span className="font-semibold">
                        {formatPrice(cartItems.reduce((savings, item) => {
                          if (item.superWholesaleQuantity && item.quantity >= item.superWholesaleQuantity && item.superWholesalePrice) {
                            return savings + ((item.unitPrice - item.superWholesalePrice) * item.quantity)
                          }
                          return savings
                        }, 0))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl"
                    disabled={totalQuantity < 30}
                  >
                    {totalQuantity >= 30 ? '🎯 Finalizar Pedido' : `⚠️ Faltam ${30 - totalQuantity} itens`}
                  </button>
                  
                  <Link 
                    href="/"
                    className="block w-full text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    ← Continuar Comprando
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">🚚 Informações de Entrega</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>📍 Grande São Paulo: Entrega grátis</div>
                    <div>⏰ Prazo: 24-48h úteis</div>
                    <div>📞 Acompanhe pelo WhatsApp</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}