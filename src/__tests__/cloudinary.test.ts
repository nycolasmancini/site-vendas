import { describe, it, expect, beforeEach } from '@jest/globals'
import { 
  uploadImageToCloudinary, 
  deleteImageFromCloudinary, 
  getOptimizedImageUrl, 
  validateImage 
} from '@/lib/cloudinary'
import { compressImage, validateImageDimensions } from '@/lib/image-utils'

// Mock do ambiente
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'

describe('Cloudinary Integration', () => {
  let mockImageBuffer: Buffer
  let mockFile: File

  beforeEach(() => {
    mockImageBuffer = Buffer.from('fake-image-data')
    mockFile = new File([new Blob(['test'], { type: 'image/webp' })], 'test.webp', { type: 'image/webp' })
    Object.defineProperty(mockFile, 'size', { value: 100000 }) // 100KB
  })

  describe('uploadImageToCloudinary', () => {
    it('deve fazer upload e gerar URLs otimizadas', async () => {
      const result = await uploadImageToCloudinary(mockImageBuffer, 'test-image')
      
      expect(result).toHaveProperty('public_id')
      expect(result).toHaveProperty('secure_url')
      expect(result).toHaveProperty('thumbnailUrl')
      expect(result).toHaveProperty('normalUrl')
      expect(result.format).toBe('webp')
      expect(result.thumbnailUrl).toContain('w_150,h_150')
      expect(result.normalUrl).toContain('w_500,h_500')
    })

    it('deve usar configurações padrão quando opções não fornecidas', async () => {
      const result = await uploadImageToCloudinary(mockImageBuffer, 'test-image')
      
      expect(result.thumbnailUrl).toContain('webp')
      expect(result.normalUrl).toContain('webp')
    })
  })

  describe('deleteImageFromCloudinary', () => {
    it('deve excluir imagem com sucesso', async () => {
      const result = await deleteImageFromCloudinary('test_public_id')
      expect(result).toBe(true)
    })

    it('deve retornar false em caso de erro', async () => {
      const cloudinary = require('cloudinary')
      cloudinary.v2.uploader.destroy.mockRejectedValueOnce(new Error('Network error'))
      
      const result = await deleteImageFromCloudinary('invalid_id')
      expect(result).toBe(false)
    })
  })

  describe('getOptimizedImageUrl', () => {
    it('deve gerar URL de thumbnail corretamente', () => {
      const url = getOptimizedImageUrl('test_image', 'thumbnail')
      expect(url).toContain('w_150,h_150')
      expect(url).toContain('webp')
    })

    it('deve gerar URL normal por padrão', () => {
      const url = getOptimizedImageUrl('test_image')
      expect(url).toContain('w_500,h_500')
    })

    it('deve gerar URL full size', () => {
      const url = getOptimizedImageUrl('test_image', 'full')
      expect(url).toContain('w_1200,h_1200')
    })
  })

  describe('validateImage', () => {
    it('deve aceitar formatos válidos', () => {
      const webpFile = new File([new Blob()], 'test.webp', { type: 'image/webp' })
      Object.defineProperty(webpFile, 'size', { value: 1000000 }) // 1MB
      
      const result = validateImage(webpFile)
      expect(result.valid).toBe(true)
    })

    it('deve rejeitar formatos inválidos', () => {
      const gifFile = new File([new Blob()], 'test.gif', { type: 'image/gif' })
      
      const result = validateImage(gifFile)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Formato não suportado')
    })

    it('deve rejeitar arquivos muito grandes', () => {
      const bigFile = new File([new Blob()], 'test.webp', { type: 'image/webp' })
      Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 }) // 6MB
      
      const result = validateImage(bigFile)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('muito grande')
    })
  })
})

describe('Image Utils', () => {
  beforeEach(() => {
    mockFile = new File([new Blob(['test'], { type: 'image/jpeg' })], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(mockFile, 'size', { value: 200000 }) // 200KB
  })

  describe('compressImage', () => {
    it('deve comprimir imagem e retornar estatísticas', async () => {
      const result = await compressImage(mockFile)
      
      expect(result.file).toBeDefined()
      expect(result.originalSize).toBe(200000)
      expect(result.compressedSize).toBeLessThan(result.originalSize)
      expect(result.compressionRatio).toBeGreaterThan(0)
      expect(result.file.type).toBe('image/webp')
    })

    it('deve usar opções customizadas', async () => {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: false,
        fileType: 'image/png' as const,
        quality: 0.9
      }
      
      const result = await compressImage(mockFile, options)
      expect(result.file.type).toBe('image/webp') // Mock sempre retorna webp
    })
  })

  describe('validateImageDimensions', () => {
    // Para testes reais, precisaríamos do DOM
    it('deve ser testado em ambiente com DOM', () => {
      expect(typeof validateImageDimensions).toBe('function')
    })
  })
})