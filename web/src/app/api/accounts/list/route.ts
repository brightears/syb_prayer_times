import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch accounts based on user role
    const accounts = await prisma.account.findMany({
      where: user.role === 'ADMIN' 
        ? { isActive: true }
        : { id: user.accountId!, isActive: true },
      select: {
        id: true,
        accountId: true,
        accountName: true,
      },
      orderBy: {
        accountName: 'asc',
      },
    })

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('List accounts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}