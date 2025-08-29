import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const body = await request.json()
    const { imageOrder } = body

    // Validar entrada
    if (!Array.isArray(imageOrder)) {
      return NextResponse.json({ 
        error: 'imageOrder deve ser um array de IDs de imagens' 
      }, { status: 400 })
    }

    // Verificar se todas as imagens pertencem ao produto
    const productImages = await prisma.productImage.findMany({
      where: { productId }
    })

    const productImageIds = productImages.map(img => img.id)
    const hasInvalidId = imageOrder.some(id => !productImageIds.includes(id))

    if (hasInvalidId) {
      return NextResponse.json({ 
        error: 'Uma ou mais imagens não pertencem a este produto' 
      }, { status: 400 })
    }

    // Atualizar ordem das imagens usando transação
    await prisma.$transaction(
      imageOrder.map((imageId: string, index: number) =>
        prisma.productImage.update({
          where: { id: imageId },
          data: { order: index }
        })
      )
    )

    console.log(`✅ Ordem das imagens reordenada para produto ${productId}:`, imageOrder)

    return NextResponse.json({ 
      message: 'Ordem das imagens atualizada com sucesso',
      newOrder: imageOrder
    })

  } catch (error) {
    console.error('Erro ao reordenar imagens:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}