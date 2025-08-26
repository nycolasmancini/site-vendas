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
function saveVisitsToFile(visits: any[]): void {
  ensureDataDirectory()
  
  try {
    fs.writeFileSync(VISITS_FILE, JSON.stringify(visits, null, 2))
  } catch (error) {
    console.error('Erro ao salvar arquivo de visitas:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const trackingData: TrackingData = await request.json()
    
    if (!trackingData.sessionId) {
      return NextResponse.json({
        success: false,
        error: 'SessionId é obrigatório'
      }, { status: 400 })
    }
    
    // Ler visitas existentes
    const visits = readVisitsFromFile()
    
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
    saveVisitsToFile(visits)
    
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