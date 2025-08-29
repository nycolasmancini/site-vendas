import { v2 as cloudinary } from 'cloudinary'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
  thumbnailUrl: string
  normalUrl: string
}

export interface ImageUploadOptions {
  folder?: string
  quality?: 'auto' | number
  format?: 'auto' | 'webp' | 'png'
  transformation?: any[]
}

/**
 * Upload de imagem para Cloudinary com otimizações
 */
export async function uploadImageToCloudinary(
  imageBuffer: Buffer,
  fileName: string,
  options: ImageUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    const {
      folder = 'pmcell/products',
      quality = 'auto',
      format = 'webp'
    } = options

    // Upload da imagem original com transformações
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${fileName}_${Date.now()}`,
          format,
          quality,
          fetch_format: 'auto',
          // Gerar versões automáticas
          eager: [
            { width: 150, height: 150, crop: 'fill', format: 'webp', quality: 70, fetch_format: 'auto' }, // Thumbnail
            { width: 500, height: 500, crop: 'fill', format: 'webp', quality: 80, fetch_format: 'auto' }  // Normal
          ],
          // Tags para organização
          tags: ['product', 'ecommerce'],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(imageBuffer)
    })

    // Gerar URLs das versões
    const thumbnailUrl = cloudinary.url(result.public_id, {
      width: 150,
      height: 150,
      crop: 'fill',
      format: 'webp',
      quality: 70,
      fetch_format: 'auto'
    })

    const normalUrl = cloudinary.url(result.public_id, {
      width: 500,
      height: 500,
      crop: 'fill',
      format: 'webp',
      quality: 80,
      fetch_format: 'auto'
    })

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      thumbnailUrl,
      normalUrl
    }
  } catch (error) {
    console.error('Erro no upload para Cloudinary:', error)
    throw new Error('Falha no upload da imagem')
  }
}

/**
 * Excluir imagem do Cloudinary
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Erro ao excluir imagem do Cloudinary:', error)
    return false
  }
}

/**
 * Gerar URL otimizada para imagem
 */
export function getOptimizedImageUrl(
  publicId: string,
  size: 'thumbnail' | 'normal' | 'full' = 'normal'
): string {
  const transformations = {
    thumbnail: { width: 150, height: 150, crop: 'fill', quality: 70 },
    normal: { width: 500, height: 500, crop: 'fill', quality: 80 },
    full: { width: 1200, height: 1200, crop: 'limit', quality: 90 }
  }

  return cloudinary.url(publicId, {
    ...transformations[size],
    format: 'webp',
    fetch_format: 'auto'
  })
}

/**
 * Validar se imagem é válida
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  // Verificar formato
  const allowedTypes = ['image/webp', 'image/png', 'image/jpeg']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato não suportado. Use WebP, PNG ou JPEG.' }
  }

  // Verificar tamanho (5MB máximo)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Imagem muito grande. Máximo 5MB.' }
  }

  return { valid: true }
}

export default cloudinary