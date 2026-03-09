import { ClankerScraper, ClankerToken } from '../src/scrapers/clanker';
import axios from 'axios';
import logger from '../src/utils/logger';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('ClankerScraper', () => {
  let scraper: ClankerScraper;
  let mockHttpClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock HTTP client
    mockHttpClient = {
      get: jest.fn(),
    };

    // Mock axios.create to return our mock client
    (mockedAxios.create as jest.Mock).mockReturnValue(mockHttpClient);
    
    scraper = new ClankerScraper();
  });

  describe('fetchLatestLaunches', () => {
    it('should fetch and parse valid tokens successfully', async () => {
      const mockTokens = [
        {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'TestToken',
          symbol: 'TEST',
          decimals: 18,
          totalSupply: '1000000000000000000000000',
          creator: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          launchTime: Date.now(),
        },
      ];

      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: mockTokens,
      });

      const result = await scraper.fetchLatestLaunches(10);

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe('0x1234567890abcdef1234567890abcdef12345678');
      expect(result[0].symbol).toBe('TEST');
    });

    it('should handle empty response', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: [],
      });

      const result = await scraper.fetchLatestLaunches();

      expect(result).toEqual([]);
    });

    it('should filter invalid tokens', async () => {
      const mockData = [
        {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'ValidToken',
          symbol: 'VALID',
          decimals: 18,
        },
        {
          symbol: 'INVALID',
        },
        {
          address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          name: 'AnotherValid',
          symbol: 'VALID2',
        },
      ];

      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: mockData,
      });

      const result = await scraper.fetchLatestLaunches();

      expect(result).toHaveLength(2);
      expect(result.every((token: ClankerToken) => token.address && token.name && token.symbol)).toBe(true);
    });

    it('should return empty array on API error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      const result = await scraper.fetchLatestLaunches();

      expect(result).toEqual([]);
    });
  });

  describe('getTokenDetails', () => {
    it('should fetch and parse token details', async () => {
      const tokenAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const mockToken = {
        address: tokenAddress,
        name: 'DetailedToken',
        symbol: 'DETAIL',
        decimals: 18,
        totalSupply: '1000000',
        creator: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        launchTime: Date.now(),
      };

      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: mockToken,
      });

      const result = await scraper.getTokenDetails(tokenAddress);

      expect(result).not.toBeNull();
      expect(result?.address).toBe(tokenAddress);
      expect(result?.name).toBe('DetailedToken');
    });

    it('should return null for invalid address format', async () => {
      const result = await scraper.getTokenDetails('invalid-address');

      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      const tokenAddress = '0x1234567890abcdef1234567890abcdef12345678';
      mockHttpClient.get.mockRejectedValue(new Error('API error'));

      const result = await scraper.getTokenDetails(tokenAddress);

      expect(result).toBeNull();
    });

    it('should accept addresses without 0x prefix', async () => {
      const tokenAddress = '1234567890abcdef1234567890abcdef12345678';
      const mockToken = {
        address: '0x' + tokenAddress,
        name: 'Token',
        symbol: 'TKN',
        decimals: 18,
      };

      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: mockToken,
      });

      const result = await scraper.getTokenDetails(tokenAddress);

      expect(result).not.toBeNull();
    });
  });

  describe('getTokenMetadata', () => {
    it('should fetch token metadata successfully', async () => {
      const tokenAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const mockMetadata = {
        twitter: 'https://twitter.com/testtoken',
        telegram: 'https://t.me/testtoken',
        website: 'https://testtoken.com',
      };

      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: mockMetadata,
      });

      const result = await scraper.getTokenMetadata(tokenAddress);

      expect(result).toEqual(mockMetadata);
    });

    it('should return null for invalid address', async () => {
      const result = await scraper.getTokenMetadata('not-an-address');

      expect(result).toBeNull();
    });

    it('should return null on metadata fetch error', async () => {
      const tokenAddress = '0x1234567890abcdef1234567890abcdef12345678';
      mockHttpClient.get.mockRejectedValue(new Error('Metadata API error'));

      const result = await scraper.getTokenMetadata(tokenAddress);

      expect(result).toBeNull();
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 200,
      });

      const result = await scraper.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when health check fails', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Health check failed'));

      const result = await scraper.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false on non-200 status', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 503,
      });

      const result = await scraper.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('address validation', () => {
    it('should validate proper Ethereum addresses', async () => {
      const validAddresses = [
        '0x1234567890abcdef1234567890abcdef12345678',
        '0xAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCd',
        '1234567890abcdef1234567890abcdef12345678',
      ];

      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: { address: '0x1234567890abcdef1234567890abcdef12345678', name: 'Test', symbol: 'TEST' },
      });

      for (const addr of validAddresses) {
        const result = await scraper.getTokenDetails(addr);
        expect(result).not.toBeNull();
      }
    });

    it('should reject invalid addresses', async () => {
      const invalidAddresses = [
        'invalid',
        '0xtooshort',
        '0x1234567890abcdef1234567890abcdef1234567',
        '',
      ];

      for (const addr of invalidAddresses) {
        const result = await scraper.getTokenDetails(addr);
        expect(result).toBeNull();
      }
    });
  });

  describe('token response parsing', () => {
    it('should normalize token response with alternative field names', async () => {
      const mockToken = {
        tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'AlternativeToken',
        symbol: 'ALT',
        deployer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        created_at: 1234567890,
        market_cap: 100000,
      };

      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: mockToken,
      });

      const result = await scraper.getTokenDetails('0x1234567890abcdef1234567890abcdef12345678');

      expect(result?.address).toBe('0x1234567890abcdef1234567890abcdef12345678');
      expect(result?.creator).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
      expect(result?.launchTime).toBe(1234567890);
      expect(result?.marketCap).toBe(100000);
    });

    it('should set default values for missing fields', async () => {
      const mockToken = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'MinimalToken',
        symbol: 'MIN',
      };

      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: mockToken,
      });

      const result = await scraper.getTokenDetails('0x1234567890abcdef1234567890abcdef12345678');

      expect(result?.decimals).toBe(18);
      expect(result?.totalSupply).toBe('0');
      expect(result?.creator).toBe('');
      expect(result?.launchTime).toBe(0);
    });
  });

  describe('retry and backoff logic', () => {
    it('should retry on transient failures', async () => {
      mockHttpClient.get = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          status: 200,
          data: [
            {
              address: '0x1234567890abcdef1234567890abcdef12345678',
              name: 'Test',
              symbol: 'TEST',
            },
          ],
        });

      const result = await scraper.fetchLatestLaunches(1);

      expect(result).toHaveLength(1);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retry attempts', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Persistent error'));

      const result = await scraper.fetchLatestLaunches(1);

      expect(result).toEqual([]);
    });
  });
});
