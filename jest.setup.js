// Jest setup file
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// Mock do Cloudinary para testes
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((options, callback) => {
        const mockResult = {
          public_id: 'test_' + Date.now(),
          secure_url: 'https://res.cloudinary.com/test/image/upload/test.webp',
          width: 500,
          height: 500,
          format: 'webp',
          bytes: 50000
        }
        setTimeout(() => callback(null, mockResult), 100)
        return { end: jest.fn() }
      }),
      destroy: jest.fn(() => Promise.resolve({ result: 'ok' }))
    },
    url: jest.fn((publicId, options) => 
      `https://res.cloudinary.com/test/image/upload/w_${options?.width || 500},h_${options?.height || 500}/${publicId}.${options?.format || 'webp'}`
    )
  }
}))

// Mock do browser-image-compression
jest.mock('browser-image-compression', () => {
  return jest.fn((file, options) => {
    const compressedFile = new File(
      [new Blob(['compressed'], { type: 'image/webp' })], 
      file.name.replace(/\.[^/.]+$/, '.webp'),
      { type: 'image/webp' }
    )
    Object.defineProperty(compressedFile, 'size', { value: Math.floor(file.size * 0.6) })
    return Promise.resolve(compressedFile)
  })
})