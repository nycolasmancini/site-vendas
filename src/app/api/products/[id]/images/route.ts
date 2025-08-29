import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadImageToCloudinary, validateImage } from '@/lib/cloudinary'
import { fileToBuffer, generateUniqueFileName } from '@/lib/image-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Buscar todas as imagens do produto ordenadas
    const images = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: [
        { isMain: 'desc' },  // Imagem principal primeiro
        { order: 'asc' }     // Depois por ordem
      ]
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Erro ao buscar imagens:', error)
    return NextResponse.json({ error: 'Falha ao buscar imagens' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Verificar limite de 4 imagens
    if (product.images.length >= 4) {
      return NextResponse.json({ 
        error: 'Produto já possui o máximo de 4 imagens' 
      }, { status: 400 })
    }

    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 })
    }

    // Verificar se não excederá o limite
    if (product.images.length + files.length > 4) {
      return NextResponse.json({ 
        error: `Máximo 4 imagens por produto. Você pode adicionar apenas ${4 - product.images.length} imagem(ns)` 
      }, { status: 400 })
    }

    const uploadedImages: any[] = []

    // Processar cada imagem
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validar imagem
      const validation = validateImage(file)
      if (!validation.valid) {
        return NextResponse.json({ 
          error: `Imagem ${i + 1}: ${validation.error}` 
        }, { status: 400 })
      }

      try {
        // Converter para buffer
        const buffer = await fileToBuffer(file)
        const uniqueFileName = generateUniqueFileName(file.name)

        // Upload para Cloudinary
        const cloudinaryResult = await uploadImageToCloudinary(buffer, uniqueFileName)

        // Determinar ordem e se é principal
        const currentOrder = product.images.length + i
        const isMain = product.images.length === 0 && i === 0 // Primeira imagem é principal se não há outras

        // Salvar no banco de dados
        const image = await prisma.productImage.create({
          data: {
            productId,
            url: cloudinaryResult.secure_url,
            fileName: file.name,
            order: currentOrder,
            isMain,
            // Metadados adicionais
            cloudinaryPublicId: cloudinaryResult.public_id,
            thumbnailUrl: cloudinaryResult.thumbnailUrl,
            normalUrl: cloudinaryResult.normalUrl,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            fileSize: cloudinaryResult.bytes
          }
        })

        uploadedImages.push(image)

        console.log(`✅ Imagem ${i + 1} uploaded:`, {
          fileName: file.name,
          publicId: cloudinaryResult.public_id,
          size: cloudinaryResult.bytes,
          isMain
        })

      } catch (uploadError) {
        console.error(`Erro no upload da imagem ${i + 1}:`, uploadError)
        return NextResponse.json({ 
          error: `Erro no upload da imagem ${i + 1}: ${uploadError instanceof Error ? uploadError.message : 'Erro desconhecido'}` 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      message: `${uploadedImages.length} imagem(ns) adicionada(s) com sucesso`,
      images: uploadedImages
    })

  } catch (error) {
    console.error('Erro no endpoint de upload:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}