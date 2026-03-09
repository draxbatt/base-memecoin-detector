import { RetryClient } from '../utils/http-client';
import logger from '../utils/logger';
import { APIError, ValidationError } from '../utils/errors';

export interface TokenLaunch {
  contractAddress: string;
  name: string;
  symbol: string;
  launchTime: number;
  creatorAddress: string;
  initialLiquidity?: number;
  totalSupply?: string;
  source: 'clanker' | 'bankr';
}

export class ClankerScraper {
  private client: RetryClient;

  constructor(apiUrl: string) {
    this.client = new RetryClient(apiUrl);
  }

  async fetchLatestLaunches(limit: number = 20): Promise<TokenLaunch[]> {
    try {
      logger.debug('Fetching Clanker launches', { limit });
      
      // TODO: Replace with actual Clanker API endpoint
      // This is a placeholder that demonstrates the structure
      const response = await this.client.get('/launches', {
        params: { limit, chain: 'base', sort: 'newest' }
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new ValidationError('Invalid Clanker response format', { response: response.data });
      }

      return response.data.map((item: any) => ({
        contractAddress: item.token?.address || item.address,
        name: item.token?.name || item.name,
        symbol: item.token?.symbol || item.symbol,
        launchTime: item.launchTime || item.createdAt,
        creatorAddress: item.creator || item.deployer,
        initialLiquidity: item.initialLiquidity,
        totalSupply: item.totalSupply,
        source: 'clanker' as const,
      }));
    } catch (error: any) {
      throw new APIError('Failed to fetch Clanker launches', {
        error: error.message,
        endpoint: '/launches',
      });
    }
  }
}

export class BankrScraper {
  private client: RetryClient;

  constructor(apiUrl: string) {
    this.client = new RetryClient(apiUrl);
  }

  async fetchLatestLaunches(limit: number = 20): Promise<TokenLaunch[]> {
    try {
      logger.debug('Fetching Bankr launches', { limit });

      // TODO: Replace with actual Bankr API endpoint
      const response = await this.client.get('/new-tokens', {
        params: { limit, chain: 'base', sortBy: 'newest' }
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new ValidationError('Invalid Bankr response format', { response: response.data });
      }

      return response.data.map((item: any) => ({
        contractAddress: item.contractAddress || item.address,
        name: item.name,
        symbol: item.symbol,
        launchTime: item.launchTime || item.createdAt,
        creatorAddress: item.creatorAddress || item.deployer,
        initialLiquidity: item.liquidity,
        totalSupply: item.supply,
        source: 'bankr' as const,
      }));
    } catch (error: any) {
      throw new APIError('Failed to fetch Bankr launches', {
        error: error.message,
        endpoint: '/new-tokens',
      });
    }
  }
}
