import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function generateOrderNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${year}${month}${day}${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer, items, notes } = body

    // Validar WhatsApp brasileiro
    const whatsappRegex = /^55\d{10,11}$/
    const cleanWhatsapp = customer.whatsapp.replace(/\D/g, '')
    
    if (!whatsappRegex.test(cleanWhatsapp)) {
      return NextResponse.json(
        { error: 'WhatsApp inválido. Use o formato brasileiro com DDD.' },
        { status: 400 }
      )
    }

    // Buscar ou criar cliente
    let dbCustomer = await prisma.customer.findUnique({
      where: { whatsapp: cleanWhatsapp }
    })

    if (!dbCustomer) {
      dbCustomer = await prisma.customer.create({
        data: {
          name: customer.name,
          whatsapp: cleanWhatsapp,
          email: customer.email,
          company: customer.company,
          cnpj: customer.cnpj
        }
      })
    } else {
      // Atualizar última atividade
      await prisma.customer.update({
        where: { id: dbCustomer.id },
        data: { lastAccess: new Date() }
      })
    }

    // Calcular totais
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { 
          id: item.productId,
          isActive: true
        }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Produto ${item.productId} não encontrado ou indisponível` },
          { status: 400 }
        )
      }

      // Determinar preço baseado na quantidade
      let unitPrice = product.price
      if (product.specialQuantity && item.quantity >= product.specialQuantity && product.specialPrice) {
        unitPrice = product.specialPrice
      }

      const totalPrice = unitPrice * item.quantity
      subtotal += totalPrice

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        modelName: item.modelName,
        quantity: item.quantity,
        unitPrice,
        totalPrice
      })
    }

    // Criar pedido
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: dbCustomer.id,
        subtotal,
        total: subtotal,
        notes,
        items: {
          create: orderItems
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Criar log do webhook para N8N processar
    await prisma.webhookLog.create({
      data: {
        eventType: 'ORDER_CREATED',
        orderId: order.id,
        payload: order as any,
        success: false
      }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (customerId) {
      where.customerId = customerId
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}