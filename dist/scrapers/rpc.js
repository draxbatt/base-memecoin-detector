"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcIntegration = void 0;
const ethers_1 = require("ethers");
const http_client_1 = require("../utils/http-client");
const logger_1 = __importDefault(require("../utils/logger"));
const errors_1 = require("../utils/errors");
const axios_1 = __importDefault(require("axios"));
class RpcIntegration {
    constructor(rpcUrl, basescanApiKey) {
        this.basescanApiUrl = 'https://api.basescan.org/api';
        this.holdersCache = new Map();
        this.CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        this.httpClient = new http_client_1.RetryClient();
        this.basescanApiKey = basescanApiKey || process.env.BASESCAN_API_KEY;
    }
    async getTokenSupply(contractAddress) {
        try {
            const contract = new ethers_1.ethers.Contract(contractAddress, ['function totalSupply() public view returns (uint256)'], this.provider);
            return await contract.totalSupply();
        }
        catch (error) {
            throw new errors_1.APIError('Failed to fetch token supply', {
                contractAddress,
                error: error.message,
            });
        }
    }
    async getTokenDecimals(contractAddress) {
        try {
            const contract = new ethers_1.ethers.Contract(contractAddress, ['function decimals() public view returns (uint8)'], this.provider);
            return await contract.decimals();
        }
        catch (error) {
            throw new errors_1.APIError('Failed to fetch token decimals', {
                contractAddress,
                error: error.message,
            });
        }
    }
    /**
     * Fetch top holders from Basescan API with caching
     * Falls back gracefully if API key is missing or rate limited
     *
     * @param contractAddress Token contract address
     * @param limit Number of top holders to fetch (max 10000)
     * @returns Array of top holders with balances and percentages
     */
    async getTopHolders(contractAddress, limit = 10) {
        try {
            logger_1.default.debug('Fetching top holders', { contractAddress, limit });
            // Validate inputs
            if (!contractAddress || !/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) {
                logger_1.default.warn('Invalid contract address for holder fetch', { contractAddress });
                return [];
            }
            if (limit < 1 || limit > 10000) {
                limit = Math.min(Math.max(1, limit), 10000);
            }
            // Check cache first
            const cached = this.getFromCache(contractAddress);
            if (cached) {
                logger_1.default.debug('Returning cached holder data', {
                    contractAddress,
                    cached: true,
                });
                return cached.slice(0, limit);
            }
            // Fetch from Basescan API if key available
            if (this.basescanApiKey) {
                try {
                    const holders = await this.fetchFromBasescan(contractAddress);
                    // Cache the result
                    this.setCache(contractAddress, holders);
                    logger_1.default.info('Fetched top holders from Basescan', {
                        contractAddress,
                        count: holders.length,
                    });
                    return holders.slice(0, limit);
                }
                catch (error) {
                    logger_1.default.warn('Basescan API failed, falling back to RPC', {
                        contractAddress,
                        error: error.message,
                    });
                    // Fall through to RPC-only approach
                }
            }
            // RPC fallback: try to estimate from transfer events
            logger_1.default.debug('Using RPC fallback for holder data', { contractAddress });
            const holders = await this.estimateHoldersFromRpc(contractAddress, limit);
            // Cache the fallback result
            this.setCache(contractAddress, holders);
            return holders;
        }
        catch (error) {
            logger_1.default.error('Failed to fetch top holders', {
                contractAddress,
                error: error.message,
            });
            // Return empty array on error instead of throwing - graceful degradation
            return [];
        }
    }
    /**
     * Fetch holder data from Basescan API
     * Rate limit: 5 calls/sec for free tier
     */
    async fetchFromBasescan(contractAddress) {
        try {
            const response = await axios_1.default.get(this.basescanApiUrl, {
                params: {
                    module: 'token',
                    action: 'tokenholderlist',
                    contractaddress: contractAddress,
                    page: 1,
                    offset: 100,
                    apikey: this.basescanApiKey,
                },
                timeout: 8000,
            });
            if (!response.data || response.data.status !== '1') {
                logger_1.default.warn('Basescan returned error or no data', {
                    contractAddress,
                    status: response.data?.status,
                    message: response.data?.message,
                });
                return [];
            }
            const holders = response.data.result || [];
            if (!Array.isArray(holders) || holders.length === 0) {
                return [];
            }
            // Parse and normalize holder data
            const totalSupply = holders.reduce((sum, h) => {
                try {
                    return sum + BigInt(h.TokenHolderQuantity || 0);
                }
                catch {
                    return sum;
                }
            }, BigInt(0));
            return holders
                .slice(0, 10)
                .map((holder) => {
                try {
                    const balance = BigInt(holder.TokenHolderQuantity || 0);
                    const percentage = totalSupply > 0n
                        ? Number((balance * BigInt(10000) / totalSupply)) / 100
                        : 0;
                    return {
                        address: holder.TokenHolderAddress?.toLowerCase() || '',
                        balance,
                        percentage: Math.min(100, percentage),
                    };
                }
                catch (error) {
                    logger_1.default.warn('Failed to parse holder', { holder, error: error.message });
                    return null;
                }
                ;
            })
                .filter((h) => h !== null);
        }
        catch (error) {
            if (error.response?.status === 429) {
                logger_1.default.warn('Basescan rate limited', { contractAddress });
                throw new errors_1.APIError('Basescan rate limited', { status: 429, contractAddress });
            }
            throw new errors_1.APIError('Basescan API request failed', {
                contractAddress,
                error: error.message,
                status: error.response?.status,
            });
        }
    }
    /**
     * Estimate top holders by querying Transfer events
     * This is a fallback when Basescan API is unavailable
     */
    async estimateHoldersFromRpc(contractAddress, limit) {
        try {
            const contract = new ethers_1.ethers.Contract(contractAddress, [
                'function balanceOf(address account) public view returns (uint256)',
                'function totalSupply() public view returns (uint256)',
                'event Transfer(address indexed from, address indexed to, uint256 value)',
            ], this.provider);
            // Get recent Transfer events (last 1000 blocks)
            const currentBlock = await this.provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 1000);
            const transferFilter = contract.filters.Transfer();
            const events = await contract.queryFilter(transferFilter, fromBlock, currentBlock);
            // Extract unique addresses and their balances
            const addressSet = new Set();
            events.forEach((event) => {
                if (event.args?.to)
                    addressSet.add(event.args.to);
                if (event.args?.from)
                    addressSet.add(event.args.from);
            });
            // Query balances for top addresses
            const addresses = Array.from(addressSet).slice(0, limit * 2); // Fetch more than needed
            const balances = [];
            const totalSupply = await contract.totalSupply();
            const totalSupplyBigInt = BigInt(totalSupply.toString());
            for (const address of addresses) {
                try {
                    const balance = await contract.balanceOf(address);
                    const balanceBigInt = BigInt(balance.toString());
                    if (balanceBigInt > BigInt(0)) {
                        const percentage = totalSupplyBigInt > BigInt(0)
                            ? Number((balanceBigInt * BigInt(10000) / totalSupplyBigInt)) / 100
                            : 0;
                        balances.push({
                            address: address.toLowerCase(),
                            balance: balanceBigInt,
                            percentage: Math.min(100, percentage),
                        });
                    }
                }
                catch (error) {
                    logger_1.default.debug('Failed to fetch balance for address', { address, error: error.message });
                }
            }
            // Sort by balance and return top N
            return balances
                .sort((a, b) => Number(b.balance - a.balance))
                .slice(0, limit);
        }
        catch (error) {
            logger_1.default.warn('RPC fallback for holders failed', {
                contractAddress,
                error: error.message,
            });
            return [];
        }
    }
    /**
     * Get cached holder data if still valid
     */
    getFromCache(contractAddress) {
        const cached = this.holdersCache.get(contractAddress.toLowerCase());
        if (!cached)
            return null;
        const age = Date.now() - cached.timestamp;
        if (age > cached.ttlMs) {
            this.holdersCache.delete(contractAddress.toLowerCase());
            return null;
        }
        return cached.data;
    }
    /**
     * Set holder data cache
     */
    setCache(contractAddress, holders) {
        this.holdersCache.set(contractAddress.toLowerCase(), {
            data: holders,
            timestamp: Date.now(),
            ttlMs: this.CACHE_TTL_MS,
        });
    }
    /**
     * Clear all cached data
     */
    clearCache() {
        this.holdersCache.clear();
        logger_1.default.info('Holder cache cleared');
    }
    async getTokenMetadata(contractAddress) {
        try {
            logger_1.default.debug('Fetching token metadata', { contractAddress });
            const [supply, decimals, holders] = await Promise.all([
                this.getTokenSupply(contractAddress),
                this.getTokenDecimals(contractAddress),
                this.getTopHolders(contractAddress),
            ]);
            return {
                contractAddress,
                totalSupply: supply,
                decimals,
                holderCount: holders.length,
                topHolders: holders,
                liquidityPairs: [],
                isBurned: false,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to fetch token metadata', {
                contractAddress,
                error: error.message,
            });
            // Return graceful fallback with empty holder data
            try {
                const supply = await this.getTokenSupply(contractAddress);
                const decimals = await this.getTokenDecimals(contractAddress);
                return {
                    contractAddress,
                    totalSupply: supply,
                    decimals,
                    holderCount: 0,
                    topHolders: [],
                    liquidityPairs: [],
                    isBurned: false,
                };
            }
            catch {
                throw new errors_1.APIError('Failed to fetch token metadata', {
                    contractAddress,
                    error: error.message,
                });
            }
        }
    }
    async checkLiquidityLock(contractAddress) {
        try {
            logger_1.default.debug('Checking liquidity lock', { contractAddress });
            // Would integrate with Unicrypt or similar lock verification service
            return false;
        }
        catch (error) {
            throw new errors_1.APIError('Failed to check liquidity lock', {
                contractAddress,
                error: error.message,
            });
        }
    }
    async verifyConnection() {
        try {
            const blockNumber = await this.provider.getBlockNumber();
            logger_1.default.info('RPC connection verified', { blockNumber });
            return true;
        }
        catch (error) {
            throw new errors_1.APIError('RPC connection failed', { error: error.message });
        }
    }
}
exports.RpcIntegration = RpcIntegration;
//# sourceMappingURL=rpc.js.map