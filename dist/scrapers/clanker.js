"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClankerScraper = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Rate limiter for API calls
 */
class RateLimiter {
    constructor(maxRequests = 100, timeWindowSeconds = 60) {
        this.requestTimes = [];
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindowSeconds * 1000;
    }
    /**
     * Check if request is allowed and update state
     */
    async checkAndWait() {
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
class ClankerScraper {
    constructor() {
        this.baseURL = 'https://api.clanker.wtf/api';
        this.retryConfig = {
            maxAttempts: 3,
            initialDelayMs: 1000,
            maxDelayMs: 8000,
            backoffMultiplier: 2,
        };
        this.rateLimiter = new RateLimiter(100, 60); // 100 req/min
        // Configure axios instance with defaults
        this.httpClient = axios_1.default.create({
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
    async fetchLatestLaunches(limit = 50) {
        if (limit > 100) {
            limit = 100;
        }
        if (limit < 1) {
            limit = 1;
        }
        try {
            logger_1.default.info(`Fetching latest ${limit} launches from Clanker`);
            const response = await this.makeRequest('/tokens/recent', { limit });
            if (!Array.isArray(response)) {
                logger_1.default.warn('Clanker returned non-array response, defaulting to empty array');
                return [];
            }
            const validated = response
                .filter(token => this.isValidToken(token))
                .map(token => this.parseTokenResponse(token));
            logger_1.default.info(`Successfully fetched ${validated.length} valid tokens from Clanker`);
            return validated;
        }
        catch (error) {
            logger_1.default.error('Failed to fetch latest launches from Clanker', {
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
    async getTokenDetails(tokenAddress) {
        if (!this.isValidAddress(tokenAddress)) {
            logger_1.default.warn('Invalid token address provided', { address: tokenAddress });
            return null;
        }
        try {
            logger_1.default.debug(`Fetching details for token ${tokenAddress}`);
            const response = await this.makeRequest(`/token/${tokenAddress}`);
            if (!this.isValidToken(response)) {
                logger_1.default.warn('Clanker returned invalid token data', { address: tokenAddress });
                return null;
            }
            return this.parseTokenResponse(response);
        }
        catch (error) {
            logger_1.default.error('Failed to fetch token details', {
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
    async getTokenMetadata(tokenAddress) {
        if (!this.isValidAddress(tokenAddress)) {
            logger_1.default.warn('Invalid token address for metadata fetch', { address: tokenAddress });
            return null;
        }
        try {
            logger_1.default.debug(`Fetching metadata for token ${tokenAddress}`);
            const response = await this.makeRequest(`/token/${tokenAddress}/metadata`);
            return response || null;
        }
        catch (error) {
            logger_1.default.error('Failed to fetch token metadata', {
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
    async makeRequest(endpoint, params) {
        // Apply rate limiting
        await this.rateLimiter.checkAndWait();
        let lastError = null;
        for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
            try {
                logger_1.default.debug('Clanker API request', {
                    endpoint,
                    attempt: attempt + 1,
                    maxAttempts: this.retryConfig.maxAttempts,
                });
                const response = await this.httpClient.get(endpoint, { params });
                if (response.status === 200 || response.status === 201) {
                    return response.data;
                }
                throw new Error(`Unexpected status code: ${response.status}`);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Check if error is retryable
                if (!this.isRetryableError(error)) {
                    logger_1.default.warn('Non-retryable error, stopping retry attempts', {
                        endpoint,
                        error: lastError.message,
                    });
                    throw lastError;
                }
                // Calculate backoff delay with jitter
                if (attempt < this.retryConfig.maxAttempts - 1) {
                    const delayMs = this.calculateBackoffDelay(attempt);
                    logger_1.default.warn(`Request failed, retrying after ${delayMs}ms`, {
                        endpoint,
                        attempt: attempt + 1,
                        error: lastError.message,
                    });
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }
        // All retries exhausted
        throw new Error(`Failed to fetch ${endpoint} after ${this.retryConfig.maxAttempts} attempts: ${lastError?.message || 'unknown error'}`);
    }
    /**
     * Calculate exponential backoff delay with jitter
     * Formula: min(initialDelay * multiplier^attempt + random(0, 1000), maxDelay)
     */
    calculateBackoffDelay(attempt) {
        const exponentialDelay = this.retryConfig.initialDelayMs *
            Math.pow(this.retryConfig.backoffMultiplier, attempt);
        const jitter = Math.random() * 1000;
        return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelayMs);
    }
    /**
     * Check if error is retryable (network, timeout, rate limit)
     */
    isRetryableError(error) {
        if (!(error instanceof Error)) {
            return true;
        }
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
            const axiosError = error;
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
    isValidToken(token) {
        if (!token || typeof token !== 'object') {
            return false;
        }
        // Accept either 'address' or 'tokenAddress' field
        const hasAddress = !!(token.address || token.tokenAddress);
        const hasName = !!token.name;
        const hasSymbol = !!token.symbol;
        return hasAddress && hasName && hasSymbol;
    }
    /**
     * Validate Ethereum address format
     */
    isValidAddress(address) {
        if (!address) {
            return false;
        }
        // Accept both 0x and non-0x prefixed addresses
        const cleanAddress = address.toLowerCase();
        return /^(0x)?[0-9a-f]{40}$/.test(cleanAddress);
    }
    /**
     * Parse and normalize token response from Clanker API
     */
    parseTokenResponse(raw) {
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
    async healthCheck() {
        try {
            logger_1.default.debug('Performing Clanker API health check');
            const response = await this.httpClient.get('/health', { timeout: 3000 });
            const isHealthy = response.status === 200;
            if (isHealthy) {
                logger_1.default.info('Clanker API health check passed');
            }
            else {
                logger_1.default.warn('Clanker API health check failed', { status: response.status });
            }
            return isHealthy;
        }
        catch (error) {
            logger_1.default.error('Clanker API health check failed', {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
}
exports.ClankerScraper = ClankerScraper;
//# sourceMappingURL=clanker.js.map