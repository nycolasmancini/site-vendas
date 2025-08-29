import { NextRequest, NextResponse } from 'next/server'

interface WebhookSetting {
  webhookType: string
  enabled: boolean
  environment: string
}

export async function GET(request: NextRequest) {
  try {
    // Detectar ambiente baseado no hostname e outras variáveis
    const host = request.headers.get('host') || 'localhost'
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    
    // Determinar se é desenvolvimento ou produção
    const isDevelopment = host.includes('localhost') || 
                         host.includes('127.0.0.1') || 
                         host.includes(':300') ||
                         process.env.NODE_ENV === 'development'
    
    const environment = isDevelopment ? 'test' : 'production'
    
    console.log('🔧 Webhook Settings: Detectando ambiente...', {
      host,
      environment,
      nodeEnv: process.env.NODE_ENV
    })

    // Configurações padrão baseadas no ambiente
    const settings: WebhookSetting[] = [
      {
        webhookType: 'whatsappCollected',
        enabled: !isDevelopment, // Ativo apenas em produção
        environment: environment
      },
      {
        webhookType: 'orderCompleted', 
        enabled: !isDevelopment, // Ativo apenas em produção
        environment: environment
      },
      {
        webhookType: 'cartAbandoned',
        enabled: !isDevelopment, // Ativo apenas em produção
        environment: environment
      },
      {
        webhookType: 'analyticsUpdate',
        enabled: false, // Desabilitado por enquanto
        environment: environment
      }
    ]

    console.log('🔧 Webhook Settings: Configurações retornadas:', settings)

    return NextResponse.json(settings, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao buscar configurações de webhook:', error)
    
    // Retornar configurações de fallback em caso de erro
    const fallbackSettings: WebhookSetting[] = [
      {
        webhookType: 'whatsappCollected',
        enabled: false,
        environment: 'test'
      },
      {
        webhookType: 'orderCompleted',
        enabled: false, 
        environment: 'test'
      },
      {
        webhookType: 'cartAbandoned',
        enabled: false,
        environment: 'test'
      },
      {
        webhookType: 'analyticsUpdate',
        enabled: false,
        environment: 'test'
      }
    ]

    return NextResponse.json(fallbackSettings, { status: 200 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}