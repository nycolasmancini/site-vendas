'use client'

import { useState } from 'react'
import { useSession } from '@/contexts/SessionContext'
import { validateBrazilianWhatsApp, formatWhatsApp } from '@/lib/utils'

interface UnlockPricesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UnlockPricesModal({ isOpen, onClose }: UnlockPricesModalProps) {
  const { unlockPrices } = useSession()
  const [whatsapp, setWhatsapp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Formatar WhatsApp
    const formattedWhatsApp = formatWhatsApp(whatsapp)

    // Validar
    if (!validateBrazilianWhatsApp(formattedWhatsApp)) {
      setError('Por favor, insira um WhatsApp válido com DDD')
      return
    }

    setLoading(true)

    try {
      await unlockPrices(formattedWhatsApp)
      onClose()
    } catch (error) {
      setError('Erro ao liberar preços. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Veja os Melhores Preços!
          </h2>
          <p className="text-gray-600">
            Informe seu WhatsApp para liberar os preços exclusivos de atacado
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <input
              type="tel"
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#FC6D36' }}
            >
              {loading ? 'Liberando...' : 'Liberar Preços'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Ao informar seu WhatsApp, você concorda em receber mensagens sobre seus pedidos.
            Seus dados estão seguros e não serão compartilhados.
          </p>
        </div>
      </div>
    </div>
  )
}