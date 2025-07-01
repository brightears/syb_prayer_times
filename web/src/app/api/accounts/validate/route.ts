import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { GraphQLClient, gql } from 'graphql-request'
import { z } from 'zod'

const validateSchema = z.object({
  accountId: z.string().min(1),
})

const GET_ACCOUNT_QUERY = gql`
  query GetAccountInfo($accountId: ID!) {
    account(id: $accountId) {
      businessName
    }
  }
`

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accountId } = validateSchema.parse(body)

    // Try to fetch account from SYB API
    const client = new GraphQLClient(process.env.SYB_API_URL!, {
      headers: {
        Authorization: `Basic ${process.env.SYB_API_TOKEN}`,
      },
    })

    try {
      const data: any = await client.request(GET_ACCOUNT_QUERY, { accountId })
      
      if (data.account) {
        return NextResponse.json({
          valid: true,
          accountName: data.account.businessName,
        })
      } else {
        return NextResponse.json({
          valid: false,
          message: 'Account not found',
        })
      }
    } catch (apiError) {
      console.error('SYB API error:', apiError)
      return NextResponse.json({
        valid: false,
        message: 'Failed to validate with SYB API',
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    console.error('Validate account error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}