import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { GraphQLClient, gql } from 'graphql-request'

const GET_ZONES_QUERY = gql`
  query GetZones($accountId: String!) {
    account(id: $accountId) {
      zones {
        items {
          id
          name
        }
      }
    }
  }
`

export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountId } = params

    // For now, return mock data since we're using test account
    if (accountId === '1' || accountId === 'test-account-001') {
      return NextResponse.json({
        zones: [
          { id: 'zone-1', name: 'Main Dining Area' },
          { id: 'zone-2', name: 'Lounge' },
          { id: 'zone-3', name: 'Outdoor Patio' },
        ],
      })
    }

    // In production, fetch from SYB API
    const client = new GraphQLClient(process.env.SYB_API_URL!, {
      headers: {
        Authorization: `Basic ${process.env.SYB_API_TOKEN}`,
      },
    })

    try {
      const data: any = await client.request(GET_ZONES_QUERY, { accountId })
      
      if (data.account?.zones?.items) {
        return NextResponse.json({
          zones: data.account.zones.items,
        })
      } else {
        return NextResponse.json({ zones: [] })
      }
    } catch (apiError) {
      console.error('SYB API error:', apiError)
      // Return empty zones on error
      return NextResponse.json({ zones: [] })
    }
  } catch (error) {
    console.error('Get zones error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}