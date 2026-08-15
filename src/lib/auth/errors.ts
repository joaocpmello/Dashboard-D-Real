// Erros semânticos — handlers podem converter para HTTP status apropriado.
export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = 'Não autenticado') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = 'Acesso negado') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
