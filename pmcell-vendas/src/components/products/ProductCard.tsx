'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { useSession } from '@/contexts/SessionContext'
import { formatPrice } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    name: string
    subname?: string
    description?: string
    image?: string
    price: number
    specialPrice?: number
    specialQuantity?: number
    boxQuantity?: number
    hasModels?: boolean
  }
  onSelectModels?: () => void
}

export default function ProductCard({ product, onSelectModels }: ProductCardProps) {
  const { addItem } = useCart()
  const { unlocked } = useSession()
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = () => {
    if (product.hasModels) {
      onSelectModels?.()
      return
    }

    const price = product.specialQuantity && quantity >= product.specialQuantity && product.specialPrice
      ? product.specialPrice
      : product.price

    addItem({
      productId: product.id,
      name: product.name,
      price,
      quantity,
      imageUrl: product.image
    })

    setQuantity(1)
  }

  const currentPrice = product.specialQuantity && quantity >= product.specialQuantity && product.specialPrice
    ? product.specialPrice
    : product.price

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="aspect-square relative bg-gray-50">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {product.boxQuantity && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
            Caixa c/ {product.boxQuantity}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
        {product.subname && (
          <p className="text-sm text-gray-600 mt-1">{product.subname}</p>
        )}

        {unlocked ? (
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-orange-600">
                {formatPrice(currentPrice)}
              </span>
              {product.specialQuantity && (
                <span className="text-xs text-gray-500">
                  un.
                </span>
              )}
            </div>
            
            {product.specialPrice && product.specialQuantity && (
              <p className="text-sm text-green-600 mt-1">
                A partir de {product.specialQuantity} un: {formatPrice(product.specialPrice)}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 hover:bg-gray-50"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border-x border-gray-300 py-1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
                style={{ backgroundColor: '#FC6D36' }}
              >
                {product.hasModels ? 'Escolher Modelo' : 'Adicionar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <button
              className="w-full bg-gray-200 text-gray-600 py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed"
              disabled
            >
              Ver Preços
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

