import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Interface para dados de tracking
interface TrackingData {
  sessionId: string
  whatsapp?: string | null
  searchTerms?: string[]
  categoriesVisited?: Array<{
    name: string
    visits: number
    lastVisit: number
  }>
  productsViewed?: Array<{
    id: string
    name: string
    category: string
    visits: number
    lastView: number
  }>
  cartData?: {
    hasCart: boolean
    cartValue?: number
    cartItems?: number
  }
  status?: 'active' | 'abandoned' | 'completed'
  whatsappCollectedAt?: number | null
}

const VISITS_FILE = path.join(process.cwd(), 'data', 'visits-tracking.json')

// Função para garantir que o diretório existe
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Função para ler visitas do arquivo
function readVisitsFromFile(): any[] {
  ensureDataDirectory()
  
  if (!fs.existsSync(VISITS_FILE)) {
    return []
  }
  
  try {
    const data = fs.readFileSync(VISITS_FILE, 'utf8')
    const visits = JSON.parse(data)
    return Array.isArray(visits) ? visits : []
  } catch (error) {
    console.error('Erro ao ler arquivo de visitas:', error)
    return []
  }
}

// Função para salvar visitas no arquivo
function saveVisitsToFile(visits: any[]): boolean {
  ensureDataDirectory()
  
  try {
    console.log(`💾 Tentando salvar ${visits.length} visitas em: ${VISITS_FILE}`)
    
    // Verificar se o diretório existe
    const dataDir = path.dirname(VISITS_FILE)
    if (!fs.existsSync(dataDir)) {
      console.log(`📁 Criando diretório: ${dataDir}`)
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    // Verificar permissões de escrita
    try {
      fs.accessSync(dataDir, fs.constants.W_OK)
      console.log('✅ Permissão de escrita OK')
    } catch (permError) {
      console.error('❌ Erro de permissão:', permError)
      throw permError
    }
    
    const jsonData = JSON.stringify(visits, null, 2)
    console.log(`💾 JSON data size: ${jsonData.length} caracteres`)
    
    fs.writeFileSync(VISITS_FILE, jsonData)
    console.log('✅ Arquivo salvo com sucesso!')
    
    return true
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo de visitas:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  console.log('🔥 API /api/visits/track chamada!')
  
  try {
    const trackingData: TrackingData = await request.json()
    console.log('📊 Dados recebidos:', {
      sessionId: trackingData.sessionId,
      whatsapp: trackingData.whatsapp,
      status: trackingData.status,
      hasSearchTerms: !!trackingData.searchTerms?.length,
      hasCategoriesVisited: !!trackingData.categoriesVisited?.length,
      hasProductsViewed: !!trackingData.productsViewed?.length
    })
    
    if (!trackingData.sessionId) {
      return NextResponse.json({
        success: false,
        error: 'SessionId é obrigatório'
      }, { status: 400 })
    }
    
    // Ler visitas existentes
    console.log('📂 Lendo visitas existentes...')
    const visits = readVisitsFromFile()
    console.log(`📂 ${visits.length} visitas encontradas no arquivo`)
    
    // Procurar visita existente
    const existingVisitIndex = visits.findIndex(v => v.sessionId === trackingData.sessionId)
    
    const now = new Date()
    const visitData = {
      sessionId: trackingData.sessionId,
      whatsapp: trackingData.whatsapp || null,
      searchTerms: trackingData.searchTerms || [],
      categoriesVisited: trackingData.categoriesVisited || [],
      productsViewed: trackingData.productsViewed || [],
      hasCart: trackingData.cartData?.hasCart || false,
      cartValue: trackingData.cartData?.cartValue || null,
      cartItems: trackingData.cartData?.cartItems || null,
      status: trackingData.status || 'active',
      whatsappCollectedAt: trackingData.whatsappCollectedAt ? new Date(trackingData.whatsappCollectedAt) : null,
      lastActivity: now,
      updatedAt: now
    }
    
    if (existingVisitIndex >= 0) {
      // Atualizar visita existente
      visits[existingVisitIndex] = {
        ...visits[existingVisitIndex],
        ...visitData
      }
    } else {
      // Criar nova visita
      visits.push({
        ...visitData,
        startTime: now,
        createdAt: now
      })
    }
    
    // Salvar no arquivo
    console.log('💾 Salvando no arquivo...')
    const saveSuccess = saveVisitsToFile(visits)
    
    if (!saveSuccess) {
      console.error('❌ Falha ao salvar arquivo!')
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar dados de visita'
      }, { status: 500 })
    }
    
    // Verificar se arquivo foi realmente criado
    const filePath = path.join(process.cwd(), 'data', 'visits-tracking.json')
    const fileExists = require('fs').existsSync(filePath)
    console.log(`📁 Arquivo existe após salvamento: ${fileExists}`)
    
    if (fileExists) {
      const fileStats = require('fs').statSync(filePath)
      console.log(`📁 Tamanho do arquivo: ${fileStats.size} bytes`)
    }
    
    // Log para debug
    console.log('📊 Visit tracking updated:', {
      sessionId: trackingData.sessionId,
      whatsapp: trackingData.whatsapp,
      status: trackingData.status,
      hasCart: trackingData.cartData?.hasCart
    })
    
    return NextResponse.json({
      success: true,
      message: 'Tracking atualizado com sucesso'
    })
    
  } catch (error) {
    console.error('Erro ao processar tracking de visita:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// GET para obter dados de tracking de uma sessão específica
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'SessionId é obrigatório'
      }, { status: 400 })
    }
    
    const visits = readVisitsFromFile()
    const visit = visits.find(v => v.sessionId === sessionId)
    
    if (!visit) {
      return NextResponse.json({
        success: false,
        error: 'Visita não encontrada'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      visit
    })
    
  } catch (error) {
    console.error('Erro ao buscar tracking de visita:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}