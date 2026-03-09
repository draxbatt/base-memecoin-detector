import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

/**
 * Clanker API Response Types
 */
export interface ClankerToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  creator: string;
  launchTime: number;
  launchTx?: string;
  marketCap?: number;
  holders?: number;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    website?: string;
    discord?: string;
  };
}

/**
 * Rate limiter for API calls
 */
class RateLimiter {
  private requestTimes: number[] = [];
  private maxRequests: number;
  private timeWindow: number; // milliseconds

  constructor(maxRequests: number = 100, timeWindowSeconds: number = 60) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowSeconds * 1000;
  }

  /**
   * Check if request is allowed and update state
   */
  async checkAndWait(): Promise<void> {
    const now = Date.now();
    // Remove old request timestamps outside the window
    this.requestTimes = this.requestTimes.filter(time => now - time < this.timeWindow);

    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.timeWindow - (now - oldestRequest) + 100; // Add 100ms buffer
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.checkAndWait(); // Recursive call to recheck
      }
    }

    this.requestTimes.push(now);
  }
}

/**
 * Clanker Scraper
 * Fetches memecoin launch data from Clanker platform (Base chain)
 * 
 * API Rate Limit: 100 requests per minute
 * Implements exponential backoff retry logic with jitter
 */
export class ClankerScraper {
  private baseURL = 'https://api.clanker.wtf/api';
  private httpClient: AxiosInstance;
  private rateLimiter: RateLimiter;
  private retryConfig = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 8000,
    backoffMultiplier: 2,
  };

  constructor() {
    this.rateLimiter = new RateLimiter(100, 60); // 100 req/min

    // Configure axios instance with defaults
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MemecoinBot/1.0',
      },
    });
  }

  /**
   * Fetch latest launched memecoins from Clanker
   * @param limit - Number of tokens to fetch (default 50, max 100)
   * @returns Array of ClankerToken objects
   */
  async fetchLatestLaunches(limit: number = 50): Promise<ClankerToken[]> {
    if (limit > 100) limit = 100;
    if (limit < 1) limit = 1;

    try {
      logger.info(`Fetching latest ${limit} launches from Clanker`);
      const response = await this.makeRequest('/tokens/recent', { limit });

      if (!Array.isArray(response)) {
        logger.warn('Clanker returned non-array response, defaulting to empty array');
        return [];
      }

      const validated = response
        .filter(token => this.isValidToken(token))
        .map(token => this.parseTokenResponse(token));

      logger.info(`Successfully fetched ${validated.length} valid tokens from Clanker`);
      return validated;
    } catch (error) {
      logger.error('Failed to fetch latest launches from Clanker', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get detailed information about a specific token
   * @param tokenAddress - Token contract address on Base
   * @returns Token details or null if fetch fails
   */
  async getTokenDetails(tokenAddress: string): Promise<ClankerToken | null> {
    if (!this.isValidAddress(tokenAddress)) {
      logger.warn('Invalid token address provided', { address: tokenAddress });
      return null;
    }

    try {
      logger.debug(`Fetching details for token ${tokenAddress}`);
      const response = await this.makeRequest(`/token/${tokenAddress}`);
      
      if (!this.isValidToken(response)) {
        logger.warn('Clanker returned invalid token data', { address: tokenAddress });
        return null;
      }

      return this.parseTokenResponse(response);
    } catch (error) {
      logger.error('Failed to fetch token details', {
        address: tokenAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get token metadata including social links
   * @param tokenAddress - Token contract address
   * @returns Metadata object or null if fetch fails
   */
  async getTokenMetadata(tokenAddress: string): Promise<Record<string, any> | null> {
    if (!this.isValidAddress(tokenAddress)) {
      logger.warn('Invalid token address for metadata fetch', { address: tokenAddress });
      return null;
    }

    try {
      logger.debug(`Fetching metadata for token ${tokenAddress}`);
      const response = await this.makeRequest(`/token/${tokenAddress}/metadata`);
      return response || null;
    } catch (error) {
      logger.error('Failed to fetch token metadata', {
        address: tokenAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Make HTTP request with rate limiting, retry logic, and exponential backoff
   * @param endpoint - API endpoint (without base URL)
   * @param params - Query parameters
   * @returns Response data
   */
  private async makeRequest(endpoint: string, params?: Record<string, any>): Promise<any> {
    // Apply rate limiting
    await this.rateLimiter.checkAndWait();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
      try {
        logger.debug(`Clanker API request`, {
          endpoint,
          attempt: attempt + 1,
          maxAttempts: this.retryConfig.maxAttempts,
        });

        const response = await this.httpClient.get(endpoint, { params });
        
        if (response.status === 200 || response.status === 201) {
          return response.data;
        }

        throw new Error(`Unexpected status code: ${response.status}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          logger.warn('Non-retryable error, stopping retry attempts', {
            endpoint,
            error: lastError.message,
          });
          throw lastError;
        }

        // Calculate backoff delay with jitter
        if (attempt < this.retryConfig.maxAttempts - 1) {
          const delayMs = this.calculateBackoffDelay(attempt);
          logger.warn(`Request failed, retrying after ${delayMs}ms`, {
            endpoint,
            attempt: attempt + 1,
            error: lastError.message,
          });
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries exhausted
    throw new Error(
      `Failed to fetch ${endpoint} after ${this.retryConfig.maxAttempts} attempts: ${lastError?.message || 'unknown error'}`
    );
  }

  /**
   * Calculate exponential backoff delay with jitter
   * Formula: min(initialDelay * multiplier^attempt + random(0, 1000), maxDelay)
   */
  private calculateBackoffDelay(attempt: number): number {
    const exponentialDelay =
      this.retryConfig.initialDelayMs *
      Math.pow(this.retryConfig.backoffMultiplier, attempt);

    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelayMs);
  }

  /**
   * Check if error is retryable (network, timeout, rate limit)
   */
  private isRetryableError(error: any): boolean {
    if (!(error instanceof Error)) return true;

    // Network errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return true;
    }

    // Timeout
    if (error.message.includes('timeout')) {
      return true;
    }

    // Rate limit (429) and server errors (5xx)
    if (error && typeof error === 'object') {
      const axiosError = error as any;
      if (axiosError.response?.status === 429) {
        return true;
      }
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        return true;
      }
    }

    // Default: retry on unknown errors
    return true;
  }

  /**
   * Validate token response structure
   * Checks for required fields, allowing for alternative field names
   */
  private isValidToken(token: any): boolean {
    if (!token || typeof token !== 'object') return false;
    // Accept either 'address' or 'tokenAddress' field
    const hasAddress = !!(token.address || token.tokenAddress);
    const hasName = !!token.name;
    const hasSymbol = !!token.symbol;
    return hasAddress && hasName && hasSymbol;
  }

  /**
   * Validate Ethereum address format
   */
  private isValidAddress(address: string): boolean {
    if (!address) return false;
    // Accept both 0x and non-0x prefixed addresses
    const cleanAddress = address.toLowerCase();
    return /^(0x)?[0-9a-f]{40}$/.test(cleanAddress);
  }

  /**
   * Parse and normalize token response from Clanker API
   */
  private parseTokenResponse(raw: any): ClankerToken {
    return {
      address: (raw.address || raw.tokenAddress || '').toLowerCase(),
      name: raw.name || 'Unknown',
      symbol: raw.symbol || 'UNKNOWN',
      decimals: raw.decimals || 18,
      totalSupply: raw.totalSupply || raw.total_supply || '0',
      creator: (raw.creator || raw.deployer || '').toLowerCase(),
      launchTime: raw.launchTime || raw.created_at || 0,
      launchTx: raw.launchTx || raw.launch_tx || undefined,
      marketCap: raw.marketCap || raw.market_cap || undefined,
      holders: raw.holders || undefined,
      socialLinks: {
        twitter: raw.twitter || raw.twitterUrl || undefined,
        telegram: raw.telegram || raw.telegramUrl || undefined,
        website: raw.website || undefined,
        discord: raw.discord || raw.discordUrl || undefined,
      },
    };
  }

  /**
   * Health check - verify API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      logger.debug('Performing Clanker API health check');
      const response = await this.httpClient.get('/health', { timeout: 3000 });
      const isHealthy = response.status === 200;
      
      if (isHealthy) {
        logger.info('Clanker API health check passed');
      } else {
        logger.warn('Clanker API health check failed', { status: response.status });
      }
      
      return isHealthy;
    } catch (error) {
      logger.error('Clanker API health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
