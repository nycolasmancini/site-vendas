'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useCartStore } from '@/stores/useCartStore'
import { useSession } from '@/contexts/SessionContext'
import { formatPrice } from '@/lib/utils'


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
    isModalProduct?: boolean
    priceRange?: {
      min: number
      max: number
      superWholesaleMin?: number
      superWholesaleMax?: number
    }
  }
  onSelectModels?: () => void
  onUnlockPrices?: () => void
}

export default function ProductCard({ product, onSelectModels, onUnlockPrices }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const cartItems = useCartStore((state) => state.items)
  const { unlocked } = useSession()
  const [quantity, setQuantity] = useState<number | string>(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Função para obter quantidade no carrinho para este produto
  const getCartQuantity = (): number => {
    const cartItem = cartItems.find(item => item.productId === product.id && !item.modelId)
    return cartItem ? cartItem.quantity : 0
  }

  const createRippleEffect = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const ripple = document.createElement('div')
    ripple.className = 'ripple-effect'
    ripple.style.width = '10px'
    ripple.style.height = '10px'
    ripple.style.left = `${x - 5}px`
    ripple.style.top = `${y - 5}px`

    button.appendChild(ripple)

    setTimeout(() => {
      ripple.remove()
    }, 600)
  }

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (product.hasModels || product.isModalProduct) {
      onSelectModels?.()
      return
    }

    if (isAnimating) return

    // Create ripple effect
    createRippleEffect(event)

    // Start animation sequence
    setIsAnimating(true)
    
    // Add haptic feedback simulation (button pulse)
    if (buttonRef.current) {
      buttonRef.current.classList.add('btn-add-to-cart-animate')
    }

    const unitPrice = product.price
    const specialPrice = product.superWholesalePrice
    const specialQuantity = product.superWholesaleQuantity
    const finalQuantity = typeof quantity === 'string' ? parseInt(quantity) || 1 : quantity
    
    // Add to cart after short delay to show button animation
    setTimeout(() => {
      addItem({
        productId: product.id,
        name: product.name,
        subname: product.subname,
        image: imageUrl,
        quantity: finalQuantity,
        unitPrice,
        specialPrice,
        specialQuantity,
        superWholesalePrice: product.superWholesalePrice,
        superWholesaleQuantity: product.superWholesaleQuantity
      })

      // Show success state
      setShowSuccess(true)
      if (buttonRef.current) {
        buttonRef.current.classList.remove('btn-add-to-cart-animate')
        buttonRef.current.classList.add('btn-add-to-cart-success', 'btn-success-state')
      }

      // Reset after success animation
      setTimeout(() => {
        setShowSuccess(false)
        setIsAnimating(false)
        setQuantity(1)
        if (buttonRef.current) {
          buttonRef.current.classList.remove('btn-add-to-cart-success', 'btn-success-state')
        }
      }, 1200)
    }, 300)
  }

  const numericQuantity = typeof quantity === 'string' ? parseInt(quantity) || 1 : quantity
  const cartQuantity = getCartQuantity()
  
  // Só mostra preço de super atacado se já atingiu a quantidade no carrinho
  const hasReachedWholesaleQuantity = product.superWholesaleQuantity && cartQuantity >= product.superWholesaleQuantity
  const currentPrice = hasReachedWholesaleQuantity && product.superWholesalePrice
    ? product.superWholesalePrice
    : product.price

  // Obter a URL da imagem principal
  const imageUrl = product.images?.find(img => img.isMain)?.url || product.images?.[0]?.url || product.image

  return (
    <div className="card hover:shadow-lg transition-all duration-300 overflow-hidden group animate-fade-in sm:w-full md:min-w-[280px]">
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
        
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="font-semibold line-clamp-2 mb-1 text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>
          {product.name}
        </h3>
        {product.subname && (
          <p className="text-xs sm:text-sm mb-2 sm:mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {product.subname}
          </p>
        )}

        {unlocked ? (
          <div className="mt-3">
            <div className="mb-4">
              {product.isModalProduct && product.priceRange ? (
                <div>
                  {/* Range de preços atacado */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                      {product.priceRange.min === product.priceRange.max 
                        ? formatPrice(product.priceRange.min)
                        : `${formatPrice(product.priceRange.min)} - ${formatPrice(product.priceRange.max)}`
                      }
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      atacado
                    </span>
                  </div>
                  
                  {/* Range de preços super atacado */}
                  {product.priceRange.superWholesaleMin && product.priceRange.superWholesaleMax && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }}></div>
                      <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Caixa fechada: {product.priceRange.superWholesaleMin === product.priceRange.superWholesaleMax
                          ? formatPrice(product.priceRange.superWholesaleMin)
                          : `${formatPrice(product.priceRange.superWholesaleMin)} - ${formatPrice(product.priceRange.superWholesaleMax)}`
                        }
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Preço principal */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span 
                      key={`${product.id}-${currentPrice}`}
                      className="text-lg sm:text-xl font-bold transition-all duration-500 ease-in-out animate-price-change"
                      style={{
                        color: 'var(--foreground)',
                        animation: 'fadeInPrice 0.5s ease-in-out'
                      }}
                    >
                      {formatPrice(currentPrice)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      unidade
                    </span>
                  </div>
                  
                  {/* Preço de super atacado - aparece sempre abaixo */}
                  {product.superWholesalePrice && product.superWholesaleQuantity && !hasReachedWholesaleQuantity && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }}></div>
                      <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        +{Math.max(0, product.superWholesaleQuantity - cartQuantity)} un: {formatPrice(product.superWholesalePrice)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {product.isModalProduct ? (
              <button
                ref={buttonRef}
                onClick={handleAddToCart}
                className="btn-primary w-full interactive flex items-center justify-center gap-2"
                style={{ 
                  background: 'var(--primary)', 
                  color: 'var(--primary-foreground)'
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <path d="M9 9h6v6H9z"/>
                </svg>
                <span className="font-medium">Escolher Modelo</span>
              </button>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {/* Quantidade */}
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    Quantidade
                  </span>
                  <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => {
                        const currentNum = typeof quantity === 'string' ? parseInt(quantity) || 1 : quantity
                        setQuantity(Math.max(1, currentNum - 1))
                      }}
                      className="interactive px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-accent text-sm font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const value = e.target.value
                        // Permite campo vazio temporariamente para digitar
                        if (value === '') {
                          setQuantity('')
                          return
                        }
                        // Converte para número e valida
                        const numValue = parseInt(value)
                        if (!isNaN(numValue) && numValue > 0) {
                          setQuantity(numValue)
                        }
                      }}
                      onBlur={(e) => {
                        // Garante que nunca fica vazio ou zero quando perde o foco
                        const value = e.target.value
                        if (value === '' || parseInt(value) <= 0) {
                          setQuantity(1)
                        }
                      }}
                      min="1"
                      className="w-10 sm:w-12 text-center py-1 sm:py-1.5 text-sm font-medium border-x"
                      style={{ 
                        background: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)'
                      }}
                    />
                    <button
                      onClick={() => {
                        const currentNum = typeof quantity === 'string' ? parseInt(quantity) || 1 : quantity
                        setQuantity(currentNum + 1)
                      }}
                      className="interactive px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-accent text-sm font-medium"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <button
                  ref={buttonRef}
                  onClick={handleAddToCart}
                  disabled={isAnimating}
                  className={`btn-primary w-full interactive flex items-center justify-center gap-2 relative overflow-hidden transition-all duration-300 ${
                    isAnimating ? 'cursor-not-allowed' : ''
                  }`}
                  style={{ 
                    background: showSuccess ? 'var(--green)' : 'var(--primary)', 
                    color: 'var(--primary-foreground)',
                    opacity: isAnimating ? 0.9 : 1
                  }}
                >
                  {showSuccess ? (
                    <>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5"
                        className="checkmark-animate"
                      >
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      <span className="font-medium">Adicionado!</span>
                    </>
                  ) : (
                    <>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.5"
                        className={isAnimating ? 'cart-icon-bounce' : ''}
                      >
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      <span className="font-medium text-sm sm:text-base">
                        {product.hasModels || product.isModalProduct ? 'Escolher Modelo' : (isAnimating ? 'Adicionando...' : 'Adicionar')}
                      </span>
                      {typeof quantity === 'number' && quantity > 1 && !isAnimating && (
                        <span 
                          className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold quantity-pop"
                          style={{ background: 'rgba(255,255,255,0.2)' }}
                        >
                          {quantity}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <div className="text-center p-4" style={{ background: 'var(--muted)', borderRadius: '8px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }}>
                <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Preços exclusivos para lojistas
              </p>
              <button
                onClick={onUnlockPrices}
                className="btn-primary w-full interactive"
                style={{ background: 'var(--orange)', color: 'var(--surface)' }}
              >
                Liberar Preços
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

