# گزارش وضعیت واقعی پروژه (STATUS.md)

این فایل منبع حقیقت (Single Source of Truth) درباره وضعیت پیشرفت مراحل پروژه، فایل‌های تغییریافته، تست‌های اجراشده و اقدامات باقی‌مانده است.

---

## خلاصه وضعیت کلی نقشه راه

| شناسه مرحله | عنوان مرحله | وضعیت فعلی | درصد پیشرفت |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Discovery & Planning** | **Completed** | **۱۰۰٪** |
| **Phase 1** | **Project Foundation** | **Completed** | **۱۰۰٪** |
| **Phase 2** | **Database Foundation (Auth & Users Entities, Migrations & Repositories)** | **In Progress (Part 1 Completed)** | **۵۰٪** |
| **Phase 3** | Authentication & RBAC | Ready to Start | ۰٪ |
| **Phase 4** | **Design System & Core RTL Layouts (`DashboardLayout` & `PublicInvitationLayout`)** | **In Progress (Core Layouts Completed)** | **۶۰٪** |
| **Phase 5** | Template Management | Not Started (Planned) | ۰٪ |
| **Phase 6** | Template Engine | Not Started (Planned) | ۰٪ |
| **Phase 7** | Invitation Builder | Not Started (Planned) | ۰٪ |
| **Phase 8** | Public Invitation Page | Not Started (Planned) | ۰٪ |
| **Phase 9** | Order & Payment | Not Started (Planned) | ۰٪ |
| **Phase 10** | Guest & RSVP | Not Started (Planned) | ۰٪ |
| **Phase 11** | User Dashboard | Not Started (Planned) | ۰٪ |
| **Phase 12** | Admin Panel | Not Started (Planned) | ۰٪ |
| **Phase 13** | Security & Optimization | Not Started (Planned) | ۰٪ |
| **Phase 14** | QA & Final Testing | Not Started (Planned) | ۰٪ |
| **Phase 15** | Production Deployment | Not Started (Planned) | ۰٪ |
| **Phase 16** | Future Expansion | Not Started (Planned) | ۰٪ |

---

## جزئیات گام انجام‌شده: `پوسته‌های اصلی برنامه (DashboardLayout و PublicInvitationLayout با فونت Vazirmatn و RTL)`

- **عنوان:** ایجاد ساختار Layoutهای اصلی برنامه شامل `DashboardLayout` (پنل میزبان و مدیریت RBAC) و `PublicInvitationLayout` (صفحه عمومی دعوت‌نامه `/i/:slug`) با فونت `Vazirmatn` و سیستم چیدمان راست‌به‌چپ (`RTL`)
- **وضعیت:** `Completed`
- **فایل‌های ایجاد یا ویرایش‌شده در این گام:**
  - `/src/index.css` (تنظیم متغیرهای تم `--font-sans: 'Vazirmatn'` و `--font-mono: 'IBM Plex Mono'`، قوانین پایه `dir="rtl"`، کلاس `.font-vazirmatn`، `.tabular-nums` و کادر تشریفاتی `.ceremonial-double-border`)
  - `/src/layouts/rtl-utils.ts` (توابع خالص و تست‌پذیر `toPersianDigits`، `formatToman`، `buildPublicInvitationUrl` برای آدرس‌های مسیرمحور `/i/:slug` با `direction: 'ltr'`، `resolveDashboardNavItems` برای منوی RBAC و `getCeremonyThemePalette` برای ۴ تم تشریفاتی کارت دعوت)
  - `/src/layouts/DashboardLayout.tsx` (پوسته اصلی داشبورد میزبان و پنل ادمین با سایدبار راست‌به‌چپ دسکتاپ، دراور کشویی موبایل با اهداف لمسی حداقل `44px`، سوییچر نقش کاربری `USER`/`ADMIN`، و پشتیبانی کامل از ۴ وضعیت استاندارد داده: `POPULATED`, `LOADING`, `EMPTY`, `ERROR`)
  - `/src/layouts/PublicInvitationLayout.tsx` (پوسته صفحه عمومی دعوت‌نامه `/i/:slug` با پاکت دعوت‌نامه تعاملی و مهر موم طلایی، کنترل شناور موسیقی، ۴ تم تشریفاتی، تاریخ شمسی و شمارش معکوس هم‌عرض، دکمه‌های مسیریابی نشان/بلد/گوگل‌مپ و فرم ثبت حضور مهمان RSVP)
  - `/src/layouts/index.ts` (اکسپورت یکپارچه کامپوننت‌ها و ابزارهای Layout)
  - `/src/layouts/layouts.test.ts` (۵ تست واحد برای راستی‌آزمایی منطق RTL، فرمت تومان، آدرس `/i/:slug`، منوی RBAC و وجود `dir="rtl"` و `Vazirmatn`)
  - `/src/App.tsx` و `/package.json` (اتصال زنده هر دو Layout به عنوان نماهای اصلی برنامه و افزودن تست‌ها به اسکریپت `npm test`)

- **تست‌های اجراشده و نتیجه واقعی:**
  | نوع تست | شرح تست اجراشده | وضعیت | نتیجه واقعی |
  | :--- | :--- | :--- | :--- |
  | **Unit & Integration Tests (`node:test`)** | اجرای `npm test` شامل ۲۰ تست (`specs.test.ts` + `foundation.test.ts` + `auth-db.test.ts` + `layouts.test.ts`) | **Executed** | **Passed (20/20 موفق)** |
  | **TypeScript & ESLint Check** | اجرای `npm run lint` (`tsc --noEmit && eslint .`) | **Executed** | **Passed (0 Errors)** |
  | **Prettier Format Check** | اجرای `npm run format:check` | **Executed** | **Passed (Clean)** |
  | **Production Build Check** | اجرای `npm run build` (`vite build`) | **Executed** | **Passed (0 Errors)** |
  | **Browser & Mobile/Desktop RTL Verification** | بررسی زنده `DashboardLayout` و `PublicInvitationLayout` در مرورگر Chromium در ابعاد دسکتاپ (`1440x900`) و موبایل (`375x812`) | **Executed** | **Passed (0 Console Errors)** |
