"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCProvider = exports.RateLimiter = void 0;
exports.getRPCProvider = getRPCProvider;
const ethers_1 = require("ethers");
const logger_1 = __importDefault(require("./logger"));
const errors_1 = require("./errors");
/**
 * ERC-20 Token ABI
 */
const ERC20_ABI = [
    'function balanceOf(address account) external view returns (uint256)',
    'function totalSupply() external view returns (uint256)',
    'function decimals() external view returns (uint8)',
    'function symbol() external view returns (string)',
    'function name() external view returns (string)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
];
/**
 * Uniswap V2 Pair ABI
 */
const UNISWAP_V2_PAIR_ABI = [
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function balanceOf(address account) external view returns (uint256)',
];
/**
 * Rate limiter for RPC requests
 */
class RateLimiter {
    constructor(maxRequestsPerSecond = 300) {
        this.requestTimestamps = [];
        this.maxRequestsPerSecond = maxRequestsPerSecond;
    }
    async waitIfNeeded() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > oneSecondAgo);
        if (this.requestTimestamps.length >= this.maxRequestsPerSecond) {
            const oldestTimestamp = this.requestTimestamps[0];
            const waitTime = oldestTimestamp + 1000 - now;
            if (waitTime > 0) {
                logger_1.default.debug(`Rate limiter: waiting ${waitTime}ms`);
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
        }
        this.requestTimestamps.push(Date.now());
    }
}
exports.RateLimiter = RateLimiter;
/**
 * RPC Provider Manager with failover and rate limiting
 */
