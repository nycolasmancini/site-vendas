import imageCompression from 'browser-image-compression'

export interface CompressedImage {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

/**
 * Comprimir imagem no lado do cliente antes do upload
 */
export async function compressImage(
  file: File,
  options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    quality: 0.8
  }
): Promise<CompressedImage> {
  try {
    const originalSize = file.size

    // Configurações de compressão
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
      useWebWorker: options.useWebWorker,
      fileType: options.fileType,
      initialQuality: options.quality
    })

    const compressedSize = compressedFile.size
    const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100)

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio
    }
  } catch (error) {
    console.error('Erro na compressão da imagem:', error)
    throw new Error('Falha na compressão da imagem')
  }
}

/**
 * Validar dimensões mínimas da imagem
 */
export function validateImageDimensions(file: File): Promise<{ valid: boolean; error?: string; width?: number; height?: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      if (img.width < 300 || img.height < 300) {
        resolve({ 
          valid: false, 
          error: 'Imagem muito pequena. Mínimo 300x300px.',
          width: img.width,
          height: img.height
        })
      } else {
        resolve({ 
          valid: true,
          width: img.width,
          height: img.height
        })
      }
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ valid: false, error: 'Arquivo de imagem inválido' })
    }
    
    img.src = url
  })
}

/**
 * Converter File para Buffer (server-side)
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    throw new Error('Falha na conversão do arquivo')
  }
}

/**
 * Gerar nome único para arquivo
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_')
  
  return `${baseName}_${timestamp}_${random}.${extension}`
}

/**
 * Processar múltiplas imagens
 */
export async function processMultipleImages(files: FileList): Promise<CompressedImage[]> {
  const maxImages = 4
  
  if (files.length > maxImages) {
    throw new Error(`Máximo ${maxImages} imagens permitidas`)
  }

  const processedImages: CompressedImage[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // Validar arquivo
    const { valid, error } = await validateImageDimensions(file)
    if (!valid) {
      throw new Error(`Imagem ${i + 1}: ${error}`)
    }

    // Comprimir
    const compressed = await compressImage(file)
    processedImages.push(compressed)
  }

  return processedImages
}