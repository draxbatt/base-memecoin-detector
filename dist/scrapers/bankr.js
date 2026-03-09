"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankrScraper = void 0;
const axios_1 = __importDefault(require("axios"));
class BankrScraper {
    constructor() {
        this.baseURL = 'https://api.bankr.ai/api';
        this.retryAttempts = 3;
    }
    async getAnalysis(address) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/analyze/${address}`);
            return response.data;
        }
        catch (error) {
            console.error('Error analyzing token:', error);
            return null;
        }
    }
    async getHistoricalData(address, days = 7) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/history/${address}?days=${days}`);
            return response.data || [];
        }
        catch (error) {
            console.error('Error fetching history:', error);
            return [];
        }
    }
    async getHolders(address, limit = 100) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/token/${address}/holders?limit=${limit}`);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching holders:', error);
            return null;
        }
    }
    async getLiquidity(address) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/token/${address}/liquidity`);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching liquidity:', error);
            return null;
        }
    }
    async getVolume(address, period = '24h') {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/token/${address}/volume?period=${period}`);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching volume:', error);
            return null;
        }
    }
    async getSentiment(address) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/token/${address}/sentiment`);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching sentiment:', error);
            return null;
        }
    }
    async getCreator(address) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/token/${address}/creator`);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching creator:', error);
            return null;
        }
    }
    async getContractAnalysis(address) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/token/${address}/contract-analysis`);
            return response.data;
        }
        catch (error) {
            console.error('Error analyzing contract:', error);
            return null;
        }
    }
    async getPumpDetection(address) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/token/${address}/pump-detection`);
            return response.data;
        }
        catch (error) {
            console.error('Error detecting pump:', error);
            return null;
        }
    }
}
exports.BankrScraper = BankrScraper;
//# sourceMappingURL=bankr.js.map