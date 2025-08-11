import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const shippingCompanies = await prisma.shippingCompany.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(shippingCompanies)
  } catch (error) {
    console.error('Erro ao buscar transportadoras:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, logo, order } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const shippingCompany = await prisma.shippingCompany.create({
      data: {
        name,
        logo,
        order: order || 0
      }
    })

    return NextResponse.json(shippingCompany, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar transportadora:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma transportadora com este nome' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}