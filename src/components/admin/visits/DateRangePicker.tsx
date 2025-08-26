'use client'

import React, { useState } from 'react'
import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
  startDate: string | null
  endDate: string | null
  onStartDateChange: (date: string | null) => void
  onEndDateChange: (date: string | null) => void
  className?: string
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = ''
}: DateRangePickerProps) {
  
  // Função para formatar data para input type="date" (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }
  
  // Data de hoje para limitar seleção futura
  const today = formatDateForInput(new Date())
  
  // Data de 30 dias atrás como sugestão inicial
  const thirtyDaysAgo = formatDateForInput(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  )
  
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || null
    onStartDateChange(value)
    
    // Se a data final for anterior à nova data inicial, ajustar
    if (value && endDate && value > endDate) {
      onEndDateChange(value)
    }
  }
  
  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || null
    onEndDateChange(value)
    
    // Se a data inicial for posterior à nova data final, ajustar
    if (value && startDate && startDate > value) {
      onStartDateChange(value)
    }
  }
  
  const handleQuickSelect = (days: number) => {
    const end = new Date()
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    onStartDateChange(formatDateForInput(start))
    onEndDateChange(formatDateForInput(end))
  }
  
  const clearDates = () => {
    onStartDateChange(null)
    onEndDateChange(null)
  }
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-900">Período</h3>
      </div>
      
      {/* Inputs de data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Data Inicial
          </label>
          <input
            type="date"
            value={startDate || ''}
            onChange={handleStartDateChange}
            max={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Data Final
          </label>
          <input
            type="date"
            value={endDate || ''}
            onChange={handleEndDateChange}
            min={startDate || undefined}
            max={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Botões de seleção rápida */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => handleQuickSelect(1)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          Hoje
        </button>
        
        <button
          onClick={() => handleQuickSelect(7)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          7 dias
        </button>
        
        <button
          onClick={() => handleQuickSelect(30)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          30 dias
        </button>
        
        <button
          onClick={() => handleQuickSelect(90)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          90 dias
        </button>
      </div>
      
      {/* Botão limpar */}
      {(startDate || endDate) && (
        <button
          onClick={clearDates}
          className="w-full py-2 text-xs text-gray-600 hover:text-gray-800 border-t border-gray-200 transition-colors"
        >
          Limpar datas
        </button>
      )}
      
      {/* Indicador do período selecionado */}
      {startDate && endDate && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
          <strong>Período:</strong> {new Date(startDate).toLocaleDateString('pt-BR')} até {new Date(endDate).toLocaleDateString('pt-BR')}
        </div>
      )}
      
      {startDate && !endDate && (
        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
          <strong>Desde:</strong> {new Date(startDate).toLocaleDateString('pt-BR')}
        </div>
      )}
      
      {!startDate && endDate && (
        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
          <strong>Até:</strong> {new Date(endDate).toLocaleDateString('pt-BR')}
        </div>
      )}
    </div>
  )
}