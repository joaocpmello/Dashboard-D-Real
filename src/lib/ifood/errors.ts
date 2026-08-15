// Erro tipado do iFood. Detalhes NÃO devem vazar ao cliente HTTP do nosso app.
export class IfoodError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'IfoodError';
  }
}

export class IfoodAuthError extends IfoodError {
  constructor(message = 'Falha de autenticação com iFood') {
    super(401, 'IFOOD_AUTH', message);
    this.name = 'IfoodAuthError';
  }
}

export class IfoodRateLimitError extends IfoodError {
  constructor(public readonly retryAfterSec?: number) {
    super(429, 'IFOOD_RATE_LIMIT', 'Rate limit iFood');
    this.name = 'IfoodRateLimitError';
  }
}
