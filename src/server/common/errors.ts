export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SLUG_ALREADY_TAKEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PAYMENT_VERIFICATION_FAILED'
  | 'INTERNAL_SERVER_ERROR';

export interface ErrorDetailItem {
  field?: string;
  issue: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: AppErrorCode;
  public readonly details: ErrorDetailItem[];
  public readonly suggestions: string[];
  public readonly isOperational: boolean;

  constructor(options: {
    statusCode: number;
    code: AppErrorCode;
    messageFa: string;
    details?: ErrorDetailItem[];
    suggestions?: string[];
    isOperational?: boolean;
  }) {
    super(options.messageFa);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'AppError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details ?? [];
    this.suggestions = options.suggestions ?? [];
    this.isOperational = options.isOperational ?? true;
  }

  static badRequest(messageFa: string, details: ErrorDetailItem[] = []) {
    return new AppError({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      messageFa,
      details,
    });
  }

  static unauthorized(messageFa = 'برای دسترسی به این بخش ابتدا وارد حساب کاربری خود شوید.') {
    return new AppError({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      messageFa,
    });
  }

  static forbidden(messageFa = 'شما مجوز دسترسی به این منبع را ندارید.') {
    return new AppError({
      statusCode: 403,
      code: 'FORBIDDEN',
      messageFa,
    });
  }

  static notFound(messageFa = 'منبع یا مسیر درخواستی یافت نشد.') {
    return new AppError({
      statusCode: 404,
      code: 'NOT_FOUND',
      messageFa,
    });
  }

  static tooManyRequests(
    messageFa = 'تعداد درخواستهای شما بیش از حد مجاز است. لطفاً کمی صبر کنید.'
  ) {
    return new AppError({
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      messageFa,
    });
  }
}
