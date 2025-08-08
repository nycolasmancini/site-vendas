import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  subname?: string
  image?: string
  modelId?: string
  modelName?: string
  quantity: number
  unitPrice: number
  specialPrice?: number
  specialQuantity?: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  
  getSubtotal: () => number
  getItemsCount: () => number
  getSavings: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId && i.modelId === item.modelId
          )
          
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === existingItem.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          
          return {
            items: [
              ...state.items,
              {
                ...item,
                id: `${item.productId}-${item.modelId || 'default'}-${Date.now()}`,
              },
            ],
          }
        })
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }))
      },
      
      clearCart: () => {
        set({ items: [] })
      },
      
      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }))
      },
      
      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.specialQuantity && item.quantity >= item.specialQuantity
            ? item.specialPrice || item.unitPrice
            : item.unitPrice
          return total + price * item.quantity
        }, 0)
      },
      
      getItemsCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getSavings: () => {
        return get().items.reduce((total, item) => {
          if (item.specialQuantity && item.quantity >= item.specialQuantity && item.specialPrice) {
            const regularTotal = item.unitPrice * item.quantity
            const specialTotal = item.specialPrice * item.quantity
            return total + (regularTotal - specialTotal)
          }
          return total
        }, 0)
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
)