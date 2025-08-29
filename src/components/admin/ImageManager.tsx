'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, Star, Upload, Loader2, AlertCircle } from 'lucide-react'
import { compressImage, validateImageDimensions } from '@/lib/image-utils'
import { validateImage } from '@/lib/cloudinary'

interface ProductImage {
  id: string
  url: string
  fileName?: string
  order: number
  isMain: boolean
  thumbnailUrl?: string
  normalUrl?: string
  viewCount?: number
}

interface ImageManagerProps {
  productId: string
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
  maxImages?: number
  disabled?: boolean
}

const ImageManager = ({ 
  productId, 
  images, 
  onImagesChange, 
  maxImages = 4,
  disabled = false 
}: ImageManagerProps) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAddMore = images.length < maxImages
  const remainingSlots = maxImages - images.length

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (disabled) return
    
    setError(null)
    
    // Validar quantidade
    if (files.length > remainingSlots) {
      setError(`Máximo ${maxImages} imagens por produto. Você pode adicionar apenas ${remainingSlots} imagem(ns).`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Validar cada arquivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validar formato e tamanho
        const validation = validateImage(file)
        if (!validation.valid) {
          throw new Error(`Imagem ${i + 1}: ${validation.error}`)
        }

        // Validar dimensões
        const dimensions = await validateImageDimensions(file)
        if (!dimensions.valid) {
          throw new Error(`Imagem ${i + 1}: ${dimensions.error}`)
        }
      }

      // Comprimir imagens
      const compressedImages = []
      let totalOriginalSize = 0
      let totalCompressedSize = 0
      
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i])
        compressedImages.push(compressed)
        totalOriginalSize += compressed.originalSize
        totalCompressedSize += compressed.compressedSize
        setUploadProgress(((i + 1) / files.length) * 50) // 50% para compressão
      }

      const totalCompressionRatio = Math.round((1 - totalCompressedSize / totalOriginalSize) * 100)
      console.log(`📊 Compressão: ${totalCompressionRatio}% de redução (${totalOriginalSize} → ${totalCompressedSize} bytes)`)

      // Upload para o servidor
      const formData = new FormData()
      compressedImages.forEach(({ file }) => {
        formData.append('images', file)
      })

      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro no upload')
      }

      const result = await response.json()
      
      // Atualizar lista de imagens
      const updatedImages = [...images, ...result.images]
      onImagesChange(updatedImages)

      console.log(`✅ ${result.images.length} imagem(ns) adicionada(s) com sucesso`)

    } catch (error) {
      console.error('Erro no upload:', error)
      setError(error instanceof Error ? error.message : 'Erro no upload das imagens')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [productId, images, onImagesChange, maxImages, remainingSlots, disabled])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const setAsMain = async (imageId: string) => {
    if (disabled) return
    
    try {
      const response = await fetch(`/api/products/${productId}/images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'set_main' }),
      })

      if (!response.ok) {
        throw new Error('Erro ao definir imagem principal')
      }

      // Atualizar estado local
      const updatedImages = images.map(img => ({
        ...img,
        isMain: img.id === imageId
      }))
      onImagesChange(updatedImages)

    } catch (error) {
      console.error('Erro ao definir imagem principal:', error)
      setError('Erro ao definir imagem principal')
    }
  }

  const deleteImage = async (imageId: string, imageName: string) => {
    if (disabled) return
    
    if (!confirm(`Tem certeza que deseja excluir a imagem "${imageName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir imagem')
      }

      // Atualizar estado local
      const updatedImages = images.filter(img => img.id !== imageId)
      onImagesChange(updatedImages)

    } catch (error) {
      console.error('Erro ao excluir imagem:', error)
      setError(error instanceof Error ? error.message : 'Erro ao excluir imagem')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Imagens do Produto ({images.length}/{maxImages})
        </h3>
        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Upload className="h-4 w-4 mr-1" />
            Adicionar Imagens
          </button>
        )}
      </div>

      {/* Área de Upload */}
      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : disabled 
                ? 'border-gray-200 bg-gray-50' 
                : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/webp,image/png,image/jpeg"
            onChange={handleFileInputChange}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
              <p className="text-sm text-gray-600">Fazendo upload...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">
                Arraste imagens aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-500">
                WebP, PNG ou JPEG • Máximo 5MB • Mínimo 300x300px
              </p>
              <p className="text-xs font-medium text-gray-700">
                {remainingSlots} slot(s) disponível(is)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
            <div className="ml-2">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-500 mt-1"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Imagens Existentes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images
            .sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0) || a.order - b.order)
            .map((image, index) => (
            <div 
              key={image.id} 
              className="relative group border border-gray-200 rounded-lg overflow-hidden aspect-square"
            >
              {/* Imagem */}
              {image.url.startsWith('data:') ? (
                // Imagem base64 (sistema antigo)
                <img
                  src={image.url}
                  alt={image.fileName || `Imagem ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                // Imagem Cloudinary (sistema novo)
                <Image
                  src={image.thumbnailUrl || image.url}
                  alt={image.fileName || `Imagem ${index + 1}`}
                  width={150}
                  height={150}
                  className="w-full h-full object-cover"
                  unoptimized={false}
                />
              )}

              {/* Badge de Imagem Principal */}
              {image.isMain && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Principal
                </div>
              )}

              {/* Contador de Visualizações */}
              {image.viewCount !== undefined && image.viewCount > 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                  👁️ {image.viewCount}
                </div>
              )}

              {/* Controles (aparece no hover) */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                  {/* Botão Definir como Principal */}
                  {!image.isMain && (
                    <button
                      onClick={() => setAsMain(image.id)}
                      disabled={disabled}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-md transition-colors disabled:opacity-50"
                      title="Definir como principal"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}

                  {/* Botão Excluir */}
                  <button
                    onClick={() => deleteImage(image.id, image.fileName || 'imagem')}
                    disabled={disabled || images.length <= 1}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md transition-colors disabled:opacity-50"
                    title={images.length <= 1 ? 'Produto deve ter pelo menos 1 imagem' : 'Excluir imagem'}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Informações da Imagem */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                <p className="text-white text-xs truncate">
                  {image.fileName || `Imagem ${index + 1}`}
                </p>
              </div>
            </div>
          ))}

          {/* Slots Vazios */}
          {Array.from({ length: remainingSlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex items-center justify-center text-gray-400 bg-gray-50"
            >
              <div className="text-center">
                <Upload className="h-6 w-6 mx-auto mb-1" />
                <p className="text-xs">Slot {images.length + index + 1}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Informações e Dicas */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">💡 Dicas sobre imagens:</p>
          <ul className="text-xs space-y-1 text-blue-700">
            <li>• A primeira imagem adicionada será a principal automaticamente</li>
            <li>• Use a estrela para alterar a imagem principal</li>
            <li>• Formatos: WebP (recomendado), PNG ou JPEG</li>
            <li>• Tamanho ideal: 500x500px para melhor qualidade</li>
            <li>• As imagens são comprimidas automaticamente</li>
          </ul>
        </div>
      </div>

      {/* Estatísticas */}
      {images.length > 0 && (
        <div className="text-xs text-gray-500 flex justify-between">
          <span>
            {images.length} de {maxImages} imagens utilizadas
          </span>
          {images.some(img => img.viewCount && img.viewCount > 0) && (
            <span>
              Total de visualizações: {images.reduce((total, img) => total + (img.viewCount || 0), 0)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageManager