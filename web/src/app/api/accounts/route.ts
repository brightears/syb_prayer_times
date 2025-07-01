import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createAccountSchema = z.object({
  accountId: z.string().min(1),
  accountName: z.string().min(1),
  isActive: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createAccountSchema.parse(body)

    // Check if account already exists
    const existing = await prisma.account.findUnique({
      where: { accountId: data.accountId },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Account already exists' },
        { status: 400 }
      )
    }

    // Create the account
    const account = await prisma.account.create({
      data: {
        accountId: data.accountId,
        accountName: data.accountName,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ account })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    console.error('Create account error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}