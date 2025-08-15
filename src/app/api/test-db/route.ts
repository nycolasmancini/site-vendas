import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  let prisma: PrismaClient | null = null
  
  try {
    console.log('Testing database connection...')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('DIRECT_URL exists:', !!process.env.DIRECT_URL)
    
    // Try with DIRECT_URL first
    let url = process.env.DIRECT_URL
    if (!url) {
      url = process.env.DATABASE_URL
    }
    
    console.log('Using URL type:', url?.includes('pooler') ? 'POOLED' : 'DIRECT')
    
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: url,
        },
      },
    })

    // Test connection
    await prisma.$connect()
    console.log('Connected successfully')

    // Try to create a simple table test
    await prisma.$executeRaw`SELECT 1 as test`
    console.log('Query executed successfully')

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `
    
    console.log('Existing tables:', tables)

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      url_type: url?.includes('pooler') ? 'POOLED' : 'DIRECT',
      tables: tables
    })

  } catch (error) {
    console.error('Database connection failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      url_type: process.env.DIRECT_URL?.includes('pooler') ? 'POOLED' : 'DIRECT'
    }, { status: 500 })
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}