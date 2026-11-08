import type { Request, Response, NextFunction } from 'express';
import { healthService } from './health.service';
import { sendSuccess } from '../../common/response';
import { AppError } from '../../common/errors';

export const healthController = {
  getHealth(_req: Request, res: Response): void {
    const report = healthService.getHealthReport();
    sendSuccess(res, report, 200);
  },

  getFoundationStatus(_req: Request, res: Response): void {
    const diagnostics = healthService.getFoundationDiagnostics();
    sendSuccess(res, diagnostics, 200);
  },

  simulateError(req: Request, _res: Response, next: NextFunction): void {
    const errorType = String(req.query.type || 'validation').toLowerCase();

    if (errorType === 'unauthorized') {
      next(
        AppError.unauthorized('توکن احراز هویت ارسال نشده یا منقضی شده است (شبیهسازی خطای 401).')
      );
      return;
    }

    if (errorType === 'forbidden') {
      next(
        AppError.forbidden(
          'دسترسی به این عملیات نیازمند نقش مدیر ارشد (ADMIN) است (شبیهسازی خطای 403).'
        )
      );
      return;
    }

    if (errorType === 'not_found') {
      next(AppError.notFound('دعوتنامه درخواستی با این شناسه یافت نشد (شبیهسازی خطای 404).'));
      return;
    }

    if (errorType === 'slug_conflict') {
      next(
        new AppError({
          statusCode: 409,
          code: 'SLUG_ALREADY_TAKEN',
          messageFa: 'این آدرس اختصاصی (/i/ali-sara) قبلاً ثبت شده است.',
          suggestions: ['ali-sara-1405', 'ali-sara-wedding'],
        })
      );
      return;
    }

    if (errorType === 'rate_limit') {
      next(AppError.tooManyRequests());
      return;
    }

    next(
      AppError.badRequest('اطلاعات ورودی فرم معتبر نیست (شبیهسازی خطای اعتبارسنجی 400).', [
        { field: 'eventTitle', issue: 'عنوان مراسم نمیتواند خالی باشد.' },
        { field: 'slug', issue: 'اسلاگ باید حداقل ۴ کاراکتر انگلیسی یا عدد باشد.' },
      ])
    );
  },
};
