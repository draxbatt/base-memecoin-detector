import axios, { AxiosInstance } from 'axios';

export class BankrScraper {
  private baseURL = 'https://api.bankr.ai/api';
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
      headers: { 'User-Agent': 'memecoin-detector/1.0' },
    });
  }

  async getAnalysis(addr: string): Promise<any | null> {
    try {
      const res = await this.client.get(`/analyze/${addr}`);
      return res.data;
    } catch (error) {
      console.error('Error analyzing token', error);
      return null;
    }
  }
}
