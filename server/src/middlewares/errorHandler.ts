import { type Request, type Response, type NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const globalErrorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err instanceof AppError ? err.statusCode : 500;
  let message = err.message || 'حدث خطأ داخلي في الخادم.';

  // تحويل أخطاء مزود الذكاء الاصطناعي إلى رسائل مفهومة للمستخدم
  if (message.includes('503') || message.includes('UNAVAILABLE')) {
    statusCode = 503;
    message = 'خوادم الذكاء الاصطناعي مزدحمة حالياً، يرجى المحاولة بعد قليل.';
  } else if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
    statusCode = 429;
    message = 'تم تجاوز الحد المسموح من الطلبات، يرجى الانتظار دقيقة ثم المحاولة.';
  }

  console.error(`[Error ${statusCode}]: ${err.message}`);

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
