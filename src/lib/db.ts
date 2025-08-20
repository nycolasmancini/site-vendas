import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
    
    if (!databaseUrl) {
      throw new Error('Database URL not configured')
    }
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : undefined,
      max: 5, // Máximo de conexões no pool
      idleTimeoutMillis: 10000, // 10 segundos
      connectionTimeoutMillis: 5000, // 5 segundos
      statement_timeout: 30000, // 30 segundos timeout para queries
      query_timeout: 30000,
      application_name: 'pmcell-vendas',
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    })
    
    // Log de eventos do pool para debug
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })
    
    pool.on('connect', () => {
      console.log('New client connected to database')
    })
    
    pool.on('remove', () => {
      console.log('Client removed from pool')
    })
  }
  
  return pool
}

export async function query(text: string, params?: any[]) {
  const pool = getPool()
  const start = Date.now()
  
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount })
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Função para testar a conexão
export async function testConnection() {
  try {
    const result = await query('SELECT NOW()')
    console.log('Database connection test successful:', result.rows[0])
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

// Função para criar produto via SQL direto
export async function createProduct(productData: {
  name: string
  subname?: string | null
  description?: string | null
  brand?: string | null
  price: number
  superWholesalePrice?: number | null
  superWholesaleQuantity?: number | null
  cost?: number | null
  categoryId: string
  isModalProduct?: boolean
  quickAddIncrement?: number | null
}) {
  const {
    name,
    subname,
    description,
    brand,
    price,
    superWholesalePrice,
    superWholesaleQuantity,
    cost,
    categoryId,
    isModalProduct = false,
    quickAddIncrement
  } = productData

  // Gerar ID único
  const productId = `cm${Math.random().toString(36).substring(2, 15)}`
  
  const insertQuery = `
    INSERT INTO "Product" (
      "id", "name", "subname", "description", "brand", "price", 
      "superWholesalePrice", "superWholesaleQuantity", "cost", 
      "categoryId", "isModalProduct", "quickAddIncrement",
      "isActive", "featured", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    ) RETURNING *
  `
  
  const now = new Date()
  const params = [
    productId,
    name,
    subname,
    description,
    brand,
    price,
    superWholesalePrice,
    superWholesaleQuantity,
    cost,
    categoryId,
    isModalProduct,
    quickAddIncrement,
    true, // isActive
    false, // featured
    now, // createdAt
    now // updatedAt
  ]
  
  const result = await query(insertQuery, params)
  return result.rows[0]
}

// Função para criar imagem de produto via SQL direto
export async function createProductImage(imageData: {
  productId: string
  url: string
  fileName?: string | null
  order: number
  isMain: boolean
}) {
  const { productId, url, fileName, order, isMain } = imageData
  
  // Gerar ID único
  const imageId = `cm${Math.random().toString(36).substring(2, 15)}`
  
  const insertQuery = `
    INSERT INTO "ProductImage" (
      "id", "productId", "url", "fileName", "order", "isMain", "createdAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7
    ) RETURNING *
  `
  
  const params = [
    imageId,
    productId,
    url,
    fileName,
    order,
    isMain,
    new Date()
  ]
  
  const result = await query(insertQuery, params)
  return result.rows[0]
}

// Função para encontrar ou criar marca via SQL direto
export async function findOrCreateBrand(name: string) {
  // Primeiro tentar encontrar
  const findQuery = 'SELECT * FROM "Brand" WHERE "name" = $1'
  const findResult = await query(findQuery, [name])
  
  if (findResult.rows.length > 0) {
    return findResult.rows[0]
  }
  
  // Se não encontrou, criar
  const brandId = `cm${Math.random().toString(36).substring(2, 15)}`
  const insertQuery = `
    INSERT INTO "Brand" ("id", "name", "order", "createdAt") 
    VALUES ($1, $2, $3, $4) 
    RETURNING *
  `
  const params = [brandId, name, 0, new Date()]
  const result = await query(insertQuery, params)
  return result.rows[0]
}

// Função para encontrar ou criar modelo via SQL direto
export async function findOrCreateModel(name: string, brandId: string) {
  // Primeiro tentar encontrar
  const findQuery = 'SELECT * FROM "Model" WHERE "name" = $1 AND "brandId" = $2'
  const findResult = await query(findQuery, [name, brandId])
  
  if (findResult.rows.length > 0) {
    return findResult.rows[0]
  }
  
  // Se não encontrou, criar
  const modelId = `cm${Math.random().toString(36).substring(2, 15)}`
  const insertQuery = `
    INSERT INTO "Model" ("id", "name", "brandId", "createdAt") 
    VALUES ($1, $2, $3, $4) 
    RETURNING *
  `
  const params = [modelId, name, brandId, new Date()]
  const result = await query(insertQuery, params)
  return result.rows[0]
}

// Função para criar ProductModel via SQL direto
export async function createProductModel(data: {
  productId: string
  modelId: string
  price?: number | null
  superWholesalePrice?: number | null
}) {
  const { productId, modelId, price, superWholesalePrice } = data
  
  const productModelId = `cm${Math.random().toString(36).substring(2, 15)}`
  const insertQuery = `
    INSERT INTO "ProductModel" ("id", "productId", "modelId", "price", "superWholesalePrice", "createdAt") 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING *
  `
  const params = [productModelId, productId, modelId, price, superWholesalePrice, new Date()]
  const result = await query(insertQuery, params)
  return result.rows[0]
}

// Função para atualizar produto via SQL direto
export async function updateProduct(productId: string, data: {
  price?: number
  superWholesalePrice?: number | null
  superWholesaleQuantity?: number | null
}) {
  const { price, superWholesalePrice, superWholesaleQuantity } = data
  
  let setParts = []
  let params = []
  let paramIndex = 1
  
  if (price !== undefined) {
    setParts.push(`"price" = $${paramIndex}`)
    params.push(price)
    paramIndex++
  }
  
  if (superWholesalePrice !== undefined) {
    setParts.push(`"superWholesalePrice" = $${paramIndex}`)
    params.push(superWholesalePrice)
    paramIndex++
  }
  
  if (superWholesaleQuantity !== undefined) {
    setParts.push(`"superWholesaleQuantity" = $${paramIndex}`)
    params.push(superWholesaleQuantity)
    paramIndex++
  }
  
  setParts.push(`"updatedAt" = $${paramIndex}`)
  params.push(new Date())
  paramIndex++
  
  params.push(productId)
  
  const updateQuery = `
    UPDATE "Product" 
    SET ${setParts.join(', ')} 
    WHERE "id" = $${paramIndex} 
    RETURNING *
  `
  
  const result = await query(updateQuery, params)
  return result.rows[0]
}