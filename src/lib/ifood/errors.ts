// Erro tipado do iFood. Detalhes NÃO devem vazar ao cliente HTTP do nosso app.
export class IfoodError extends Error {
  readonly status: number;
  readonly code: string;
  override readonly cause: unknown;

  constructor(status: number, code: string, message: string, cause?: unknown) {
    super(message);
    this.name = 'IfoodError';
    this.status = status;
    this.code = code;
    this.cause = cause;
  }
}

export class IfoodAuthError extends IfoodError {
  constructor(message = 'Falha de autenticação com iFood') {
    super(401, 'IFOOD_AUTH', message);
    this.name = 'IfoodAuthError';
  }
}

export class IfoodRateLimitError extends IfoodError {
  readonly retryAfterSec: number | undefined;

  constructor(retryAfterSec?: number) {
    super(429, 'IFOOD_RATE_LIMIT', 'Rate limit iFood');
    this.name = 'IfoodRateLimitError';
    this.retryAfterSec = retryAfterSec;
  }
}
