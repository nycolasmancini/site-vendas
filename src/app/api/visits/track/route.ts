import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

// Função para salvar visita no banco de dados
async function saveVisitToDatabase(trackingData: TrackingData): Promise<boolean> {
  try {
    console.log('🗃️ Salvando visita no banco de dados...')
    
    const visitData = {
      sessionId: trackingData.sessionId,
      whatsapp: trackingData.whatsapp,
      searchTerms: JSON.stringify(trackingData.searchTerms || []),
      categoriesVisited: JSON.stringify(trackingData.categoriesVisited || []),
      productsViewed: JSON.stringify(trackingData.productsViewed || []),
      status: trackingData.status || 'active',
      hasCart: trackingData.cartData?.hasCart || false,
      cartValue: trackingData.cartData?.cartValue || null,
      cartItems: trackingData.cartData?.cartItems || null,
      lastActivity: new Date(),
      whatsappCollectedAt: trackingData.whatsappCollectedAt ? new Date(trackingData.whatsappCollectedAt) : null
    }
    
    const result = await prisma.visit.upsert({
      where: {
        sessionId: trackingData.sessionId
      },
      update: {
        ...visitData,
        updatedAt: new Date()
      },
      create: {
        ...visitData,
        startTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Visita salva no banco:', result.id)
    return true
    
  } catch (error) {
    console.error('❌ Erro ao salvar visita no banco:', error)
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
    
    // Salvar visita no banco de dados
    const saveSuccess = await saveVisitToDatabase(trackingData)
    
    if (!saveSuccess) {
      console.error('❌ Falha ao salvar no banco!')
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar dados de visita no banco'
      }, { status: 500 })
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
    
    const visit = await prisma.visit.findUnique({
      where: { sessionId }
    })
    
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