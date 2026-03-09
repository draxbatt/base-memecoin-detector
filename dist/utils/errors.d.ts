export declare class BotError extends Error {
    code: string;
    context?: Record<string, any> | undefined;
    constructor(message: string, code: string, context?: Record<string, any> | undefined);
}
export declare class APIError extends BotError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class DatabaseError extends BotError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class ValidationError extends BotError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class RateLimitError extends BotError {
    retryAfter: number;
    constructor(message: string, retryAfter: number, context?: Record<string, any>);
}
export declare class BlockchainError extends BotError {
    constructor(message: string, context?: Record<string, any>);
}
//# sourceMappingURL=errors.d.ts.map