'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCartStore } from '@/stores/useCartStore'
import { useSession } from '@/contexts/SessionContext'
import { formatPrice } from '@/lib/utils'
import { CaseIcon, ScreenProtectorIcon, ChargerIcon } from '@/components/ui/Icons'

interface ProductCardProps {
  product: {
    id: string
    name: string
    subname?: string
    description?: string
    image?: string
    images?: Array<{ id: string; url: string; isMain: boolean }>
    price: number
    superWholesalePrice?: number
    superWholesaleQuantity?: number
    specialPrice?: number
    specialQuantity?: number
    boxQuantity?: number
    hasModels?: boolean
  }
  onSelectModels?: () => void
}

export default function ProductCard({ product, onSelectModels }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const { unlocked } = useSession()
  const [quantity, setQuantity] = useState(1)
  const [showComboSuggestions, setShowComboSuggestions] = useState(false)

  const handleAddToCart = () => {
    if (product.hasModels) {
      onSelectModels?.()
      return
    }

    const unitPrice = product.price
    const specialPrice = product.superWholesalePrice
    const specialQuantity = product.superWholesaleQuantity

    addItem({
      productId: product.id,
      name: product.name,
      subname: product.subname,
      image: imageUrl,
      quantity,
      unitPrice,
      specialPrice,
      specialQuantity
    })

    setQuantity(1)
  }

  const currentPrice = product.superWholesaleQuantity && quantity >= product.superWholesaleQuantity && product.superWholesalePrice
    ? product.superWholesalePrice
    : product.price

  // Obter a URL da imagem principal
  const imageUrl = product.images?.find(img => img.isMain)?.url || product.images?.[0]?.url || product.image

  return (
    <div className="card hover:shadow-lg transition-all duration-300 overflow-hidden group animate-fade-in">
      <div className="aspect-square relative" style={{ background: 'var(--muted)' }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--muted-foreground)' }}>
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {product.boxQuantity && (
          <div 
            className="absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1"
            style={{ 
              background: 'var(--orange)', 
              color: 'var(--surface)' 
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            {product.boxQuantity}x
          </div>
        )}
        
        {product.superWholesalePrice && (
          <div 
            className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-medium"
            style={{ 
              background: 'var(--green)', 
              color: 'var(--surface)' 
            }}
          >
            Atacado
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-1" style={{ color: 'var(--foreground)' }}>
          {product.name}
        </h3>
        {product.subname && (
          <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {product.subname}
          </p>
        )}

        {unlocked ? (
          <div className="mt-3">
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {formatPrice(currentPrice)}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  unidade
                </span>
              </div>
              
              {product.superWholesalePrice && product.superWholesaleQuantity && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }}></div>
                  <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    {product.superWholesaleQuantity}+ un: {formatPrice(product.superWholesalePrice)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Quantidade */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Quantidade
                </span>
                <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="interactive px-3 py-1.5 hover:bg-accent text-sm font-medium"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 text-center py-1.5 text-sm font-medium border-x"
                    style={{ 
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)'
                    }}
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="interactive px-3 py-1.5 hover:bg-accent text-sm font-medium"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="btn-primary w-full interactive flex items-center justify-center gap-2"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                {product.hasModels ? 'Escolher Modelo' : 'Adicionar'}
              </button>

              <button
                onClick={() => setShowComboSuggestions(!showComboSuggestions)}
                className="btn-secondary w-full interactive text-xs"
                style={{ 
                  background: 'var(--accent)', 
                  color: 'var(--accent-foreground)',
                  borderColor: 'var(--border)'
                }}
              >
                Combos Populares
              </button>
            </div>

            {/* Combo Suggestions */}
            {showComboSuggestions && (
              <div className="card mt-4 p-4 animate-scale-in">
                <h4 className="font-medium mb-3 text-sm" style={{ color: 'var(--foreground)' }}>
                  Combos populares
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <CaseIcon size={14} style={{ color: 'var(--muted-foreground)' }} />
                      <span className="text-sm">Capinha Transparente</span>
                    </div>
                    <button 
                      className="interactive text-xs px-2 py-1 rounded-md"
                      style={{ 
                        background: 'var(--primary)', 
                        color: 'var(--primary-foreground)' 
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <ScreenProtectorIcon size={14} style={{ color: 'var(--muted-foreground)' }} />
                      <span className="text-sm">Película de Vidro</span>
                    </div>
                    <button 
                      className="interactive text-xs px-2 py-1 rounded-md"
                      style={{ 
                        background: 'var(--primary)', 
                        color: 'var(--primary-foreground)' 
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <ChargerIcon size={14} style={{ color: 'var(--muted-foreground)' }} />
                      <span className="text-sm">Carregador Rápido</span>
                    </div>
                    <button 
                      className="interactive text-xs px-2 py-1 rounded-md"
                      style={{ 
                        background: 'var(--primary)', 
                        color: 'var(--primary-foreground)' 
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
                  86% dos lojistas compram juntos
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <div className="text-center p-3" style={{ background: 'var(--muted)', borderRadius: '8px' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>
                Preços para lojistas
              </p>
              <button
                className="btn-primary w-full interactive"
                style={{ background: 'var(--orange)', color: 'var(--surface)' }}
              >
                Visualizar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

