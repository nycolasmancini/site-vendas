import { NextRequest, NextResponse } from 'next/server'

interface AnalyticsData {
  sessionId: string
  whatsapp?: string
  timeOnSite?: number
  categoriesVisited?: any[]
  searchTerms?: any[]
  productsViewed?: any[]
  cartEvents?: any[]
  lastActivity?: number
  [key: string]: any
}

export async function POST(request: NextRequest) {
  try {
    const data: AnalyticsData = await request.json()
    
    // Validação básica dos dados
    if (!data.sessionId) {
      return NextResponse.json(
        { error: 'sessionId é obrigatório' },
        { status: 400 }
      )
    }

    // Log dos dados recebidos para debug
    console.log('📊 Analytics Track: Dados recebidos:', {
      sessionId: data.sessionId,
      whatsapp: data.whatsapp || 'não fornecido',
      timeOnSite: data.timeOnSite || 0,
      categoriesCount: data.categoriesVisited?.length || 0,
      searchTermsCount: data.searchTerms?.length || 0,
      productsViewedCount: data.productsViewed?.length || 0,
      cartEventsCount: data.cartEvents?.length || 0
    })

    // Aqui poderia salvar os dados em um banco de dados
    // Por enquanto, apenas logamos e retornamos sucesso
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Dados de analytics recebidos com sucesso',
        sessionId: data.sessionId 
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('❌ Erro ao processar dados de analytics:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}