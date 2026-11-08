-- =============================================================================
-- اسکریپت مقداردهی اولیه PostgreSQL 16 (فاز ۱ — آمادهسازی اکستنشنها و تایمزون)
-- اسکیمای کامل ۲۱ جدول در فاز ۲ از طریق Migrationهای نسخهبندیشده اعمال میشود.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER DATABASE invitation_saas SET timezone TO 'Asia/Tehran';
