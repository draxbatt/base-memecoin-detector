import axios, { AxiosInstance } from 'axios';
import logger from './logger';

export class RetryClient {
  private instance: AxiosInstance;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private rateLimitUntil = 0;

  constructor(baseURL?: string, private maxRetries = 3) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  async get(url: string, config?: any) {
    return this.makeRequest(() => this.instance.get(url, config));
  }

  async post(url: string, data?: any, config?: any) {
    return this.makeRequest(() => this.instance.post(url, data, config));
  }

  private async makeRequest(fn: () => Promise<any>) {
    // Check rate limit
    if (Date.now() < this.rateLimitUntil) {
      const waitTime = this.rateLimitUntil - Date.now();
      logger.warn(`Rate limited, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }

    let lastError;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60') * 1000;
          this.rateLimitUntil = Date.now() + retryAfter;
          logger.warn(`Rate limited (429), retry after ${retryAfter}ms`);
          await this.sleep(retryAfter);
        } else if (error.response?.status >= 500 || error.code === 'ECONNREFUSED') {
          const backoff = Math.pow(2, attempt) * 1000;
          logger.warn(`Request failed (${error.message}), retry ${attempt + 1}/${this.maxRetries} in ${backoff}ms`);
          await this.sleep(backoff);
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
