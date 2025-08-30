import { prisma } from './prisma'

export async function safeProductImageOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    // Verificar se tabela existe
    await prisma.$queryRaw`SELECT 1 FROM "ProductImage" LIMIT 1`
    return await operation()
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('🔧 Tabela ProductImage não existe, tentando criar...')
      
      try {
        // Tentar criar tabela dinamicamente
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "ProductImage" (
            id TEXT PRIMARY KEY,
            "productId" TEXT NOT NULL,
            url TEXT NOT NULL,
            "fileName" TEXT,
            "order" INTEGER DEFAULT 0,
            "isMain" BOOLEAN DEFAULT false,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "cloudinaryPublicId" TEXT,
            "fileSize" INTEGER,
            height INTEGER,
            "lastViewedAt" TIMESTAMP WITH TIME ZONE,
            "normalUrl" TEXT,
            "thumbnailUrl" TEXT,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "viewCount" INTEGER DEFAULT 0,
            width INTEGER,
            CONSTRAINT "ProductImage_productId_fkey" 
              FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE
          )
        `
        
        console.log('✅ Tabela ProductImage criada com sucesso')
        
        // Tentar novamente a operação
        return await operation()
      } catch (createError) {
        console.error('❌ Erro ao criar tabela ProductImage:', createError)
        throw new Error('Tabela ProductImage não existe e não foi possível criá-la automaticamente')
      }
    }
    throw error
  }
}

export async function ensureProductImageTable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1 FROM "ProductImage" LIMIT 1`
    console.log('✅ Tabela ProductImage encontrada')
    return true
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('⚠️ Tabela ProductImage não encontrada')
      return false
    }
    throw error
  }
}

export async function createProductImageTableIfNeeded(): Promise<void> {
  const tableExists = await ensureProductImageTable()
  
  if (!tableExists) {
    console.log('🔧 Criando tabela ProductImage...')
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ProductImage" (
        id TEXT PRIMARY KEY,
        "productId" TEXT NOT NULL,
        url TEXT NOT NULL,
        "fileName" TEXT,
        "order" INTEGER DEFAULT 0,
        "isMain" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "cloudinaryPublicId" TEXT,
        "fileSize" INTEGER,
        height INTEGER,
        "lastViewedAt" TIMESTAMP WITH TIME ZONE,
        "normalUrl" TEXT,
        "thumbnailUrl" TEXT,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "viewCount" INTEGER DEFAULT 0,
        width INTEGER,
        CONSTRAINT "ProductImage_productId_fkey" 
          FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE
      )
    `
    
    console.log('✅ Tabela ProductImage criada')
  }
}