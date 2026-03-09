"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("./logger"));
class RetryClient {
    constructor(baseURL, maxRetries = 3) {
        this.maxRetries = maxRetries;
        this.requestQueue = [];
        this.isProcessing = false;
        this.rateLimitUntil = 0;
        this.instance = axios_1.default.create({
            baseURL,
            timeout: 10000,
        });
    }
    async get(url, config) {
        return this.makeRequest(() => this.instance.get(url, config));
    }
    async post(url, data, config) {
        return this.makeRequest(() => this.instance.post(url, data, config));
    }
    async makeRequest(fn) {
        // Check rate limit
        if (Date.now() < this.rateLimitUntil) {
            const waitTime = this.rateLimitUntil - Date.now();
            logger_1.default.warn(`Rate limited, waiting ${waitTime}ms`);
            await this.sleep(waitTime);
        }
        let lastError;
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (error.response?.status === 429) {
                    const retryAfter = parseInt(error.response.headers['retry-after'] || '60') * 1000;
                    this.rateLimitUntil = Date.now() + retryAfter;
                    logger_1.default.warn(`Rate limited (429), retry after ${retryAfter}ms`);
                    await this.sleep(retryAfter);
                }
                else if (error.response?.status >= 500 || error.code === 'ECONNREFUSED') {
                    const backoff = Math.pow(2, attempt) * 1000;
                    logger_1.default.warn(`Request failed (${error.message}), retry ${attempt + 1}/${this.maxRetries} in ${backoff}ms`);
                    await this.sleep(backoff);
                }
                else {
                    throw error;
                }
            }
        }
        throw lastError;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.RetryClient = RetryClient;
//# sourceMappingURL=http-client.js.map