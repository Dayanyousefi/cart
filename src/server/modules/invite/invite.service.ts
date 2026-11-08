import { eq, desc } from 'drizzle-orm';
import { db } from '../../../db/index.ts';
import {
  users,
  templateCategories,
  templates,
  templateVersions,
  mediaAssets,
  events,
  guests,
  invitationTokens,
  rsvpResponses,
  orders,
  subscriptions,
  coupons,
  platformSettings,
  auditLogs,
} from '../../../db/schema.ts';
import {
  INITIAL_MASTER_TEMPLATES,
  validateTemplateSchema,
} from '../../../modules/template-engine/template-schema.ts';

let isSeeded = false;

export async function ensureInviteDatabaseSeeded(): Promise<void> {
  if (isSeeded) return;
  try {
    const existingTemplates = await db.select().from(templates).limit(1);
    if (existingTemplates.length > 0) {
      isSeeded = true;
      return;
    }

    // 1. Seed Users (Admin + Creator) matching src/db/schema.ts
    const [adminUser] = await db
      .insert(users)
      .values({
        uid: 'seed_admin_uid_001',
        email: 'admin@invite-luxury.ir',
        fullName: 'سهراب سپهری (مدیر ارشد پلتفرم)',
        phoneNumber: '09121112233',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        subscriptionPlan: 'STUDIO_AGENCY',
      })
      .onConflictDoNothing()
      .returning();

    const [hostUser] = await db
      .insert(users)
      .values({
        uid: 'seed_host_uid_002',
        email: 'dorsa.kaveh@invite-luxury.ir',
        fullName: 'درسا و کاوه (میزبان عروسی سلطنتی)',
        phoneNumber: '09123334455',
        role: 'USER',
        status: 'ACTIVE',
        subscriptionPlan: 'ATELIER_PRO',
      })
      .onConflictDoNothing()
      .returning();

    const adminUid = adminUser?.uid || 'seed_admin_uid_001';
    const adminEmail = adminUser?.email || 'admin@invite-luxury.ir';
    const hostUid = hostUser?.uid || 'seed_host_uid_002';

    // 2. Seed Template Categories
    await db
      .insert(templateCategories)
      .values([
        {
          slug: 'wedding',
          nameFa: 'عروسی سلطنتی و کلاسیک ایرانی',
          nameEn: 'Royal Persian Wedding',
          nameAr: 'حفل زفاف ملكي فارسي',
          descriptionFa:
            'طراحی‌های فاخر با تذهیب زرین، تایپوگرافی نستعلیق و پالت عاجی و طلایی شامپاینی',
          sortOrder: 1,
          isActive: true,
        },
        {
          slug: 'minimal',
          nameFa: 'عروسی مینیمال اروپایی',
          nameEn: 'Minimal Editorial Wedding',
          nameAr: 'زفاف مينيمالي أنيق',
          descriptionFa: 'چیدمان‌های خلوت مجله‌ای با فضای سفید سخاوتمندانه و تایپوگرافی مدرن',
          sortOrder: 2,
          isActive: true,
        },
        {
          slug: 'emerald-luxury',
          nameFa: 'مراسم لوکس زمردی و نامزدی',
          nameEn: 'Emerald Luxury & Gala',
          nameAr: 'حفلات الزمرد الفاخرة',
          descriptionFa: 'ترکیب باشکوه سبز زمردی تیره (#1E4D3B) و طلایی شامپاینی برای شب‌های مجلل',
          sortOrder: 3,
          isActive: true,
        },
        {
          slug: 'floral-romantic',
          nameFa: 'عاشقانه و گل‌آرایی آبرنگی',
          nameEn: 'Floral Romantic Garden',
          nameAr: 'حديقة الزهور الرومانسية',
          descriptionFa: 'طرح‌های لطیف باغ رز، شکوفه‌های بهاری و پاکت‌های موم‌دار دست‌ساز',
          sortOrder: 4,
          isActive: true,
        },
        {
          slug: 'birthday',
          nameFa: 'تولد و سالگرد مدرن اختصاصی',
          nameEn: 'Modern Soirée & Milestone',
          nameAr: 'أعياد ميلاد واحتفالات خاصة',
          descriptionFa: 'دعوت‌نامه‌های شبانه و مدرن برای جشن‌های تولد و سالگردهای خاص',
          sortOrder: 5,
          isActive: true,
        },
      ])
      .onConflictDoNothing();

    // 3. Seed the 5 Validated Master Templates & Template Versions
    for (const masterTpl of INITIAL_MASTER_TEMPLATES) {
      const validation = validateTemplateSchema(masterTpl);
      const validSchema = validation.valid && validation.data ? validation.data : masterTpl;

      const [insertedTpl] = await db
        .insert(templates)
        .values({
          slug: validSchema.slug,
          categorySlug: validSchema.categorySlug,
          titleFa: validSchema.localizedMeta.fa.title,
          titleEn: validSchema.localizedMeta.en.title,
          titleAr: validSchema.localizedMeta.ar.title,
          priceToman: validSchema.priceToman,
          priceUsd: validSchema.priceUsd,
          isFree: validSchema.isFree,
          status: validSchema.status,
          currentVersion: validSchema.versionNumber,
          openingSceneType: validSchema.openingSequence.envelopeStyle,
          primaryColorHex: validSchema.palette.accentGoldHex,
          accentColorHex: validSchema.palette.accentSecondaryHex,
          backgroundColorHex: validSchema.palette.backgroundHex,
          schemaJson: JSON.stringify(validSchema),
        })
        .onConflictDoNothing()
        .returning();

      if (insertedTpl) {
        await db.insert(templateVersions).values({
          templateId: insertedTpl.id,
          versionNumber: validSchema.versionNumber,
          changelog: 'نسخه اولیه استاندارد موتور قالب INVITÉ با اعتبارسنجی Zod',
          schemaSnapshotJson: JSON.stringify(validSchema),
          createdByUid: adminUid,
        });
      }
    }

    // 4. Seed Media Assets (Music, Sound Effects, Fonts, Ornamental Assets)
    await db
      .insert(mediaAssets)
      .values([
        {
          assetType: 'MUSIC',
          slug: 'persian-santoor-serenade',
          titleFa: 'نغمه سنتور و چنگ ایرانی (اصیل و تشریفاتی)',
          titleEn: 'Persian Santoor & Harp Serenade',
          category: 'Iranian Classical',
          durationSeconds: 145,
          synthPresetJson: JSON.stringify({ bpm: 68, key: 'D Minor', defaultVolume: 0.75 }),
          isActive: true,
        },
        {
          assetType: 'MUSIC',
          slug: 'ambient-champagne-piano',
          titleFa: 'پیانو شامپاینی مینیمال (مدرن و آرام)',
          titleEn: 'Ambient Champagne Grand Piano',
          category: 'Modern Minimal',
          durationSeconds: 180,
          synthPresetJson: JSON.stringify({ bpm: 74, key: 'C Major', defaultVolume: 0.7 }),
          isActive: true,
        },
        {
          assetType: 'SFX',
          slug: 'sfx-wax-seal-crack',
          titleFa: 'صدای شکستن مُهر موم طلایی (3D Wax Seal Crack)',
          titleEn: 'Luxury Wax Seal Crisp Fracture',
          category: 'Envelope Interaction',
          durationSeconds: 1,
          synthPresetJson: JSON.stringify({ triggerScene: 'SCENE_2_WAX_SEAL_BREAKING' }),
          isActive: true,
        },
        {
          assetType: 'SFX',
          slug: 'sfx-envelope-flap-rustle',
          titleFa: 'خش‌خش کاغذ کتان سلطنتی (Cotton Paper Rustle)',
          titleEn: 'Cotton Envelope Flap Rustle',
          category: 'Paper Interaction',
          durationSeconds: 1,
          synthPresetJson: JSON.stringify({ triggerScene: 'SCENE_3_FLAP_OPENING' }),
          isActive: true,
        },
        {
          assetType: 'FONT',
          slug: 'font-vazirmatn-variable',
          titleFa: 'فونت وزیرمتن (Vazirmatn Variable — Persian & Arabic)',
          titleEn: 'Vazirmatn Variable Persian/Arabic',
          category: 'Persian Typography',
          durationSeconds: 0,
          synthPresetJson: JSON.stringify({ script: 'Persian/Arabic', rtl: true }),
          isActive: true,
        },
        {
          assetType: 'FONT',
          slug: 'font-cormorant-garamond',
          titleFa: 'فونت Cormorant Garamond (Luxury Editorial Serif)',
          titleEn: 'Cormorant Garamond Luxury Serif',
          category: 'Latin Typography',
          durationSeconds: 0,
          synthPresetJson: JSON.stringify({ script: 'Latin', rtl: false }),
          isActive: true,
        },
        {
          assetType: 'ASSET',
          slug: 'asset-royal-gold-arch',
          titleFa: 'کادر اسلیمی و طاق زرکوب ایرانی',
          titleEn: 'Royal Persian Gold Foil Arch',
          category: 'Ornamental Vector',
          durationSeconds: 0,
          synthPresetJson: JSON.stringify({ borderStyle: 'PERSIAN_ARCH' }),
          isActive: true,
        },
      ])
      .onConflictDoNothing();

    // 5. Seed Initial Luxury Event (User Project Instance)
    const allTplRows = await db.select().from(templates);
    const royalTemplate = allTplRows[0];
    const royalSchema = INITIAL_MASTER_TEMPLATES[0];

    const [seededEvent] = await db
      .insert(events)
      .values({
        ownerUid: hostUid,
        templateId: royalTemplate.id,
        slug: 'royal-niavaran-1405',
        titleFa: 'آیین پیوند درسا و کاوه — عمارت باغ فردوس نیاوران',
        titleEn: 'Royal Wedding of Dorsa & Kaveh — Niavaran Gardens',
        hostsHeadlineFa: 'درسا فرهمند و کاوه نیاوران',
        hostsHeadlineEn: 'Dorsa Farahmand & Kaveh Niavaran',
        eventDateJalali: 'پنج‌شنبه ۲۴ اردیبهشت ۱۴۰۵',
        eventDateIso: '2026-05-14T19:30:00.000Z',
        eventTimeText: 'ساعت ۱۹:۳۰ الی ۲۳:۳۰',
        venueTitleFa: 'عمارت تاریخی باغ فردوس نیاوران، تالار آینه',
        venueAddressFa: 'تهران، خیابان ولیعصر، نرسیده به میدان تجریش، عمارت باغ فردوس',
        latitude: '35.8026',
        longitude: '51.4258',
        status: 'PUBLISHED',
        openingSceneConfigJson: JSON.stringify(royalSchema.openingSequence),
        audioConfigJson: JSON.stringify(royalSchema.audioConfig),
        canvasStateJson: JSON.stringify({
          version: 1,
          canvasWidth: royalSchema.canvasWidth,
          canvasHeight: royalSchema.canvasHeight,
          elements: royalSchema.elements,
        }),
        versionHistoryJson: JSON.stringify([
          {
            versionId: 'v_init_1',
            label: 'ایجاد اولیه از قالب عروسی سلطنتی ایرانی',
            savedAt: new Date().toISOString(),
          },
        ]),
        viewsCount: 148,
      })
      .onConflictDoNothing()
      .returning();

    if (seededEvent) {
      // 6. Seed Private Guests & Unique Invitation Tokens (Never expose private guest list publicly!)
      const [guest1, guest2, guest3] = await db
        .insert(guests)
        .values([
          {
            eventId: seededEvent.id,
            fullName: 'جناب آقای دکتر سهراب سپهری و بانو',
            salutationFa: 'حضور گرامی جناب آقای دکتر سهراب سپهری و خانواده محترم',
            phoneOrEmail: '09121002030',
            maxCompanions: 4,
            vipTag: 'VIP_ROYAL',
          },
          {
            eventId: seededEvent.id,
            fullName: 'سرکار خانم آناهیتا رادمهر',
            salutationFa: 'دیدارتان مایه شادمانی ماست، سرکار خانم آناهیتا رادمهر عزیز',
            phoneOrEmail: '09124005060',
            maxCompanions: 2,
            vipTag: 'VIP',
          },
          {
            eventId: seededEvent.id,
            fullName: 'جناب آقای مهندس امیرحسین تابش',
            salutationFa: 'مقدم فرخنده جناب آقای مهندس امیرحسین تابش گرامی',
            phoneOrEmail: '09127008090',
            maxCompanions: 3,
            vipTag: 'STANDARD',
          },
        ])
        .returning();

      await db
        .insert(invitationTokens)
        .values([
          {
            eventId: seededEvent.id,
            guestId: guest1.id,
            token: 'inv_tok_sepehri',
            openedCount: 5,
            lastOpenedAt: new Date(),
            isRevoked: false,
          },
          {
            eventId: seededEvent.id,
            guestId: guest2.id,
            token: 'inv_tok_radmehr',
            openedCount: 2,
            lastOpenedAt: new Date(),
            isRevoked: false,
          },
          {
            eventId: seededEvent.id,
            guestId: guest3.id,
            token: 'inv_tok_tabesh',
            openedCount: 0,
            isRevoked: false,
          },
        ])
        .onConflictDoNothing();

      // 7. Seed Initial RSVP Responses
      await db.insert(rsvpResponses).values([
        {
          eventId: seededEvent.id,
          guestId: guest1.id,
          invitationToken: 'inv_tok_sepehri',
          guestName: 'دکتر سهراب سپهری و بانو',
          attendanceStatus: 'ATTENDING',
          guestCount: 2,
          dietaryOrCustomAnswer: 'پذیرایی کامل سلطنتی (معمول) | رزرو پارکینگ VIP',
          messageToHosts: 'با آرزوی خوشبختی ابدی و روزگاری پر از مهر برای درسا و کاوه عزیز.',
        },
        {
          eventId: seededEvent.id,
          guestId: guest2.id,
          invitationToken: 'inv_tok_radmehr',
          guestName: 'آناهیتا رادمهر',
          attendanceStatus: 'ATTENDING',
          guestCount: 2,
          dietaryOrCustomAnswer: 'منوی گیاه‌خواری (Vegetarian) | رزرو پارکینگ VIP',
          messageToHosts: 'بی‌صبرانه منتظر دیدار شما در این شب رویایی هستم!',
        },
      ]);

      // 8. Seed Orders, Subscriptions, Coupons, Platform Settings, and Audit Logs
      await db
        .insert(orders)
        .values([
          {
            orderNumber: 'INV-1405-8841',
            ownerUid: hostUid,
            eventId: seededEvent.id,
            planOrItemTitle: 'قالب عروسی سلطنتی ایرانی — پکیج کامل',
            baseAmountToman: 50000,
            discountAmountToman: 0,
            finalAmountToman: 50000,
            couponCode: '',
            status: 'PAID',
            gatewayProvider: 'ZARINPAL',
            gatewayRefId: 'ZP_9948271645',
          },
          {
            orderNumber: 'INV-1405-8842',
            ownerUid: adminUid,
            eventId: seededEvent.id,
            planOrItemTitle: 'قالب زمردی مجلل — با کد تخفیف INVITE20',
            baseAmountToman: 95000,
            discountAmountToman: 19000,
            finalAmountToman: 76000,
            couponCode: 'INVITE20',
            status: 'PAID',
            gatewayProvider: 'ZIBAL',
            gatewayRefId: 'ZB_773190442',
          },
        ])
        .onConflictDoNothing();
    }

    await db.insert(subscriptions).values([
      {
        ownerUid: hostUid,
        tierCode: 'ATELIER_PRO',
        titleFa: 'اشتراک میزبان سلطنتی (پشتیبانی از توکن اختصاصی مهمان و استودیوی ۳بعدی)',
        priceMonthlyToman: 250000,
        status: 'ACTIVE',
        renewsAtIso: new Date(Date.now() + 365 * 86400000).toISOString(),
      },
      {
        ownerUid: adminUid,
        tierCode: 'STUDIO_AGENCY',
        titleFa: 'اشتراک آتلیه و تشریفات مجالس (نامحدود)',
        priceMonthlyToman: 1450000,
        status: 'ACTIVE',
        renewsAtIso: new Date(Date.now() + 365 * 86400000).toISOString(),
      },
    ]);

    await db
      .insert(coupons)
      .values([
        {
          code: 'INVITE20',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          maxUses: 200,
          usedCount: 14,
          isActive: true,
          expiresAtIso: '2027-03-20T00:00:00.000Z',
        },
        {
          code: 'ROYAL50',
          discountType: 'PERCENTAGE',
          discountValue: 50,
          maxUses: 50,
          usedCount: 8,
          isActive: true,
          expiresAtIso: '2027-03-20T00:00:00.000Z',
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(platformSettings)
      .values([
        {
          settingKey: 'base_invitation_price_toman',
          settingValue: JSON.stringify({ value: 50000, currency: 'TOMAN', usdEquivalent: 29 }),
          labelFa: 'قیمت پایه هر دعوت‌نامه دیجیتال در بازار ایران و بین‌الملل',
          category: 'PRICING',
        },
        {
          settingKey: 'supported_locales_and_rtl',
          settingValue: JSON.stringify({
            defaultLocale: 'fa',
            locales: ['fa', 'en', 'ar'],
            rtlLocales: ['fa', 'ar'],
          }),
          labelFa: 'پشتیبانی کامل چندزبانه و راست‌به‌چپ (RTL / LTR)',
          category: 'LOCALIZATION',
        },
      ])
      .onConflictDoNothing();

    await db.insert(auditLogs).values([
      {
        actorUid: adminUid,
        actorEmail: adminEmail,
        actionCode: 'SEED_PLATFORM_TEMPLATES',
        targetEntity: 'templates',
        targetId: 'all_5_master_templates',
        detailsJson: JSON.stringify({
          count: 5,
          templates: INITIAL_MASTER_TEMPLATES.map((t) => t.slug),
        }),
      },
    ]);

    isSeeded = true;
  } catch (err) {
    console.error('Failed to seed INVITÉ PostgreSQL database:', err);
  }
}

export const inviteService = {
  async getPublicBootstrapData() {
    await ensureInviteDatabaseSeeded();
    const [catRows, tplRows, assetRows, eventRows, settingRows] = await Promise.all([
      db.select().from(templateCategories).orderBy(templateCategories.sortOrder),
      db.select().from(templates).orderBy(desc(templates.updatedAt)),
      db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)),
      db.select().from(events).orderBy(desc(events.updatedAt)),
      db.select().from(platformSettings),
    ]);

    return {
      categories: catRows,
      templates: tplRows,
      mediaAssets: assetRows,
      events: eventRows,
      settings: settingRows,
    };
  },

  async getPublicInvitationBySlug(slug: string, invitationToken?: string) {
    await ensureInviteDatabaseSeeded();
    const eventRows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
    const allEvents = eventRows.length > 0 ? eventRows : await db.select().from(events).limit(1);
    const rawEvent = allEvents[0];
    if (!rawEvent) {
      return null;
    }

    let personalizedGuest: {
      guestName: string;
      salutation: string;
      maxAllowedGuests: number;
      vipTier: string;
      token: string;
      tokenStatus: string;
    } | null = null;

    if (invitationToken) {
      const tokenRows = await db
        .select()
        .from(invitationTokens)
        .where(eq(invitationTokens.token, invitationToken))
        .limit(1);

      if (tokenRows.length > 0 && tokenRows[0].guestId) {
        const guestRows = await db
          .select()
          .from(guests)
          .where(eq(guests.id, tokenRows[0].guestId))
          .limit(1);

        if (guestRows.length > 0) {
          const g = guestRows[0];
          personalizedGuest = {
            guestName: g.fullName,
            salutation: g.salutationFa,
            maxAllowedGuests: g.maxCompanions,
            vipTier: g.vipTag,
            token: tokenRows[0].token,
            tokenStatus: tokenRows[0].isRevoked ? 'revoked' : 'active',
          };
        }
      }
    }

    // Fetch public RSVP summary statistics only (never expose private guest list!)
    const rsvpRows = await db
      .select()
      .from(rsvpResponses)
      .where(eq(rsvpResponses.eventId, rawEvent.id))
      .orderBy(desc(rsvpResponses.submittedAt));

    const attendingTotal = rsvpRows
      .filter((r) => r.attendanceStatus.toUpperCase() === 'ATTENDING')
      .reduce((acc, r) => acc + r.guestCount, 0);

    return {
      event: {
        id: rawEvent.id,
        slug: rawEvent.slug,
        title: rawEvent.titleFa,
        hostNames: rawEvent.hostsHeadlineFa,
        eventDateDisplay: `${rawEvent.eventDateJalali} — ${rawEvent.eventTimeText}`,
        venueName: rawEvent.venueTitleFa,
        venueAddress: rawEvent.venueAddressFa,
        isPublished: rawEvent.status === 'PUBLISHED',
      },
      personalizedGuest,
      publicStats: {
        totalResponses: rsvpRows.length,
        attendingGuestsCount: attendingTotal,
      },
    };
  },

  async submitGuestRsvp(payload: {
    eventId: number;
    token?: string;
    respondentName: string;
    attendanceStatus: string;
    guestCount: number;
    dietaryNotes?: string;
    customAnswersJson?: Record<string, unknown>;
    messageToHosts?: string;
  }) {
    await ensureInviteDatabaseSeeded();
    let guestId: number | null = null;

    if (payload.token) {
      const tokenRows = await db
        .select()
        .from(invitationTokens)
        .where(eq(invitationTokens.token, payload.token))
        .limit(1);

      if (tokenRows.length > 0) {
        guestId = tokenRows[0].guestId;
        await db
          .update(invitationTokens)
          .set({
            openedCount: tokenRows[0].openedCount + 1,
            lastOpenedAt: new Date(),
          })
          .where(eq(invitationTokens.id, tokenRows[0].id));
      }
    }

    const normalizedStatus =
      payload.attendanceStatus.toLowerCase() === 'declined'
        ? 'NOT_ATTENDING'
        : payload.attendanceStatus.toLowerCase() === 'maybe'
          ? 'MAYBE'
          : 'ATTENDING';

    const [createdRsvp] = await db
      .insert(rsvpResponses)
      .values({
        eventId: payload.eventId,
        guestId,
        invitationToken: payload.token || 'PUBLIC',
        guestName: payload.respondentName,
        attendanceStatus: normalizedStatus,
        guestCount: normalizedStatus === 'NOT_ATTENDING' ? 0 : Math.max(1, payload.guestCount),
        dietaryOrCustomAnswer:
          payload.dietaryNotes || JSON.stringify(payload.customAnswersJson ?? {}),
        messageToHosts: payload.messageToHosts ?? '',
      })
      .returning();

    return createdRsvp;
  },

  async saveStudioProject(payload: {
    eventId?: number;
    templateId?: number;
    title?: string;
    hostNames?: string;
    eventDateDisplay?: string;
    venueName?: string;
    venueAddress?: string;
    locale?: string;
    envelopeStyle?: string;
    waxSealMonogram?: string;
    canvasStateJson: Record<string, unknown>;
    openingSceneConfigJson?: Record<string, unknown>;
    audioConfigJson?: Record<string, unknown>;
    versionLabel?: string;
  }) {
    await ensureInviteDatabaseSeeded();
    const existingRows = payload.eventId
      ? await db.select().from(events).where(eq(events.id, payload.eventId)).limit(1)
      : await db.select().from(events).limit(1);

    if (existingRows.length > 0) {
      const target = existingRows[0];
      let currentHistory: unknown[] = [];
      try {
        currentHistory = JSON.parse(target.versionHistoryJson || '[]');
      } catch {
        currentHistory = [];
      }
      const nextHistory = [
        {
          versionId: `v_${Date.now()}`,
          label: payload.versionLabel || 'ذخیره خودکار در استودیوی طراحی INVITÉ',
          savedAt: new Date().toISOString(),
        },
        ...currentHistory.slice(0, 14),
      ];

      const [updated] = await db
        .update(events)
        .set({
          titleFa: payload.title ?? target.titleFa,
          hostsHeadlineFa: payload.hostNames ?? target.hostsHeadlineFa,
          venueTitleFa: payload.venueName ?? target.venueTitleFa,
          venueAddressFa: payload.venueAddress ?? target.venueAddressFa,
          canvasStateJson: JSON.stringify(payload.canvasStateJson),
          openingSceneConfigJson: payload.openingSceneConfigJson
            ? JSON.stringify(payload.openingSceneConfigJson)
            : target.openingSceneConfigJson,
          audioConfigJson: payload.audioConfigJson
            ? JSON.stringify(payload.audioConfigJson)
            : target.audioConfigJson,
          versionHistoryJson: JSON.stringify(nextHistory),
          updatedAt: new Date(),
        })
        .where(eq(events.id, target.id))
        .returning();

      return updated;
    }

    const tplRows = await db.select().from(templates).limit(1);
    const [created] = await db
      .insert(events)
      .values({
        ownerUid: 'seed_host_uid_002',
        templateId: payload.templateId ?? tplRows[0]?.id ?? 1,
        slug: `invite-${Date.now()}`,
        titleFa: payload.title || 'پروژه دعوت‌نامه اختصاصی جدید',
        titleEn: 'Custom Luxury Invitation Project',
        hostsHeadlineFa: payload.hostNames || 'میزبانان مراسم',
        hostsHeadlineEn: 'Event Hosts',
        eventDateJalali: payload.eventDateDisplay || 'پنج‌شنبه ۲۴ اردیبهشت ۱۴۰۵',
        eventDateIso: new Date(Date.now() + 30 * 86400000).toISOString(),
        eventTimeText: 'ساعت ۱۹:۳۰',
        venueTitleFa: payload.venueName || 'عمارت باغ فردوس نیاوران',
        venueAddressFa: payload.venueAddress || 'تهران، نیاوران',
        status: 'PUBLISHED',
        openingSceneConfigJson: JSON.stringify(payload.openingSceneConfigJson ?? {}),
        audioConfigJson: JSON.stringify(payload.audioConfigJson ?? {}),
        canvasStateJson: JSON.stringify(payload.canvasStateJson),
        versionHistoryJson: JSON.stringify([
          {
            versionId: `v_${Date.now()}`,
            label: payload.versionLabel || 'ایجاد پروژه در استودیو',
            savedAt: new Date().toISOString(),
          },
        ]),
      })
      .returning();

    return created;
  },

  async toggleEventPublish(eventId: number, isPublished: boolean, actorEmail: string) {
    await ensureInviteDatabaseSeeded();
    const [updated] = await db
      .update(events)
      .set({
        status: isPublished ? 'PUBLISHED' : 'UNPUBLISHED',
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    await db.insert(auditLogs).values({
      actorUid: 'seed_host_uid_002',
      actorEmail,
      actionCode: isPublished ? 'PUBLISH_INVITATION_EVENT' : 'UNPUBLISH_INVITATION_EVENT',
      targetEntity: 'events',
      targetId: String(eventId),
      detailsJson: JSON.stringify({ isPublished }),
    });

    return {
      id: updated.id,
      slug: updated.slug,
      title: updated.titleFa,
      hostNames: updated.hostsHeadlineFa,
      eventDateDisplay: `${updated.eventDateJalali} — ${updated.eventTimeText}`,
      venueName: updated.venueTitleFa,
      venueAddress: updated.venueAddressFa,
      isPublished: updated.status === 'PUBLISHED',
    };
  },

  async getAdminDashboardFullData() {
    await ensureInviteDatabaseSeeded();
    const [
      userRows,
      catRows,
      tplRows,
      verRows,
      assetRows,
      eventRows,
      guestRows,
      tokenRows,
      rsvpRows,
      orderRows,
      subRows,
      couponRows,
      settingRows,
      auditRows,
    ] = await Promise.all([
      db.select().from(users).orderBy(desc(users.createdAt)),
      db.select().from(templateCategories).orderBy(templateCategories.sortOrder),
      db.select().from(templates).orderBy(desc(templates.updatedAt)),
      db.select().from(templateVersions).orderBy(desc(templateVersions.createdAt)),
      db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)),
      db.select().from(events).orderBy(desc(events.updatedAt)),
      db.select().from(guests).orderBy(desc(guests.createdAt)),
      db.select().from(invitationTokens),
      db.select().from(rsvpResponses).orderBy(desc(rsvpResponses.submittedAt)),
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt)),
      db.select().from(coupons).orderBy(desc(coupons.createdAt)),
      db.select().from(platformSettings),
      db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(50),
    ]);

    const totalRevenueToman = orderRows
      .filter((o) => o.status.toUpperCase() === 'PAID')
      .reduce((acc, o) => acc + o.finalAmountToman, 0);

    const totalRsvpAttending = rsvpRows
      .filter((r) => r.attendanceStatus.toUpperCase() === 'ATTENDING')
      .reduce((acc, r) => acc + r.guestCount, 0);

    return {
      analytics: {
        totalRevenueToman,
        totalOrdersCount: orderRows.length,
        publishedTemplatesCount: tplRows.filter((t) => t.status.toUpperCase() === 'PUBLISHED')
          .length,
        totalTemplatesCount: tplRows.length,
        activeUsersCount: userRows.length,
        activeSubscriptionsCount: subRows.filter((s) => s.status.toUpperCase() === 'ACTIVE').length,
        totalGuestsCount: guestRows.length,
        totalRsvpResponsesCount: rsvpRows.length,
        totalAttendingHeadcount: totalRsvpAttending,
      },
      users: userRows.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.fullName,
        mobileNumber: u.phoneNumber,
        role: u.role.toLowerCase(),
        status: u.status.toLowerCase(),
      })),
      categories: catRows,
      templates: tplRows.map((t) => ({
        id: t.id,
        slug: t.slug,
        nameFa: t.titleFa,
        nameEn: t.titleEn,
        status: t.status.toLowerCase(),
        priceToman: t.priceToman,
        currentVersion: t.currentVersion,
        envelopeStyle: t.openingSceneType,
        schemaJson: (() => {
          try {
            return JSON.parse(t.schemaJson);
          } catch {
            return {};
          }
        })(),
      })),
      templateVersions: verRows.map((v) => ({
        id: v.id,
        templateId: v.templateId,
        versionNumber: v.versionNumber,
        changelog: v.changelog,
        createdByEmail: v.createdByUid,
        createdAt: v.createdAt?.toISOString() || '',
      })),
      mediaAssets: assetRows.map((a) => ({
        id: a.id,
        name: a.titleFa,
        assetType: a.assetType.toLowerCase(),
        category: a.category,
        url: a.slug,
        mimeType: a.assetType,
        durationSeconds: a.durationSeconds,
      })),
      events: eventRows,
      guests: guestRows.map((g) => ({
        id: g.id,
        fullName: g.fullName,
        salutation: g.salutationFa,
        maxAllowedGuests: g.maxCompanions,
        vipTier: g.vipTag,
      })),
      invitationTokens: tokenRows.map((tk) => ({
        id: tk.id,
        guestId: tk.guestId,
        token: tk.token,
        status: tk.isRevoked ? 'revoked' : 'active',
        openedCount: tk.openedCount,
      })),
      rsvpResponses: rsvpRows.map((r) => ({
        id: r.id,
        respondentName: r.guestName,
        attendanceStatus: r.attendanceStatus.toLowerCase(),
        guestCount: r.guestCount,
        dietaryNotes: r.dietaryOrCustomAnswer,
        messageToHosts: r.messageToHosts,
      })),
      orders: orderRows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerEmail: o.ownerUid,
        finalAmountToman: o.finalAmountToman,
        status: o.status.toLowerCase(),
        gatewayProvider: o.gatewayProvider,
        couponCode: o.couponCode || null,
      })),
      subscriptions: subRows.map((s) => ({
        id: s.id,
        userEmail: s.ownerUid,
        planName: s.titleFa,
        status: s.status.toLowerCase(),
        priceToman: s.priceMonthlyToman,
        maxEventsAllowed: s.tierCode === 'STUDIO_AGENCY' ? 100 : 5,
      })),
      coupons: couponRows.map((c) => ({
        id: c.id,
        code: c.code,
        description: `کد تخفیف ${c.discountValue}% (${c.discountType})`,
        discountPercent: c.discountValue,
        maxDiscountToman: 100000,
        usedCount: c.usedCount,
        usageLimit: c.maxUses,
        isActive: c.isActive,
      })),
      settings: settingRows.map((st) => ({
        id: st.id,
        settingKey: st.settingKey,
        settingValueJson: (() => {
          try {
            return JSON.parse(st.settingValue);
          } catch {
            return { raw: st.settingValue };
          }
        })(),
        description: st.labelFa,
        updatedByEmail: 'admin@invite-luxury.ir',
      })),
      auditLogs: auditRows.map((al) => ({
        id: al.id,
        actorEmail: al.actorEmail,
        actorRole: al.actorUid,
        action: al.actionCode,
        targetType: al.targetEntity,
        targetId: al.targetId,
        createdAt: al.createdAt?.toISOString() || '',
      })),
    };
  },

  async executeAdminOperation(
    actorEmail: string,
    actorRole: string,
    operation: {
      actionType: string;
      payload: Record<string, unknown>;
    }
  ) {
    await ensureInviteDatabaseSeeded();
    const { actionType, payload } = operation;
    let resultData: unknown = null;

    if (actionType === 'UPDATE_TEMPLATE_STATUS') {
      const templateId = Number(payload.templateId);
      const status = String(payload.status || 'PUBLISHED').toUpperCase();
      const [updated] = await db
        .update(templates)
        .set({ status, updatedAt: new Date() })
        .where(eq(templates.id, templateId))
        .returning();
      resultData = updated;
    } else if (actionType === 'CREATE_OR_UPDATE_TEMPLATE') {
      const baseTpl = INITIAL_MASTER_TEMPLATES[0];
      const slug = String(payload.slug || `royal-custom-${Date.now()}`);
      const nameFa = String(payload.nameFa || 'قالب سفارشی جدید');
      const nameEn = String(payload.nameEn || 'Custom Luxury Template');
      const priceToman = Number(payload.priceToman || 75000);

      const [createdTpl] = await db
        .insert(templates)
        .values({
          slug,
          categorySlug: 'wedding',
          titleFa: nameFa,
          titleEn: nameEn,
          titleAr: nameFa,
          priceToman,
          priceUsd: 35,
          isFree: false,
          status: 'PUBLISHED',
          currentVersion: 1,
          openingSceneType: 'ROYAL_WAX_SEAL',
          primaryColorHex: '#C5A059',
          accentColorHex: '#1E4D3B',
          backgroundColorHex: '#FAF7F2',
          schemaJson: JSON.stringify({
            ...baseTpl,
            id: `tpl_${Date.now()}`,
            slug,
            priceToman,
          }),
        })
        .returning();

      await db.insert(templateVersions).values({
        templateId: createdTpl.id,
        versionNumber: 1,
        changelog: 'ایجاد نسخه ۱.۰ از طریق ماژول مدیریت قالب پنل ادمین',
        schemaSnapshotJson: createdTpl.schemaJson,
        createdByUid: actorEmail,
      });
      resultData = createdTpl;
    } else if (actionType === 'CREATE_CATEGORY') {
      const [cat] = await db
        .insert(templateCategories)
        .values({
          slug: String(payload.slug || `cat-${Date.now()}`),
          nameFa: String(payload.nameFa || 'دسته‌بندی جدید'),
          nameEn: String(payload.nameEn || 'New Category'),
          nameAr: String(payload.nameFa || 'فئة جديدة'),
          descriptionFa: String(payload.description || 'دسته‌بندی ایجادشده در پنل ادمین'),
          sortOrder: Number(payload.sortOrder || 10),
          isActive: true,
        })
        .returning();
      resultData = cat;
    } else if (actionType === 'CREATE_MEDIA_ASSET') {
      const [asset] = await db
        .insert(mediaAssets)
        .values({
          assetType: String(payload.assetType || 'MUSIC').toUpperCase(),
          slug: `asset-${Date.now()}`,
          titleFa: String(payload.name || 'دارایی چندرسانه‌ای جدید'),
          titleEn: String(payload.name || 'New Media Asset'),
          category: 'Luxury Collection',
          durationSeconds: 120,
          synthPresetJson: JSON.stringify({ url: payload.url || 'synth://persian-santoor' }),
          isActive: true,
        })
        .returning();
      resultData = asset;
    } else if (actionType === 'CREATE_COUPON') {
      const [coupon] = await db
        .insert(coupons)
        .values({
          code: String(payload.code || `LUX${Date.now().toString().slice(-4)}`).toUpperCase(),
          discountType: 'PERCENTAGE',
          discountValue: Number(payload.discountPercent || 25),
          maxUses: 100,
          usedCount: 0,
          isActive: true,
          expiresAtIso: '2027-03-20T00:00:00.000Z',
        })
        .returning();
      resultData = coupon;
    } else if (actionType === 'UPDATE_USER_ROLE') {
      const userId = Number(payload.userId);
      const role = String(payload.role || 'ADMIN').toUpperCase();
      const [updatedUser] = await db
        .update(users)
        .set({ role })
        .where(eq(users.id, userId))
        .returning();
      resultData = updatedUser;
    } else if (actionType === 'UPDATE_PLATFORM_SETTING') {
      const settingKey = String(payload.settingKey || 'base_invitation_price_toman');
      const existing = await db
        .select()
        .from(platformSettings)
        .where(eq(platformSettings.settingKey, settingKey))
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(platformSettings)
          .set({
            settingValue: JSON.stringify(payload.settingValueJson ?? {}),
            updatedAt: new Date(),
          })
          .where(eq(platformSettings.id, existing[0].id))
          .returning();
        resultData = updated;
      }
    } else if (actionType === 'CREATE_GUEST_AND_TOKEN') {
      const eventRows = await db.select().from(events).limit(1);
      const eventId = Number(payload.eventId || eventRows[0]?.id || 1);
      const [newGuest] = await db
        .insert(guests)
        .values({
          eventId,
          fullName: String(payload.fullName || 'مهمان ویژه جدید'),
          salutationFa: `مقدم گرامی ${String(payload.fullName || 'مهمان عزیز')}`,
          phoneOrEmail: '09120000000',
          maxCompanions: Number(payload.maxAllowedGuests || 2),
          vipTag: 'VIP',
        })
        .returning();

      const tokenStr = `inv_tok_${Math.random().toString(36).slice(2, 9)}`;
      const [newToken] = await db
        .insert(invitationTokens)
        .values({
          eventId,
          guestId: newGuest.id,
          token: tokenStr,
          openedCount: 0,
          isRevoked: false,
        })
        .returning();

      resultData = { guest: newGuest, invitationToken: newToken };
    }

    // Record Audit Log in PostgreSQL for every administrative operation
    await db.insert(auditLogs).values({
      actorUid: actorRole,
      actorEmail,
      actionCode: actionType,
      targetEntity: 'admin_operation',
      targetId: String(payload.templateId || payload.userId || payload.code || 'system'),
      detailsJson: JSON.stringify(payload),
    });

    return resultData;
  },
};
