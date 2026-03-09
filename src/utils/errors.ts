export class BotError extends Error {
  constructor(message: string, public code: string, public context?: Record<string, any>) {
    super(message);
    this.name = 'BotError';
  }
}

export class APIError extends BotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'API_ERROR', context);
    this.name = 'APIError';
  }
}

export class DatabaseError extends BotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DB_ERROR', context);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends BotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends BotError {
  constructor(message: string, public retryAfter: number, context?: Record<string, any>) {
    super(message, 'RATE_LIMIT', context);
    this.name = 'RateLimitError';
  }
}
