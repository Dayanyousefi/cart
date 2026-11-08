# راهنمای استقرار روی سرور اختصاصی (DEPLOYMENT.md)

این سند معماری استقرار نسخه تجاری (Production) پلتفرم دعوتنامه دیجیتال «ایوان» را روی سرور **Ubuntu 24.04 LTS VPS** با استفاده از Docker Compose، Nginx، PostgreSQL 16 و Redis 7 تشریح میکند.

---

## ۱. توپولوژی استقرار Production روی VPS

```text
                        Internet (HTTPS / Port 443 & 80)
                                       |
                                       v
                 +-------------------------------------------+
                 |     Nginx Reverse Proxy & SSL Termination |
                 |  - Let's Encrypt TLS 1.3                  |
                 |  - Static Assets & /i/:slug Micro-Caching |
                 |  - Gzip / Brotli & Rate Limit Zones       |
                 +---------------------+---------------------+
                                       | (Internal Docker Network: 3000)
                                       v
                 +-------------------------------------------+
                 |       App Container (Node.js 22 LTS)      |
                 |  - Modular Monolith API + SSR Meta Engine |
                 |  - Background Queue Worker (BullMQ)       |
                 +------+--------------+--------------+------+
                        |              |              |
         +--------------+              |              +--------------+
         v                             v                             v
+------------------+         +------------------+         +--------------------+
|  PostgreSQL 16   |         |     Redis 7      |         | S3 Object Storage  |
|  - Persistent Vol|         |  - Cache & Queue |         | (ArvanCloud/MinIO) |
|  - Daily Backups |         |  - Rate Counters |         | - Media & Audio    |
+------------------+         +------------------+         +--------------------+
```

---

## ۲. مشخصات پیشنهادی سرور برای ۵۰۰ تا ۲۰۰۰ کاربر همزمان

- **سیستم عامل:** Ubuntu 24.04 LTS (64-bit)
- **پردازنده (CPU):** ۴ هسته اختصاصی (4 vCPU)
- **حافظه رم (RAM):** ۸ گیگابایت (۲ گیگابایت PostgreSQL، ۱ گیگابایت Redis، ۳ گیگابایت Node.js Cluster، ۲ گیگابایت سیستم عامل و کش Nginx)
- **دیسک:** ۸۰ گیگابایت NVMe SSD + فضای Object Storage برای تصاویر کاربران

---

## ۳. مراحل راهاندازی روی سرور (در فاز ۱ و فاز ۱۵ تکمیل و اسکریپتنویسی میشود)

### گام ۱: آمادهسازی امنیت پایه سرور Ubuntu 24.04
```bash
sudo apt update && sudo apt upgrade -y
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### گام ۲: تنظیم متغیرهای محیطی Production
1. کپی فایل `.env.example` به `.env.production`.
2. تولید کلیدهای تصادفی ۶۴ بایتی برای `JWT_ACCESS_SECRET` و `JWT_REFRESH_SECRET`:
   ```bash
   openssl rand -hex 64
   ```
3. قرار دادن `PAYMENT_MERCHANT_ID` واقعی درگاه پرداخت ایرانی و تنظیم `PAYMENT_SANDBOX_MODE="false"`.
4. تنظیم `COOKIE_SECURE="true"` و `NODE_ENV="production"`.

### گام ۳: بیلد و اجرای سرویسها با Docker Compose
```bash
docker compose -f docker-compose.yml up -d --build
```

---

## ۴. سیاست پشتیبانگیری و بازیابی (Backup & Restore)

1. **بکاپ خودکار روزانه PostgreSQL:**
   - اجرای `pg_dump -Fc` در ساعت ۰۳:۳۰ بامداد به وقت تهران، فشردهسازی و رمزنگاری فایل بکاپ و انتقال به باکت مجزای Object Storage.
2. **تست بازیابی (Restore Verification):**
   - در فاز ۱۴، اسکریپت تست بازیابی روی یک دیتابیس موقت اجرا و صحت تعداد رکوردها و قیدهای کلید خارجی بررسی میشود.
