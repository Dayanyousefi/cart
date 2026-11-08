# پلتفرم دعوتنامه دیجیتال «ایوان» (Eyvan Digital Invitation SaaS)

یک پلتفرم SaaS چندکاربره، فارسی و راستچین (RTL) برای طراحی، شخصیسازی، فروش و مدیریت دعوتنامههای دیجیتال (عروسی، نامزدی، تولد، مهمانی، افتتاحیه و رویدادهای رسمی) ویژه بازار ایران با لینک اختصاصی مسیرمحور (`/i/:slug`)، سیستم ثبت پاسخ مهمانان (RSVP) و درگاه پرداخت ایرانی.

---

## ۱. وضعیت فعلی پروژه

- **فاز فعلی:** `Phase 0 — Discovery & Planning` (**تکمیل شده**)
- **نسخه مستندات و معماری:** `v0.1.0`
- **وضعیت اجرای سرور پیشنمایش:** داشبورد تعاملی بررسی معماری، ERD دیتابیس، قراردادهای API، تصمیمات فنی (ADR) و آزمایشگاه قوانین دامنه روی پورت `3000` فعال است.

---

## ۲. معماری کلان و فناوریهای منتخب

این پروژه بر پایه الگوی **Modular Monolith** طراحی شده است تا ضمن پرهیز از پیچیدگیهای غیرضروری Microservices در نسخه اول، امکان اجرای یکپارچه در محیط **Google AI Studio** (پورت `3000`) و استقرار تجاری روی **سرور اختصاصی لینوکس (Ubuntu 24.04 VPS)** با Docker Compose و Nginx را فراهم کند:

| لایه | فناوری منتخب در محیط استقرار (VPS) | تطبیق در محیط پیشنمایش (AI Studio) |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Tailwind CSS v4 + Vite | اجرای یکپارچه از طریق Vite Middleware روی Express |
| **Backend API** | Node.js + Express + TypeScript (لایهبندی Controller / Service / Repository) | اجرای همزمان در `server.ts` روی پورت `3000` |
| **Database** | PostgreSQL 16 + Drizzle ORM / Prisma Migrations | پشتیبانی از Cloud SQL PostgreSQL یا لایه Repository سازگار |
| **Cache & Queue** | Redis 7 + BullMQ Worker | آداپتور دوگانه (`InMemoryQueueAdapter` / `BullMQAdapter`) |
| **Payment** | درگاه پرداخت ایرانی (زرینپال / زیبال) با الگوی Adapter | `MockIranianGatewayAdapter` تا زمان دریافت کلید واقعی درگاه |
| **Storage** | S3-Compatible Object Storage (آروانکلاد / MinIO) | آداپتور فایل محلی/ابری با بررسی MIME و امضای بایتها |

---

## ۳. ساختار پوشههای پروژه (تطبیقیافته و قابلاجرا)

به دلیل اجرای اپلیکیشن در محیط کانتینری استاندارد Node.js و Vite، بهجای تحمیل پیچیدگی Monorepo سنگین (Turborepo/Nx) که بیلد محیط AI Studio را مختل میکند، معماری **Modular Monolith در قالب پکیج واحد** پیادهسازی میشود:

```text
/
├── src/
│   ├── architecture/          # مشخصات دامنه، مدلها، قوانین قیمتگذاری و اسنپشات (قابل تست با node:test)
│   ├── components/            # کامپوننتهای رابط کاربری و Design System
│   ├── features/              # ماژولهای فرانتاند (Auth, Builder, Dashboard, Admin, PublicInvitation)
│   ├── server/                # کدهای سمت سرور (در فاز ۱ به بعد فعال میشود)
│   │   ├── modules/           # ماژولهای دامنه (auth, users, templates, invitations, rsvp, orders, payments, admin, analytics)
│   │   ├── adapters/          # آداپتورهای درگاه پرداخت، ذخیرهسازی، کش و صف
│   │   ├── middleware/        # احراز هویت، RBAC، Rate Limiter، مدیریت خطای متمرکز
│   │   └── db/                # اسکیما، مایگریشنها و Seed دیتابیس
│   ├── App.tsx                # ورودی اصلی فرانتاند
│   └── main.tsx               # نقطه اتصال React DOM
├── docs/                      # مستندات کامل مهندسی و تصمیمات معماری (ADR)
├── infrastructure/            # فایلهای Docker, Nginx و اسکریپتهای استقرار VPS (در فاز ۱ و ۱۵)
├── README.md                  # راهنمای جامع پروژه
├── ARCHITECTURE.md            # معماری فنی و ارتباط ماژولها
├── DATABASE.md                # طراحی ۲۱ جدول دیتابیس، روابط ERD و ایندکسها
├── API.md                     # قراردادهای REST API و نمونه Payloadها
├── SECURITY.md                # الزامات امنیتی، جلوگیری از IDOR/XSS/CSRF و امنیت پرداخت
├── ROADMAP.md                 # نقشه راه اجرایی فاز ۰ تا فاز ۱۶
├── DEPLOYMENT.md              # راهنمای استقرار روی Ubuntu 24.04 با Docker و Nginx
├── STATUS.md                  # گزارش وضعیت واقعی مراحل، تستها و اقدامات بعدی
├── CHANGELOG.md               # تاریخچه تغییرات نسخهها
├── MANUAL-TESTS.md            # چکلیست تستهای دستی کارفرما در هر فاز
├── KNOWN-ISSUES.md            # محدودیتهای محیطی و ریسکهای فنی ثبتشده
└── .env.example               # الگوی متغیرهای محیطی بدون اطلاعات حساس
```

---

## ۴. راهنمای نصب و اجرا

### پیشنمایش و توسعه
```bash
# ۱. نصب وابستگیها
npm install

# ۲. کپی فایل متغیرهای محیطی
cp .env.example .env

# ۳. اجرای تستهای واحد منطق دامنه و معماری
npx --yes tsx --test src/architecture/specs.test.ts

# ۴. بررسی صحت تایپهای TypeScript
npm run lint

# ۵. اجرای سرور توسعه روی پورت 3000
npm run dev
```

---

## ۵. فهرست مستندات مرجع داخل مخزن

1. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — معماری فنی، الگوی Modular Monolith و آداپتورها
2. [`docs/ADR.md`](./docs/ADR.md) — ثبت تصمیمات معماری (ADR-001 تا ADR-008)
3. [`DATABASE.md`](./DATABASE.md) — طراحی دیتابیس، ERD، ایندکسها و سیاستهای تراکنش مالی
4. [`API.md`](./API.md) — مستندات کامل Endpointهای REST API
5. [`SECURITY.md`](./SECURITY.md) — استانداردهای امنیتی و کنترل دسترسی
6. [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md) — سیستم طراحی رابط کاربری فارسی (RTL)
7. [`ROADMAP.md`](./ROADMAP.md) — نقشه راه خردشده فاز ۰ تا ۱۶
8. [`DEPLOYMENT.md`](./DEPLOYMENT.md) — راهنمای استقرار Production روی VPS
9. [`STATUS.md`](./STATUS.md) — وضعیت فعلی پروژه و گزارش فاز ۰
10. [`MANUAL-TESTS.md`](./MANUAL-TESTS.md) — راهنمای تستهای دستی کارفرما
11. [`KNOWN-ISSUES.md`](./KNOWN-ISSUES.md) — محدودیتهای فنی و ریسکها
