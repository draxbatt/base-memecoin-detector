"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClankerScraper = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Clanker Scraper
 * Fetches memecoin launch data from Clanker platform
 */
class ClankerScraper {
    constructor() {
        this.baseURL = 'https://api.clanker.wtf/api';
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }
    /**
     * Fetch latest memecoins from Clanker
     */
    async getLatestMemecoins(limit = 10) {
        try {
            const response = await this.retryRequest(`${this.baseURL}/tokens?limit=${limit}`);
            return response.data || [];
        }
        catch (error) {
            console.error('Error fetching from Clanker:', error);
            return [];
        }
    }
    /**
     * Get detailed token info
     */
    async getTokenInfo(tokenAddress) {
        try {
            const response = await this.retryRequest(`${this.baseURL}/token/${tokenAddress}`);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching token info for ${tokenAddress}:`, error);
            return null;
        }
    }
    /**
     * Get token metadata and social links
     */
    async getTokenMetadata(tokenAddress) {
        try {
            const response = await this.retryRequest(`${this.baseURL}/token/${tokenAddress}/metadata`);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching metadata for ${tokenAddress}:`, error);
            return null;
        }
    }
    /**
     * Retry request with exponential backoff
     */
    async retryRequest(url, attempt = 0) {
        try {
            return await axios_1.default.get(url, { timeout: 5000 });
        }
        catch (error) {
            if (attempt < this.retryAttempts) {
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
                return this.retryRequest(url, attempt + 1);
            }
            throw error;
        }
    }
}
exports.ClankerScraper = ClankerScraper;
//# sourceMappingURL=clanker.js.map