import axios from 'axios';

export class BankrScraper {
  private baseURL = 'https://api.bankr.ai/api';
  private retryAttempts = 3;
  
  async getAnalysis(address: string): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseURL}/analyze/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error analyzing token:', error);
      return null;
    }
  }
  
  async getHistoricalData(address: string, days: number = 7): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseURL}/history/${address}?days=${days}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }
  
  async getHolders(address: string, limit: number = 100): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseURL}/token/${address}/holders?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching holders:', error);
      return null;
    }
  }
  
  async getLiquidity(address: string): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseURL}/token/${address}/liquidity`);
      return response.data;
    } catch (error) {
      console.error('Error fetching liquidity:', error);
      return null;
    }
  }
  
  async getVolume(address: string, period: string = '24h'): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseURL}/token/${address}/volume?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching volume:', error);
      return null;
    }
  }
  
  async getSentiment(address: string): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseURL}/token/${address}/sentiment`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sentiment:', error);
      return null;
    }
  }
  
  async getCreator(address: string): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseURL}/token/${address}/creator`);
      return response.data;
    } catch (error) {
      console.error('Error fetching creator:', error);
      return null;
    }
  }
  
  async getContractAnalysis(address: string): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseURL}/token/${address}/contract-analysis`);
      return response.data;
    } catch (error) {
      console.error('Error analyzing contract:', error);
      return null;
    }
  }
  
  async getPumpDetection(address: string): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseURL}/token/${address}/pump-detection`);
      return response.data;
    } catch (error) {
      console.error('Error detecting pump:', error);
      return null;
    }
  }
}
