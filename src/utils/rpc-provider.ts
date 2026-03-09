import { ethers } from 'ethers';

/**
 * RPC Provider Manager
 * Manages multiple RPC providers for blockchain interaction
 * Supports failover and load balancing
 */
export class RPCProvider {
  private providers: Map<string, ethers.Provider> = new Map();
  private activeProvider: ethers.Provider | null = null;
  
  constructor() {
    console.log('RPC Provider initialized');
  }
  
  /**
   * Add a provider configuration
   */
  addProvider(name: string, url: string): void {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      this.providers.set(name, provider);
      if (!this.activeProvider) {
        this.activeProvider = provider;
      }
      console.log(`Provider added: ${name}`);
    } catch (error) {
      console.error(`Failed to add provider ${name}:`, error);
    }
  }
  
  /**
   * Get a specific provider
   */
  getProvider(name: string): ethers.Provider | undefined {
    return this.providers.get(name);
  }
  
  /**
   * Get active provider with fallback
   */
  getActiveProvider(): ethers.Provider {
    if (this.activeProvider) return this.activeProvider;
    throw new Error('No active provider available');
  }
  
  /**
   * Test connection to a provider
   */
  async testConnection(name: string): Promise<boolean> {
    try {
      const provider = this.providers.get(name);
      if (!provider) return false;
      const blockNumber = await provider.getBlockNumber();
      return blockNumber > 0;
    } catch {
      return false;
    }
  }
  
  /**
   * Get block number from active provider
   */
  async getBlockNumber(): Promise<number> {
    const provider = this.getActiveProvider();
    return provider.getBlockNumber();
  }
  
  /**
   * Get gas price from active provider
   */
  async getGasPrice(): Promise<bigint> {
    const provider = this.getActiveProvider();
    const feeData = await provider.getFeeData();
    return feeData.gasPrice || 0n;
  }
}
