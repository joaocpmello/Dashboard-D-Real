import 'server-only';

type LogLevel = 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  timestamp: string;
  organizationId?: string;
  userId?: string;
}

export class Logger {
  private static readonly SERVICE_NAME = 'marmita-os-backend';

  /**
   * Log centralizado para capturar exceções e eventos de runtime.
   * Em produção, este logger pode ser conectado ao Sentry, Datadog ou CloudWatch.
   */
  static log(level: LogLevel, message: string, context: Record<string, any> = {}, error?: Error, orgId?: string, userId?: string) {
    const entry: LogEntry = {
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
      timestamp: new Date().toISOString(),
      organizationId: orgId,
      userId: userId,
    };

    // Formatação para console (estruturada)
    const color = this.getColor(level);
    console.log(
      `${color}[${entry.timestamp}] [${entry.level.toUpperCase()}] [${this.SERVICE_NAME}] ${message}`,
      entry.context ? JSON.stringify(entry.context) : '',
      entry.error ? `\nError: ${entry.error.message}\nStack: ${entry.error.stack}` : ''
    );

    // Aqui integraríamos com Sentry.captureException(error) se o nível for error ou fatal.
  }

  static info(msg: string, ctx?: Record<string, any>, orgId?: string, userId?: string) {
    this.log('info', msg, ctx, undefined, orgId, userId);
  }

  static warn(msg: string, ctx?: Record<string, any>, orgId?: string, userId?: string) {
    this.log('warn', msg, ctx, undefined, orgId, userId);
  }

  static error(msg: string, err?: Error, ctx?: Record<string, any>, orgId?: string, userId?: string) {
    this.log('error', msg, ctx, err, orgId, userId);
  }

  static fatal(msg: string, err?: Error, ctx?: Record<string, any>, orgId?: string, userId?: string) {
    this.log('fatal', msg, ctx, err, orgId, userId);
  }

  private static getColor(level: LogLevel) {
    switch (level) {
      case 'info': return '\x1b[32m'; // Green
      case 'warn': return '\x1b[33m'; // Yellow
      case 'error': return '\x1b[31m'; // Red
      case 'fatal': return '\x1b[41m\x1b[37m'; // Red bg, white text
      default: return '';
    }
  }
}
