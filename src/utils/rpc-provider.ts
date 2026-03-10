import { ethers } from 'ethers';
import logger from './logger';
import { BlockchainError, APIError } from './errors';

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
export class RateLimiter {
  private readonly maxRequestsPerSecond: number;
  private requestTimestamps: number[] = [];

  constructor(maxRequestsPerSecond: number = 300) {
    this.maxRequestsPerSecond = maxRequestsPerSecond;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > oneSecondAgo,
    );

    if (this.requestTimestamps.length >= this.maxRequestsPerSecond) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = oldestTimestamp + 1000 - now;
      if (waitTime > 0) {
        logger.debug(`Rate limiter: waiting ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    this.requestTimestamps.push(Date.now());
  }
}

/**
 * RPC Provider Manager with failover and rate limiting
 */
export class RPCProvider {
  private providers: Map<string, ethers.Provider> = new Map();
  private activeProviderName: string | null = null;
  private rateLimiter: RateLimiter;
  private lastHealthCheck: Map<string, number> = new Map();

  private readonly DEFAULT_PROVIDERS: Record<string, string> = {
    alchemy: process.env.ALCHEMY_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo',
    infura: process.env.INFURA_RPC_URL || 'https://base-mainnet.infura.io/v3/demo',
    ankr: process.env.ANKR_RPC_URL || 'https://rpc.ankr.com/base',
    quicknode:
      process.env.QUICKNODE_RPC_URL ||
      'https://base-mainnet.quicknode.pro/v1/demo',
  };

  constructor(maxRequestsPerSecond: number = 300) {
    this.rateLimiter = new RateLimiter(maxRequestsPerSecond);
    this.initializeDefaultProviders();
    logger.info('RPC Provider Manager initialized', {
      providersCount: this.providers.size,
    });
  }

  private initializeDefaultProviders(): void {
    for (const [name, url] of Object.entries(this.DEFAULT_PROVIDERS)) {
      this.addProvider(name, url);
    }
  }

  addProvider(name: string, url: string): void {
    if (!url || typeof url !== 'string') {
      throw new APIError('Invalid RPC URL', { name, url });
    }

    try {
      const provider = new ethers.JsonRpcProvider(url);
      this.providers.set(name, provider);
      this.lastHealthCheck.set(name, 0);

      if (!this.activeProviderName) {
        this.activeProviderName = name;
        logger.info(`Set primary provider: ${name}`);
      }

      logger.debug(`Provider added: ${name}`, { url: this.maskUrl(url) });
    } catch (error: any) {
      throw new APIError(`Failed to initialize provider ${name}`, {
        error: error.message,
      });
    }
  }

  getProvider(name: string): ethers.Provider | undefined {
    return this.providers.get(name);
  }

  getActiveProvider(): ethers.Provider {
    if (!this.activeProviderName) {
      throw new BlockchainError('No active RPC provider available');
    }

    const provider = this.providers.get(this.activeProviderName);
    if (!provider) {
      throw new BlockchainError(
        `Provider ${this.activeProviderName} not found`,
      );
    }

    return provider;
  }

  getActiveProviderName(): string {
    return this.activeProviderName || 'none';
  }

  async testConnection(name: string, retries: number = 3): Promise<boolean> {
    const provider = this.providers.get(name);
    if (!provider) {
      logger.warn(`Provider ${name} not found`);
      return false;
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.rateLimiter.waitIfNeeded();
        const blockNumber = await provider.getBlockNumber();
        const isValid = blockNumber > 0;

        if (isValid) {
          logger.debug(`Provider ${name} is healthy`, {
            blockNumber,
            attempt: attempt + 1,
          });
          this.lastHealthCheck.set(name, Date.now());
          return true;
        }
      } catch (error: any) {
        const isLastAttempt = attempt === retries - 1;
        logger.warn(`Provider ${name} health check failed`, {
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

  async failoverToNextProvider(): Promise<boolean> {
    const providerNames = Array.from(this.providers.keys());
    const currentIndex = providerNames.indexOf(
      this.activeProviderName || '',
    );

    logger.warn(`Attempting failover from ${this.activeProviderName}`);

    for (let i = 0; i < providerNames.length; i++) {
      const nextName = providerNames[(currentIndex + 1 + i) % providerNames.length];
      if (nextName === this.activeProviderName) {continue;}

      const isHealthy = await this.testConnection(nextName, 1);
      if (isHealthy) {
        this.activeProviderName = nextName;
        logger.info(`Failover successful to ${nextName}`);
        return true;
      }
    }

    logger.error('Failover failed: no healthy providers available');
    return false;
  }

  async getBlockNumber(retries: number = 3): Promise<number> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const provider = this.getActiveProvider();
        await this.rateLimiter.waitIfNeeded();
        const blockNumber = await provider.getBlockNumber();
        return blockNumber;
      } catch (error: any) {
        const isLastAttempt = attempt === retries - 1;

        if (!isLastAttempt) {
          const success = await this.failoverToNextProvider();
          if (!success) {
            throw new BlockchainError('All RPC providers failed', {
              error: error.message,
            });
          }
          const delay = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw new BlockchainError('Failed to get block number', {
            error: error.message,
            attempts: retries,
          });
        }
      }
    }

    throw new BlockchainError('Unexpected error in getBlockNumber');
  }

  async getGasPrice(): Promise<bigint> {
    try {
      const provider = this.getActiveProvider();
      await this.rateLimiter.waitIfNeeded();
      const feeData = await provider.getFeeData();
      return feeData.gasPrice || 0n;
    } catch (error: any) {
      throw new BlockchainError('Failed to get gas price', {
        error: error.message,
      });
    }
  }

  async getTokenDecimals(tokenAddress: string): Promise<number> {
    if (!this.isValidAddress(tokenAddress)) {
      throw new BlockchainError('Invalid token address', { tokenAddress });
    }

    try {
      const provider = this.getActiveProvider();
      await this.rateLimiter.waitIfNeeded();
      const contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider,
      );
      const decimals = await contract.decimals();
      return Number(decimals);
    } catch (error: any) {
      throw new BlockchainError('Failed to get token decimals', {
        error: error.message,
        tokenAddress,
      });
    }
  }

  async getTokenTotalSupply(tokenAddress: string): Promise<bigint> {
    if (!this.isValidAddress(tokenAddress)) {
      throw new BlockchainError('Invalid token address', { tokenAddress });
    }

    try {
      const provider = this.getActiveProvider();
      await this.rateLimiter.waitIfNeeded();
      const contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider,
      );
      const supply = await contract.totalSupply();
      return BigInt(supply);
    } catch (error: any) {
      throw new BlockchainError('Failed to get token total supply', {
        error: error.message,
        tokenAddress,
      });
    }
  }

  async getTokenBalance(
    tokenAddress: string,
    accountAddress: string,
  ): Promise<bigint> {
    if (!this.isValidAddress(tokenAddress)) {
      throw new BlockchainError('Invalid token address', { tokenAddress });
    }
    if (!this.isValidAddress(accountAddress)) {
      throw new BlockchainError('Invalid account address', { accountAddress });
    }

    try {
      const provider = this.getActiveProvider();
      await this.rateLimiter.waitIfNeeded();
      const contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider,
      );
      const balance = await contract.balanceOf(accountAddress);
      return BigInt(balance);
    } catch (error: any) {
      throw new BlockchainError('Failed to get token balance', {
        error: error.message,
        tokenAddress,
        accountAddress,
      });
    }
  }

  async getTopHolders(
    tokenAddress: string,
    blockRange: number = 10000,
    limit: number = 20,
  ): Promise<Array<[string, bigint]>> {
    if (!this.isValidAddress(tokenAddress)) {
      throw new BlockchainError('Invalid token address', { tokenAddress });
    }

    try {
      const provider = this.getActiveProvider();
      await this.rateLimiter.waitIfNeeded();

      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - blockRange);

      const transferFilter = {
        address: tokenAddress,
        topics: [ethers.id('Transfer(address,address,uint256)')],
        fromBlock,
        toBlock: currentBlock,
      };

      await this.rateLimiter.waitIfNeeded();
      const logs = await provider.getLogs(transferFilter);

      const holderSet = new Set<string>();
      for (const log of logs) {
        const logObj = log as any;
        if (logObj.topics.length >= 3) {
          const recipient = ethers.getAddress(
            '0x' + logObj.topics[2].substring(26),
          );
          holderSet.add(recipient);
        }
      }

      const holders: Array<[string, bigint]> = [];
      for (const address of Array.from(holderSet).slice(0, limit * 2)) {
        try {
          const balance = await this.getTokenBalance(tokenAddress, address);
          if (balance > 0n) {
            holders.push([address, balance]);
          }
        } catch {
          continue;
        }
      }

      holders.sort(([, balanceA], [, balanceB]) => {
        return balanceB > balanceA ? 1 : -1;
      });

      return holders.slice(0, limit);
    } catch (error: any) {
      throw new BlockchainError('Failed to get top holders', {
        error: error.message,
        tokenAddress,
        blockRange,
      });
    }
  }

  async getUniswapV2Reserves(pairAddress: string): Promise<[bigint, bigint]> {
    if (!this.isValidAddress(pairAddress)) {
      throw new BlockchainError('Invalid pair address', { pairAddress });
    }

    try {
      const provider = this.getActiveProvider();
      await this.rateLimiter.waitIfNeeded();
      const contract = new ethers.Contract(
        pairAddress,
        UNISWAP_V2_PAIR_ABI,
        provider,
      );
      const [reserve0, reserve1] = await contract.getReserves();
      return [BigInt(reserve0), BigInt(reserve1)];
    } catch (error: any) {
      throw new BlockchainError('Failed to get Uniswap V2 reserves', {
        error: error.message,
        pairAddress,
      });
    }
  }

  async getUniswapV2Tokens(pairAddress: string): Promise<[string, string]> {
    if (!this.isValidAddress(pairAddress)) {
      throw new BlockchainError('Invalid pair address', { pairAddress });
    }

    try {
      const provider = this.getActiveProvider();
      await this.rateLimiter.waitIfNeeded();
      const contract = new ethers.Contract(
        pairAddress,
        UNISWAP_V2_PAIR_ABI,
        provider,
      );
      const token0 = await contract.token0();
      const token1 = await contract.token1();
      return [token0, token1];
    } catch (error: any) {
      throw new BlockchainError('Failed to get Uniswap V2 token addresses', {
        error: error.message,
        pairAddress,
      });
    }
  }

  async isLiquidityLocked(
    lpTokenAddress: string,
    threshold: bigint = 1000n,
  ): Promise<boolean> {
    if (!this.isValidAddress(lpTokenAddress)) {
      throw new BlockchainError('Invalid LP token address', {
        lpTokenAddress,
      });
    }

    try {
      const deadAddress = '0x000000000000000000000000000000000000dEaD';
      const zeroAddress = '0x0000000000000000000000000000000000000000';

      const deadBalance = await this.getTokenBalance(
        lpTokenAddress,
        deadAddress,
      );
      if (deadBalance > threshold) {
        return true;
      }

      const zeroBalance = await this.getTokenBalance(
        lpTokenAddress,
        zeroAddress,
      );
      if (zeroBalance > threshold) {
        return true;
      }

      return false;
    } catch (error: any) {
      throw new BlockchainError('Failed to check liquidity lock status', {
        error: error.message,
        lpTokenAddress,
      });
    }
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private maskUrl(url: string): string {
    return url.replace(/[a-zA-Z0-9_-]{20,}/g, '***');
  }

  async getProviderHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};

    for (const [name] of this.providers) {
      const isHealthy = await this.testConnection(name, 1);
      if (isHealthy) {
        try {
          const provider = this.providers.get(name);
          if (provider) {
            const blockNumber = await provider.getBlockNumber();
            health[name] = { healthy: true, blockNumber };
          }
        } catch {
          health[name] = { healthy: false };
        }
      } else {
        health[name] = { healthy: false };
      }
    }

    return health;
  }
}

let rpcProviderInstance: RPCProvider | null = null;

export function getRPCProvider(maxRequestsPerSecond?: number): RPCProvider {
  if (!rpcProviderInstance) {
    rpcProviderInstance = new RPCProvider(maxRequestsPerSecond);
  }
  return rpcProviderInstance;
}

export default RPCProvider;
