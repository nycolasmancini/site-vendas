import { supabase } from './supabase'

export async function uploadProductImage(file: File, index: number): Promise<string | null> {
  try {
    // Primeiro, verificar se o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError)
      return null
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'product-images')
    
    if (!bucketExists) {
      // Tentar criar o bucket
      const { error: createError } = await supabase.storage
        .createBucket('product-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        })
      
      if (createError) {
        console.error('Erro ao criar bucket:', createError)
        return null
      }

      console.log('Bucket product-images criado com sucesso!')
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2)
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${index}_${randomString}_${cleanFileName}`

    // Fazer upload do arquivo
    const { data, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return null
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Erro geral no upload:', error)
    return null
  }
}

export async function ensureStorageBucket(): Promise<boolean> {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Erro ao verificar buckets:', listError)
      return false
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'product-images')
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage
        .createBucket('product-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        })
      
      if (createError) {
        console.error('Erro ao criar bucket:', createError)
        return false
      }

      console.log('Bucket product-images criado!')
    }

    return true
  } catch (error) {
    console.error('Erro ao garantir bucket:', error)
    return false
  }
}