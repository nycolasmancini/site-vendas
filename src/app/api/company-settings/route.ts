import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let settings = await prisma.companySettings.findFirst()
    
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'PMCELL',
          primaryColor: '#FC6D36',
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const logoFile = formData.get('logo') as File

    if (!logoFile) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Verificar tipo de arquivo
    if (!logoFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Arquivo deve ser uma imagem' }, { status: 400 })
    }

    // Converter para base64
    const bytes = await logoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Logo = `data:${logoFile.type};base64,${buffer.toString('base64')}`

    // Buscar ou criar configurações da empresa
    let settings = await prisma.companySettings.findFirst()
    
    if (settings) {
      // Atualizar existente
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: { logo: base64Logo }
      })
    } else {
      // Criar novo registro
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'PMCELL',
          primaryColor: '#FC6D36',
          logo: base64Logo
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}