class RPCProvider {
    constructor(maxRequestsPerSecond = 300) {
        this.providers = new Map();
        this.activeProviderName = null;
        this.lastHealthCheck = new Map();
        this.DEFAULT_PROVIDERS = {
            alchemy: process.env.ALCHEMY_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo',
            infura: process.env.INFURA_RPC_URL || 'https://base-mainnet.infura.io/v3/demo',
            ankr: process.env.ANKR_RPC_URL || 'https://rpc.ankr.com/base',
            quicknode: process.env.QUICKNODE_RPC_URL ||
                'https://base-mainnet.quicknode.pro/v1/demo',
        };
        this.rateLimiter = new RateLimiter(maxRequestsPerSecond);
        this.initializeDefaultProviders();
        logger_1.default.info('RPC Provider Manager initialized', {
            providersCount: this.providers.size,
        });
    }
    initializeDefaultProviders() {
        for (const [name, url] of Object.entries(this.DEFAULT_PROVIDERS)) {
            this.addProvider(name, url);
        }
    }
    addProvider(name, url) {
        if (!url || typeof url !== 'string') {
            throw new errors_1.APIError('Invalid RPC URL', { name, url });
        }
        try {
            const provider = new ethers_1.ethers.JsonRpcProvider(url);
            this.providers.set(name, provider);
            this.lastHealthCheck.set(name, 0);
            if (!this.activeProviderName) {
                this.activeProviderName = name;
                logger_1.default.info(`Set primary provider: ${name}`);
            }
            logger_1.default.debug(`Provider added: ${name}`, { url: this.maskUrl(url) });
        }
        catch (error) {
            throw new errors_1.APIError(`Failed to initialize provider ${name}`, {
                error: error.message,
            });
        }
    }
    getProvider(name) {
        return this.providers.get(name);
    }
    getActiveProvider() {
        if (!this.activeProviderName) {
            throw new errors_1.BlockchainError('No active RPC provider available');
        }
        const provider = this.providers.get(this.activeProviderName);
        if (!provider) {
            throw new errors_1.BlockchainError(`Provider ${this.activeProviderName} not found`);
        }
        return provider;
    }
    getActiveProviderName() {
        return this.activeProviderName || 'none';
    }
    async testConnection(name, retries = 3) {
        const provider = this.providers.get(name);
        if (!provider) {
            logger_1.default.warn(`Provider ${name} not found`);
            return false;
        }
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                await this.rateLimiter.waitIfNeeded();
                const blockNumber = await provider.getBlockNumber();
                const isValid = blockNumber > 0;
                if (isValid) {
                    logger_1.default.debug(`Provider ${name} is healthy`, {
                        blockNumber,
                        attempt: attempt + 1,
                    });
                    this.lastHealthCheck.set(name, Date.now());
                    return true;
                }
            }
            catch (error) {
                const isLastAttempt = attempt === retries - 1;
                logger_1.default.warn(`Provider ${name} health check failed`, {
                    error: error.message,
                    attempt: attempt + 1,
                    retries,
                    isLastAttempt,
                });
                if (!isLastAttempt) {
                    const delay = Math.pow(2, attempt) * 100;
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        return false;
    }
    async failoverToNextProvider() {
        const providerNames = Array.from(this.providers.keys());
        const currentIndex = providerNames.indexOf(this.activeProviderName || '');
        logger_1.default.warn(`Attempting failover from ${this.activeProviderName}`);
        for (let i = 0; i < providerNames.length; i++) {
            const nextName = providerNames[(currentIndex + 1 + i) % providerNames.length];
            if (nextName === this.activeProviderName) {
                continue;
            }
            const isHealthy = await this.testConnection(nextName, 1);
            if (isHealthy) {
                this.activeProviderName = nextName;
                logger_1.default.info(`Failover successful to ${nextName}`);
                return true;
            }
        }
        logger_1.default.error('Failover failed: no healthy providers available');
        return false;
    }
    async getBlockNumber(retries = 3) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const provider = this.getActiveProvider();
                await this.rateLimiter.waitIfNeeded();
                const blockNumber = await provider.getBlockNumber();
                return blockNumber;
            }
            catch (error) {
                const isLastAttempt = attempt === retries - 1;
                if (!isLastAttempt) {
                    const success = await this.failoverToNextProvider();
                    if (!success) {
                        throw new errors_1.BlockchainError('All RPC providers failed', {
                            error: error.message,
                        });
                    }
                    const delay = Math.pow(2, attempt) * 100;
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
                else {
                    throw new errors_1.BlockchainError('Failed to get block number', {
                        error: error.message,
                        attempts: retries,
                    });
                }
            }
        }
        throw new errors_1.BlockchainError('Unexpected error in getBlockNumber');
    }
    async getGasPrice() {
        try {
            const provider = this.getActiveProvider();
            await this.rateLimiter.waitIfNeeded();
            const feeData = await provider.getFeeData();
            return feeData.gasPrice || 0n;
        }
        catch (error) {
            throw new errors_1.BlockchainError('Failed to get gas price', {
                error: error.message,
            });
        }
    }
    async getTokenDecimals(tokenAddress) {
        if (!this.isValidAddress(tokenAddress)) {
            throw new errors_1.BlockchainError('Invalid token address', { tokenAddress });
        }
        try {
            const provider = this.getActiveProvider();
            await this.rateLimiter.waitIfNeeded();
            const contract = new ethers_1.ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const decimals = await contract.decimals();
            return Number(decimals);
        }
        catch (error) {
            throw new errors_1.BlockchainError('Failed to get token decimals', {
                error: error.message,
                tokenAddress,
            });
        }
    }
    async getTokenTotalSupply(tokenAddress) {
        if (!this.isValidAddress(tokenAddress)) {
            throw new errors_1.BlockchainError('Invalid token address', { tokenAddress });
        }
        try {
            const provider = this.getActiveProvider();
            await this.rateLimiter.waitIfNeeded();
            const contract = new ethers_1.ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const supply = await contract.totalSupply();
            return BigInt(supply);
        }
        catch (error) {
            throw new errors_1.BlockchainError('Failed to get token total supply', {
                error: error.message,
                tokenAddress,
            });
        }
    }
    async getTokenBalance(tokenAddress, accountAddress) {
        if (!this.isValidAddress(tokenAddress)) {
            throw new errors_1.BlockchainError('Invalid token address', { tokenAddress });
        }
        if (!this.isValidAddress(accountAddress)) {
            throw new errors_1.BlockchainError('Invalid account address', { accountAddress });
        }
        try {
            const provider = this.getActiveProvider();
            await this.rateLimiter.waitIfNeeded();
            const contract = new ethers_1.ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const balance = await contract.balanceOf(accountAddress);
            return BigInt(balance);
        }
        catch (error) {
            throw new errors_1.BlockchainError('Failed to get token balance', {
                error: error.message,
                tokenAddress,
                accountAddress,
            });
        }
    }
    async getTopHolders(tokenAddress, blockRange = 10000, limit = 20) {
        if (!this.isValidAddress(tokenAddress)) {
            throw new errors_1.BlockchainError('Invalid token address', { tokenAddress });
        }
        try {
            const provider = this.getActiveProvider();
            await this.rateLimiter.waitIfNeeded();
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - blockRange);
            const transferFilter = {
                address: tokenAddress,
                topics: [ethers_1.ethers.id('Transfer(address,address,uint256)')],
                fromBlock,
                toBlock: currentBlock,
            };
            await this.rateLimiter.waitIfNeeded();
            const logs = await provider.getLogs(transferFilter);
            const holderSet = new Set();
            for (const log of logs) {
                const logObj = log;
                if (logObj.topics.length >= 3) {
                    const recipient = ethers_1.ethers.getAddress('0x' + logObj.topics[2].substring(26));
                    holderSet.add(recipient);
                }
            }
            const holders = [];
            for (const address of Array.from(holderSet).slice(0, limit * 2)) {
                try {
                    const balance = await this.getTokenBalance(tokenAddress, address);
                    if (balance > 0n) {
                        holders.push([address, balance]);
                    }
                }
                catch {
                    continue;
                }
            }
            holders.sort(([, balanceA], [, balanceB]) => {
                return balanceB > balanceA ? 1 : -1;
            });
            return holders.slice(0, limit);
        }
        catch (error) {
            throw new errors_1.BlockchainError('Failed to get top holders', {
                error: error.message,
                tokenAddress,
                blockRange,
            });
        }
    }
    async getUniswapV2Reserves(pairAddress) {
        if (!this.isValidAddress(pairAddress)) {
            throw new errors_1.BlockchainError('Invalid pair address', { pairAddress });
        }
        try {
            const provider = this.getActiveProvider();
            await this.rateLimiter.waitIfNeeded();
            const contract = new ethers_1.ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
            const [reserve0, reserve1] = await contract.getReserves();
            return [BigInt(reserve0), BigInt(reserve1)];
        }
        catch (error) {
            throw new errors_1.BlockchainError('Failed to get Uniswap V2 reserves', {
                error: error.message,
                pairAddress,
            });
        }
    }
    async getUniswapV2Tokens(pairAddress) {
        if (!this.isValidAddress(pairAddress)) {
            throw new errors_1.BlockchainError('Invalid pair address', { pairAddress });
        }
        try {
            const provider = this.getActiveProvider();
            await this.rateLimiter.waitIfNeeded();
            const contract = new ethers_1.ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
            const token0 = await contract.token0();
            const token1 = await contract.token1();
            return [token0, token1];
        }
        catch (error) {
            throw new errors_1.BlockchainError('Failed to get Uniswap V2 token addresses', {
                error: error.message,
                pairAddress,
            });
        }
    }
    async isLiquidityLocked(lpTokenAddress, threshold = 1000n) {
        if (!this.isValidAddress(lpTokenAddress)) {
            throw new errors_1.BlockchainError('Invalid LP token address', {
                lpTokenAddress,
            });
        }
        try {
            const deadAddress = '0x000000000000000000000000000000000000dEaD';
            const zeroAddress = '0x0000000000000000000000000000000000000000';
            const deadBalance = await this.getTokenBalance(lpTokenAddress, deadAddress);
            if (deadBalance > threshold) {
                return true;
            }
            const zeroBalance = await this.getTokenBalance(lpTokenAddress, zeroAddress);
            if (zeroBalance > threshold) {
                return true;
            }
            return false;
        }
        catch (error) {
            throw new errors_1.BlockchainError('Failed to check liquidity lock status', {
                error: error.message,
                lpTokenAddress,
            });
        }
    }
    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    maskUrl(url) {
        return url.replace(/[a-zA-Z0-9_-]{20,}/g, '***');
    }
    async getProviderHealth() {
        const health = {};
        for (const [name] of this.providers) {
            const isHealthy = await this.testConnection(name, 1);
            if (isHealthy) {
                try {
                    const provider = this.providers.get(name);
                    if (provider) {
                        const blockNumber = await provider.getBlockNumber();
                        health[name] = { healthy: true, blockNumber };
                    }
                }
                catch {
                    health[name] = { healthy: false };
                }
            }
            else {
                health[name] = { healthy: false };
            }
        }
        return health;
    }
}
exports.RPCProvider = RPCProvider;
let rpcProviderInstance = null;
function getRPCProvider(maxRequestsPerSecond) {
    if (!rpcProviderInstance) {
        rpcProviderInstance = new RPCProvider(maxRequestsPerSecond);
    }
    return rpcProviderInstance;
}
exports.default = RPCProvider;
//# sourceMappingURL=rpc-provider.js.map