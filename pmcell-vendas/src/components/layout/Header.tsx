"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, ShoppingCart, Menu, X } from "lucide-react"
import { useCartStore } from "@/stores/useCartStore"
import { cn } from "@/lib/utils"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showSearch, setShowSearch] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  const itemsCount = useCartStore((state) => state.getItemsCount())
  const toggleCart = useCartStore((state) => state.toggleCart)
  
  // Evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      setIsScrolled(currentScrollY > 10)
      
      // Mobile: esconde busca ao rolar para baixo, mostra ao subir
      if (window.innerWidth < 768) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setShowSearch(false)
        } else {
          setShowSearch(true)
        }
      }
      
      setLastScrollY(currentScrollY)
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])
  
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-white transition-all duration-300",
        isScrolled && "shadow-md"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-[#FC6D36]">PMCELL</span>
            <span className="hidden sm:inline text-sm text-gray-600">São Paulo</span>
          </Link>
          
          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar produtos..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:border-[#FC6D36] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Carrinho */}
            <button
              onClick={toggleCart}
              className="relative rounded-lg p-2 hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="h-6 w-6 text-gray-700" />
              {mounted && itemsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FC6D36] text-xs font-bold text-white">
                  {itemsCount}
                </span>
              )}
            </button>
            
            {/* Mobile Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-lg p-2 hover:bg-gray-100 transition-colors md:hidden"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            showSearch ? "max-h-16 pb-3" : "max-h-0"
          )}
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar produtos..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:border-[#FC6D36] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>
    </header>
  )
}