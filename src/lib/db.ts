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