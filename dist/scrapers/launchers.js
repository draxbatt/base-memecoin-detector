"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankrScraper = exports.ClankerScraper = void 0;
const http_client_1 = require("../utils/http-client");
const logger_1 = __importDefault(require("../utils/logger"));
const errors_1 = require("../utils/errors");
class ClankerScraper {
    constructor(apiUrl) {
        this.client = new http_client_1.RetryClient(apiUrl);
    }
    async fetchLatestLaunches(limit = 20) {
        try {
            logger_1.default.debug('Fetching Clanker launches', { limit });
            // TODO: Replace with actual Clanker API endpoint
            // This is a placeholder that demonstrates the structure
            const response = await this.client.get('/launches', {
                params: { limit, chain: 'base', sort: 'newest' },
            });
            if (!response.data || !Array.isArray(response.data)) {
                throw new errors_1.ValidationError('Invalid Clanker response format', { response: response.data });
            }
            return response.data.map((item) => ({
                contractAddress: item.token?.address || item.address,
                name: item.token?.name || item.name,
                symbol: item.token?.symbol || item.symbol,
                launchTime: item.launchTime || item.createdAt,
                creatorAddress: item.creator || item.deployer,
                initialLiquidity: item.initialLiquidity,
                totalSupply: item.totalSupply,
                source: 'clanker',
            }));
        }
        catch (error) {
            throw new errors_1.APIError('Failed to fetch Clanker launches', {
                error: error.message,
                endpoint: '/launches',
            });
        }
    }
}
exports.ClankerScraper = ClankerScraper;
class BankrScraper {
    constructor(apiUrl) {
        this.client = new http_client_1.RetryClient(apiUrl);
    }
    async fetchLatestLaunches(limit = 20) {
        try {
            logger_1.default.debug('Fetching Bankr launches', { limit });
            // TODO: Replace with actual Bankr API endpoint
            const response = await this.client.get('/new-tokens', {
                params: { limit, chain: 'base', sortBy: 'newest' },
            });
            if (!response.data || !Array.isArray(response.data)) {
                throw new errors_1.ValidationError('Invalid Bankr response format', { response: response.data });
            }
            return response.data.map((item) => ({
                contractAddress: item.contractAddress || item.address,
                name: item.name,
                symbol: item.symbol,
                launchTime: item.launchTime || item.createdAt,
                creatorAddress: item.creatorAddress || item.deployer,
                initialLiquidity: item.liquidity,
                totalSupply: item.supply,
                source: 'bankr',
            }));
        }
        catch (error) {
            throw new errors_1.APIError('Failed to fetch Bankr launches', {
                error: error.message,
                endpoint: '/new-tokens',
            });
        }
    }
}
exports.BankrScraper = BankrScraper;
//# sourceMappingURL=launchers.js.map