"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainError = exports.RateLimitError = exports.ValidationError = exports.DatabaseError = exports.APIError = exports.BotError = void 0;
class BotError extends Error {
    constructor(message, code, context) {
        super(message);
        this.code = code;
        this.context = context;
        this.name = 'BotError';
    }
}
exports.BotError = BotError;
class APIError extends BotError {
    constructor(message, context) {
        super(message, 'API_ERROR', context);
        this.name = 'APIError';
    }
}
exports.APIError = APIError;
class DatabaseError extends BotError {
    constructor(message, context) {
        super(message, 'DB_ERROR', context);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
class ValidationError extends BotError {
    constructor(message, context) {
        super(message, 'VALIDATION_ERROR', context);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class RateLimitError extends BotError {
    constructor(message, retryAfter, context) {
        super(message, 'RATE_LIMIT', context);
        this.retryAfter = retryAfter;
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
class BlockchainError extends BotError {
    constructor(message, context) {
        super(message, 'BLOCKCHAIN_ERROR', context);
        this.name = 'BlockchainError';
    }
}
exports.BlockchainError = BlockchainError;
//# sourceMappingURL=errors.js.map