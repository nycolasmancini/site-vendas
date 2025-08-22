import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Em produção, usar conexão direta
    if (process.env.NODE_ENV === 'production') {
      const { Pool } = require('pg')
      const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
      
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      })

      try {
        const result = await pool.query(`
          SELECT s.*, 
                 COUNT(ps.id)::integer as products_count
          FROM "Supplier" s
          LEFT JOIN "ProductSupplier" ps ON s.id = ps."supplierId" AND ps."isActive" = true
          WHERE s.id = $1
          GROUP BY s.id
        `, [id])
        
        if (result.rows.length === 0) {
          return NextResponse.json(
            { error: 'Fornecedor não encontrado' },
            { status: 404 }
          )
        }

        return NextResponse.json(result.rows[0])
      } finally {
        await pool.end()
      }
    }

    // Em desenvolvimento, usar Prisma
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                isActive: true
              }
            }
          }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado' },
        { status: 404 }
      )
    }

    // Adicionar contagem de produtos
    const supplierWithCount = {
      ...supplier,
      products_count: supplier.products.length
    }

    return NextResponse.json(supplierWithCount)
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // Em produção, usar conexão direta
    if (process.env.NODE_ENV === 'production') {
      const { Pool } = require('pg')
      const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
      
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      })

      try {
        const result = await pool.query(`
          UPDATE "Supplier" 
          SET name = $2, phone = $3, address = $4, email = $5, notes = $6, "updatedAt" = NOW()
          WHERE id = $1 AND "isActive" = true
          RETURNING *
        `, [
          id,
          data.name,
          data.phone || null,
          data.address || null,
          data.email || null,
          data.notes || null
        ])

        if (result.rows.length === 0) {
          return NextResponse.json(
            { error: 'Fornecedor não encontrado' },
            { status: 404 }
          )
        }

        return NextResponse.json(result.rows[0])
      } finally {
        await pool.end()
      }
    }

    // Em desenvolvimento, usar Prisma
    const supplier = await prisma.supplier.update({
      where: { 
        id,
        isActive: true
      },
      data: {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        email: data.email || null,
        notes: data.notes || null,
      }
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Em produção, usar conexão direta
    if (process.env.NODE_ENV === 'production') {
      const { Pool } = require('pg')
      const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
      
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      })

      try {
        // Verificar se há produtos associados
        const productsCheck = await pool.query(`
          SELECT COUNT(*) as count 
          FROM "ProductSupplier" 
          WHERE "supplierId" = $1 AND "isActive" = true
        `, [id])

        if (parseInt(productsCheck.rows[0].count) > 0) {
          return NextResponse.json(
            { error: 'Não é possível excluir fornecedor com produtos associados. Desative-o primeiro.' },
            { status: 400 }
          )
        }

        // Marcar como inativo em vez de deletar
        const result = await pool.query(`
          UPDATE "Supplier" 
          SET "isActive" = false, "updatedAt" = NOW()
          WHERE id = $1
          RETURNING *
        `, [id])

        if (result.rows.length === 0) {
          return NextResponse.json(
            { error: 'Fornecedor não encontrado' },
            { status: 404 }
          )
        }

        return NextResponse.json({ message: 'Fornecedor desativado com sucesso' })
      } finally {
        await pool.end()
      }
    }

    // Em desenvolvimento, usar Prisma
    // Verificar se há produtos associados
    const activeProducts = await prisma.productSupplier.count({
      where: {
        supplierId: id,
        isActive: true
      }
    })

    if (activeProducts > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir fornecedor com produtos associados. Desative-o primeiro.' },
        { status: 400 }
      )
    }

    // Marcar como inativo em vez de deletar
    await prisma.supplier.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Fornecedor desativado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // Em produção, usar conexão direta
    if (process.env.NODE_ENV === 'production') {
      const { Pool } = require('pg')
      const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
      
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      })

      try {
        const result = await pool.query(`
          UPDATE "Supplier" 
          SET "isActive" = $2, "updatedAt" = NOW()
          WHERE id = $1
          RETURNING *
        `, [id, data.isActive])

        if (result.rows.length === 0) {
          return NextResponse.json(
            { error: 'Fornecedor não encontrado' },
            { status: 404 }
          )
        }

        return NextResponse.json(result.rows[0])
      } finally {
        await pool.end()
      }
    }

    // Em desenvolvimento, usar Prisma
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: data.isActive }
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Erro ao alterar status do fornecedor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}