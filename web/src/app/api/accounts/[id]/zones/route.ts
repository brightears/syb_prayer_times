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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = params.id
    console.log('Zones API called for account:', accountId)

    // Always log incoming request
    console.log('Request received at zones API, account ID:', accountId)
    
    // For now, return mock data since we're using test account
    if (accountId === '1' || accountId === 'test-account-001') {
      console.log('Returning mock data for test account')
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
      console.log('Fetching zones for account ID:', accountId)
      const data: any = await client.request(GET_ZONES_QUERY, { accountId })
      console.log('SYB API response:', JSON.stringify(data, null, 2))
      
      const zones: any[] = []
      
      if (data.account?.locations?.edges) {
        console.log('Locations found:', data.account.locations.edges.length)
        data.account.locations.edges.forEach((location: any) => {
          if (location.node?.soundZones?.edges) {
            console.log(`Location ${location.node.name} has ${location.node.soundZones.edges.length} zones`)
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
      }
      
      console.log('Total zones found:', zones.length)
      return NextResponse.json({ zones })
    } catch (apiError: any) {
      console.error('SYB API error:', apiError)
      console.error('Error details:', apiError.response || apiError.message)
      
      // If direct account query fails, try the me query approach
      try {
        console.log('Trying alternative query through me endpoint')
        const meQuery = gql`
          query GetZones {
            me {
              ...on PublicAPIClient {
                accounts(first: 100) {
                  edges {
                    node {
                      id
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
                }
              }
            }
          }
        `
        
        const meData: any = await client.request(meQuery)
        console.log('Me query response:', JSON.stringify(meData, null, 2))
        
        if (meData.me?.accounts?.edges) {
          const zones: any[] = []
          const accountEdge = meData.me.accounts.edges.find((edge: any) => 
            edge.node?.id === accountId
          )
          
          if (accountEdge?.node?.locations?.edges) {
            accountEdge.node.locations.edges.forEach((location: any) => {
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
          }
          
          return NextResponse.json({ zones })
        }
        
        return NextResponse.json({ zones: [] })
      } catch (fallbackError: any) {
        console.error('Fallback query also failed:', fallbackError)
        return NextResponse.json({ zones: [] })
      }
    }
  } catch (error) {
    console.error('Get zones error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}