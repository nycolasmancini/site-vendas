import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteImageFromCloudinary } from '@/lib/cloudinary'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: productId, imageId } = await params
    const body = await request.json()
    const { action } = body

    if (action === 'set_main') {
      // Verificar se a imagem existe
      const image = await prisma.productImage.findFirst({
        where: { 
          id: imageId, 
          productId 
        }
      })

      if (!image) {
        return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
      }

      // Usar transação para garantir que apenas uma imagem seja principal
      await prisma.$transaction(async (tx) => {
        // Remover flag principal de todas as imagens do produto
        await tx.productImage.updateMany({
          where: { productId },
          data: { isMain: false }
        })

        // Definir a imagem atual como principal
        await tx.productImage.update({
          where: { id: imageId },
          data: { isMain: true }
        })
      })

      console.log(`✅ Imagem ${imageId} definida como principal para produto ${productId}`)

      return NextResponse.json({ message: 'Imagem principal atualizada com sucesso' })
    }

    if (action === 'reorder') {
      const { newOrder } = body

      await prisma.productImage.update({
        where: { id: imageId },
        data: { order: newOrder }
      })

      return NextResponse.json({ message: 'Ordem da imagem atualizada com sucesso' })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })

  } catch (error) {
    console.error('Erro ao atualizar imagem:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: productId, imageId } = await params

    // Verificar se a tabela ProductImage existe
    try {
      await prisma.$queryRaw`SELECT 1 FROM "ProductImage" LIMIT 1`
    } catch (tableError: any) {
      if (tableError.code === 'P2021') {
        console.error('❌ Tabela ProductImage não existe no banco de dados')
        return NextResponse.json({ 
          error: 'Sistema temporariamente indisponível. Tabela de imagens não encontrada.' 
        }, { status: 503 })
      }
      throw tableError
    }

    // Buscar a imagem e verificar se existe
    const image = await prisma.productImage.findFirst({
      where: { 
        id: imageId, 
        productId 
      }
    })

    if (!image) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
    }

    // Verificar se não é a última imagem do produto
    const imageCount = await prisma.productImage.count({
      where: { productId }
    })

    if (imageCount <= 1) {
      return NextResponse.json({ 
        error: 'Não é possível excluir a última imagem do produto' 
      }, { status: 400 })
    }

    let cloudinaryDeleted = false

    // Tentar excluir do Cloudinary se houver publicId (apenas para imagens novas)
    if (image.cloudinaryPublicId && !image.url.startsWith('data:')) {
      cloudinaryDeleted = await deleteImageFromCloudinary(image.cloudinaryPublicId)
      if (!cloudinaryDeleted) {
        console.warn(`⚠️ Falha ao excluir imagem do Cloudinary: ${image.cloudinaryPublicId}`)
      }
    } else if (image.url.startsWith('data:')) {
      // Imagem base64 antiga - apenas excluir do banco
      cloudinaryDeleted = true // Considerar como sucesso
      console.log('🗑️ Excluindo imagem base64 (sistema antigo)')
    }

    // Excluir do banco de dados
    await prisma.productImage.delete({
      where: { id: imageId }
    })

    // Se a imagem excluída era a principal, definir a primeira como principal
    if (image.isMain) {
      const firstImage = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { order: 'asc' }
      })

      if (firstImage) {
        await prisma.productImage.update({
          where: { id: firstImage.id },
          data: { isMain: true }
        })
      }
    }

    // Reordenar imagens restantes
    const remainingImages = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { order: 'asc' }
    })

    // Atualizar ordem sequencial
    await Promise.all(
      remainingImages.map((img, index) =>
        prisma.productImage.update({
          where: { id: img.id },
          data: { order: index }
        })
      )
    )

    console.log(`✅ Imagem ${imageId} excluída com sucesso. Cloudinary: ${cloudinaryDeleted}`)

    return NextResponse.json({ 
      message: 'Imagem excluída com sucesso',
      cloudinaryDeleted 
    })

  } catch (error: any) {
    console.error('Erro ao excluir imagem:', error)
    
    // Tratar erro específico de tabela não existente
    if (error.code === 'P2021') {
      console.error('❌ Tabela ProductImage não existe. Necessário sincronizar schema.')
      return NextResponse.json({ 
        error: 'Sistema temporariamente indisponível. Execute sincronização do banco.',
        code: 'TABLE_NOT_FOUND',
        suggestion: 'Acesse /api/db/sync para sincronizar o schema'
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { imageId } = await params
    const body = await request.json()
    const { action } = body

    if (action === 'view') {
      try {
        // Verificar se a imagem existe primeiro
        const imageExists = await prisma.productImage.findUnique({
          where: { id: imageId },
          select: { id: true, viewCount: true }
        })

        if (!imageExists) {
          console.warn(`Imagem ${imageId} não encontrada para analytics`)
          return NextResponse.json({ message: 'Imagem não encontrada' }, { status: 404 })
        }

        // Incrementar contador de visualização apenas se a imagem tem os campos necessários
        if (imageExists.viewCount !== undefined) {
          await prisma.productImage.update({
            where: { id: imageId },
            data: {
              viewCount: { increment: 1 },
              lastViewedAt: new Date()
            }
          })
          console.log(`📊 Analytics: Visualização registrada para imagem ${imageId}`)
        } else {
          console.warn(`Imagem ${imageId} não suporta analytics (schema antigo)`)
        }

        return NextResponse.json({ message: 'Visualização registrada' })
      } catch (prismaError: any) {
        // Tratar erro P2021 (tabela não existe) gracefully
        if (prismaError.code === 'P2021') {
          console.warn('Schema não suporta analytics ainda, ignorando...')
          return NextResponse.json({ message: 'Analytics não disponível' })
        }
        throw prismaError
      }
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })

  } catch (error) {
    console.error('Erro no PATCH da imagem:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}