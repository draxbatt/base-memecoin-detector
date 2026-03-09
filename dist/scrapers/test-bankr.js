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
        this.client = axios_1.default.create({
            baseURL: this.baseURL,
            timeout: 5000,
            headers: { 'User-Agent': 'memecoin-detector/1.0' },
        });
    }
    async getAnalysis(addr) {
        try {
            const res = await this.client.get(`/analyze/${addr}`);
            return res.data;
        }
        catch (error) {
            console.error('Error analyzing token', error);
            return null;
        }
    }
}
exports.BankrScraper = BankrScraper;
//# sourceMappingURL=test-bankr.js.map