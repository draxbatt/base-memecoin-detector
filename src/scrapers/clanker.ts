import axios from 'axios';

/**
 * Clanker Scraper
 * Fetches memecoin launch data from Clanker platform
 */
export class ClankerScraper {
  private baseURL = 'https://api.clanker.wtf/api';
  private retryAttempts = 3;
  private retryDelay = 1000;
  
  /**
   * Fetch latest memecoins from Clanker
   */
  async getLatestMemecoins(limit: number = 10): Promise<any[]> {
    try {
      const response = await this.retryRequest(`${this.baseURL}/tokens?limit=${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching from Clanker:', error);
      return [];
    }
  }
  
  /**
   * Get detailed token info
   */
  async getTokenInfo(tokenAddress: string): Promise<any | null> {
    try {
      const response = await this.retryRequest(`${this.baseURL}/token/${tokenAddress}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching token info for ${tokenAddress}:`, error);
      return null;
    }
  }
  
  /**
   * Get token metadata and social links
   */
  async getTokenMetadata(tokenAddress: string): Promise<any | null> {
    try {
      const response = await this.retryRequest(`${this.baseURL}/token/${tokenAddress}/metadata`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching metadata for ${tokenAddress}:`, error);
      return null;
    }
  }
  
  /**
   * Retry request with exponential backoff
   */
  private async retryRequest(url: string, attempt = 0): Promise<any> {
    try {
      return await axios.get(url, { timeout: 5000 });
    } catch (error) {
      if (attempt < this.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        return this.retryRequest(url, attempt + 1);
      }
      throw error;
    }
  }
}
