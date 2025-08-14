import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, name, role, isActive } = body
    const userId = params.id

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Email, nome e tipo são obrigatórios' }, { status: 400 })
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(role)) {
      return NextResponse.json({ error: 'Tipo de usuário inválido' }, { status: 400 })
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o email já está em uso por outro usuário
    const emailInUse = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }
      }
    })

    if (emailInUse) {
      return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 })
    }

    // Preparar dados para atualização
    const updateData: any = {
      email,
      name,
      role,
      isActive: isActive !== undefined ? isActive : existingUser.isActive
    }

    // Se uma nova senha foi fornecida, criptografá-la
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const userId = params.id

    // Não permitir que o usuário delete a si mesmo
    if (session.user.id === userId) {
      return NextResponse.json({ error: 'Você não pode deletar sua própria conta' }, { status: 400 })
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}