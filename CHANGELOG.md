# تاریخچه تغییرات پروژه (CHANGELOG.md)

تمامی تغییرات قابل‌توجه این پروژه به تفکیک مراحل و نسخه‌ها در این فایل ثبت می‌شوند.

---

## [v0.4.0] — ۲۰۲۶-۱۱-۰۷ (Core RTL Layouts: DashboardLayout & PublicInvitationLayout)

### افزوده شده (Added)
- **پوسته اصلی پنل کاربری و مدیریت (`src/layouts/DashboardLayout.tsx`):**
  - پیاده‌سازی چیدمان راست‌به‌چپ (`dir="rtl"`) با فونت `Vazirmatn` و اعداد هم‌عرض (`tabular-nums`).
  - سایدبار دسکتاپ در سمت راست و دراور کشویی ریسپانسیو موبایل با رعایت حداقل ابعاد لمسی `44px`.
  - ناوبری هوشمند مبتنی بر نقش (`USER` در برابر `ADMIN`) شامل بخش‌های میز کار میزبان، دعوت‌نامه‌های من، ساخت دعوت‌نامه جدید (`۵۰٬۰۰۰ تومان`)، گالری قالب‌ها، مهمانان و RSVP، و بخش مدیریت سامانه.
  - پیاده‌سازی سوییچر زنده ۴ وضعیت استاندارد رابط کاربری (`Populated`, `Loading Skeleton`, `Empty State`, `Error State`).
- **پوسته صفحه عمومی دعوت‌نامه دیجیتال (`src/layouts/PublicInvitationLayout.tsx`):**
  - طراحی Mobile-First و تشریفاتی برای آدرس‌های مسیرمحور (`/i/:slug` مانند `https://example.ir/i/dayan123`).
  - پیاده‌سازی پاکت دعوت‌نامه تعاملی با مهر موم طلایی («گشودن کارت دعوت») و کنترل شناور پخش موسیقی.
  - پشتیبانی از ۴ تم تشریفاتی (`طلایی سلطنتی`, `زمرد ایرانی`, `رز مخملی`, `عاجی رسمی`) و سوییچ نمای موبایل/تمام‌صفحه.
  - بخش‌های تاریخ شمسی، شمارش معکوس زنده هم‌عرض، مسیریابی با نشان/بلد/گوگل‌مپ و فرم تعاملی ثبت حضور مهمانان (RSVP).
- **ابزارهای تایپوگرافی فارسی و تست‌های واحد (`src/layouts/rtl-utils.ts` & `src/layouts/layouts.test.ts`):**
  - افزودن ۵ تست خودکار جدید (مجموعاً ۲۰ تست موفق در کل پروژه).

---

## [v0.3.0] — ۲۰۲۶-۱۱-۰۷ (Phase 2 — Database Foundation: Auth & Users Entities, Migrations & Repositories)

### افزوده شده (Added)
- ایجاد دایرکتوری‌های `src/server/db/entities`، `src/server/db/migrations`، `src/server/db/repositories` و `src/server/db/seed`.
- مایگریشن `001_auth_and_users.sql`، `MigrationRunner`، موجودیت‌های احراز هویت و ریپازیتوری‌های `RolesRepository`، `PermissionsRepository`، `UsersRepository` و `UserSessionsRepository`.

---

## [v0.2.0] — ۲۰۲۶-۱۱-۰۶ (Phase 1 — Project Foundation)

### افزوده شده (Added)
- راه‌اندازی سرور یکپارچه Express 4 + Vite Middleware، مدیریت خطای متمرکز، لاگر ساختاریافته، ESLint/Prettier و فایل‌های Docker.

---

## [v0.1.0] — ۲۰۲۶-۱۱-۰۶ (Phase 0 — Discovery & Planning)

### افزوده شده (Added)
- مستندات معماری، طراحی ۲۱ جدول دیتابیس، قراردادهای API و مشخصات دامنه.
