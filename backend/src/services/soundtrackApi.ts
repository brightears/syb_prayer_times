import { GraphQLClient, gql } from 'graphql-request';
import { env } from '../lib/env';
import logger from '../lib/logger';

const client = new GraphQLClient(env.SYB_API_URL, {
  headers: {
    Authorization: `Basic ${env.SYB_API_TOKEN}`,
  },
});

interface Zone {
  id: string;
  name: string;
  currentVolume?: number;
}

interface Account {
  id: string;
  name: string;
  zones: Zone[];
}

const GET_ACCOUNT_QUERY = gql`
  query GetAccount($accountId: String!) {
    account(id: $accountId) {
      id
      name
      zones {
        items {
          id
          name
        }
      }
    }
  }
`;

const GET_ZONE_VOLUME_QUERY = gql`
  query GetZoneVolume($zoneId: String!) {
    soundZone(id: $zoneId) {
      id
      name
      volume
    }
  }
`;

const SET_VOLUME_MUTATION = gql`
  mutation SetVolume($soundZone: String!, $volume: Int!) {
    setSoundZoneVolume(input: { soundZone: $soundZone, volume: $volume }) {
      soundZone {
        id
        volume
      }
    }
  }
`;

export async function getAccount(accountId: string): Promise<Account | null> {
  try {
    const data = await client.request(GET_ACCOUNT_QUERY, { accountId });
    
    if (data.account) {
      return {
        id: data.account.id,
        name: data.account.name,
        zones: data.account.zones.items.map((zone: any) => ({
          id: zone.id,
          name: zone.name,
        })),
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to fetch account', { error, accountId });
    return null;
  }
}

export async function getZoneVolume(zoneId: string): Promise<number | null> {
  try {
    const data = await client.request(GET_ZONE_VOLUME_QUERY, { zoneId });
    
    if (data.soundZone) {
      return data.soundZone.volume;
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to fetch zone volume', { error, zoneId });
    return null;
  }
}

export async function setZoneVolume(zoneId: string, volume: number): Promise<boolean> {
  try {
    const data = await client.request(SET_VOLUME_MUTATION, { 
      soundZone: zoneId, 
      volume: Math.max(0, Math.min(100, volume)) 
    });
    
    logger.info('Set zone volume', { 
      zoneId, 
      volume, 
      newVolume: data.setSoundZoneVolume?.soundZone?.volume 
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to set zone volume', { error, zoneId, volume });
    return false;
  }
}

export async function muteZone(zoneId: string): Promise<number | null> {
  const currentVolume = await getZoneVolume(zoneId);
  
  if (currentVolume !== null && currentVolume > 0) {
    const success = await setZoneVolume(zoneId, 0);
    return success ? currentVolume : null;
  }
  
  return currentVolume;
}

export async function unmuteZone(zoneId: string, restoreVolume: number): Promise<boolean> {
  return await setZoneVolume(zoneId, restoreVolume);
}