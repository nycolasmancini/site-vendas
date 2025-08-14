import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      sessionId,
      whatsapp,
      cartData,
      analyticsData,
      lastActivity
    } = body

    if (!sessionId || !cartData) {
      return NextResponse.json(
        { error: 'sessionId e cartData são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se carrinho tem itens
    const hasItems = cartData.items && cartData.items.length > 0
    
    if (!hasItems) {
      // Se carrinho está vazio, remover registro se existir
      await prisma.abandonedCart.deleteMany({
        where: { sessionId }
      })
      
      return NextResponse.json({ 
        message: 'Carrinho vazio removido',
        removed: true 
      })
    }

    // Salvar ou atualizar carrinho abandonado
    const abandonedCart = await prisma.abandonedCart.upsert({
      where: { sessionId },
      update: {
        whatsapp: whatsapp || null,
        cartData,
        analyticsData: analyticsData || null,
        lastActivity: new Date(lastActivity || Date.now()),
        webhookSent: false, // Reset webhook se carrinho foi modificado
        webhookSentAt: null,
        updatedAt: new Date()
      },
      create: {
        sessionId,
        whatsapp: whatsapp || null,
        cartData,
        analyticsData: analyticsData || null,
        lastActivity: new Date(lastActivity || Date.now()),
        webhookSent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log(`🛒 Server: Carrinho salvo para sessionId: ${sessionId}`)
    console.log(`🛒 Server: ${cartData.items.length} itens, lastActivity: ${new Date(lastActivity || Date.now()).toLocaleTimeString()}`)

    return NextResponse.json({
      message: 'Carrinho salvo no servidor',
      id: abandonedCart.id,
      saved: true
    })

  } catch (error) {
    console.error('❌ Erro ao salvar carrinho no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId é obrigatório' },
        { status: 400 }
      )
    }

    const abandonedCart = await prisma.abandonedCart.findUnique({
      where: { sessionId }
    })

    if (!abandonedCart) {
      return NextResponse.json({ found: false, cart: null })
    }

    return NextResponse.json({
      found: true,
      cart: {
        id: abandonedCart.id,
        sessionId: abandonedCart.sessionId,
        whatsapp: abandonedCart.whatsapp,
        cartData: abandonedCart.cartData,
        analyticsData: abandonedCart.analyticsData,
        lastActivity: abandonedCart.lastActivity,
        webhookSent: abandonedCart.webhookSent,
        webhookSentAt: abandonedCart.webhookSentAt
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar carrinho:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}