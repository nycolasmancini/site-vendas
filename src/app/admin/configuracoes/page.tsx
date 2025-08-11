'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Configuracoes() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  // Verificar se é admin
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.email !== 'admin@pmcell.com.br') {
    router.push('/admin/login')
    return null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Criar preview
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      
      // Upload automático
      handleUpload(file)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('/api/upload-loja', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('✅ Foto da loja atualizada com sucesso!')
        // Limpar preview após sucesso
        setTimeout(() => {
          setPreviewUrl('')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }, 3000)
      } else {
        setMessage(`❌ Erro: ${result.error}`)
      }
    } catch (error) {
      setMessage('❌ Erro ao enviar arquivo')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">
            Foto da Loja
          </h2>
          
          <div className="space-y-6">
            {/* Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Atualizar foto da loja (exibida na página "Sobre Nós")
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                  
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      {uploading ? 'Enviando...' : 'Selecionar Foto'}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    JPG, PNG ou GIF até 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
                <div className="max-w-md">
                  <img
                    src={previewUrl}
                    alt="Preview da foto"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* Current Image */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Foto atual:</h3>
              <div className="max-w-md">
                <img
                  src="/pmcell-loja.jpg"
                  alt="Foto atual da loja"
                  className="w-full h-48 object-cover rounded-lg border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz4KPGF5cmNsZSBjeD0iOSIgY3k9IjkiIHI9IjIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz4KPHN0cm9rZSBkPSJtMjEgMTUtMy4wODYtMy4wODZhMiAyIDAgMCAwLTIuODI4IDBMNiAyMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                    target.className = 'w-full h-48 object-contain rounded-lg border bg-gray-100 p-8';
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Esta é a foto exibida na seção "Nossa Localização" da página Sobre Nós
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}