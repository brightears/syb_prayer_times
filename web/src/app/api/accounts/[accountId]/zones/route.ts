import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { GraphQLClient, gql } from 'graphql-request'

const GET_ZONES_QUERY = gql`
  query GetZones($accountId: ID!) {
    account(id: $accountId) {
      locations(first: 100) {
        edges {
          node {
            id
            name
            soundZones(first: 100) {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
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
    console.log('Fetching zones for account:', accountId)

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
      console.log('Fetching from SYB API with query:', GET_ZONES_QUERY)
      const data: any = await client.request(GET_ZONES_QUERY, { accountId })
      console.log('SYB API response:', JSON.stringify(data, null, 2))
      
      if (data.account?.locations?.edges) {
        const zones: any[] = []
        data.account.locations.edges.forEach((location: any) => {
          if (location.node?.soundZones?.edges) {
            location.node.soundZones.edges.forEach((zone: any) => {
              if (zone.node) {
                zones.push({
                  id: zone.node.id,
                  name: `${location.node.name} - ${zone.node.name}`,
                })
              }
            })
          }
        })
        return NextResponse.json({ zones })
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