import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users table (linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull().default('Host Member'),
  phoneNumber: text('phone_number').notNull().default('09120000000'),
  role: text('role').notNull().default('USER'), // USER | SUPPORT | ADMIN | SUPER_ADMIN
  status: text('status').notNull().default('ACTIVE'), // ACTIVE | SUSPENDED
  subscriptionPlan: text('subscription_plan').notNull().default('ATELIER_PRO'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Template Categories
export const templateCategories = pgTable('template_categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameFa: text('name_fa').notNull(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  descriptionFa: text('description_fa').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Templates (Data-driven master templates validated with Zod)
export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  categorySlug: text('category_slug').notNull(),
  titleFa: text('title_fa').notNull(),
  titleEn: text('title_en').notNull(),
  titleAr: text('title_ar').notNull(),
  priceToman: integer('price_toman').notNull().default(50000),
  priceUsd: integer('price_usd').notNull().default(29),
  isFree: boolean('is_free').notNull().default(false),
  status: text('status').notNull().default('PUBLISHED'), // DRAFT | PUBLISHED | UNPUBLISHED | ARCHIVED
  currentVersion: integer('current_version').notNull().default(1),
  openingSceneType: text('opening_scene_type').notNull().default('ROYAL_WAX_SEAL'),
  primaryColorHex: text('primary_color_hex').notNull().default('#C5A059'),
  accentColorHex: text('accent_color_hex').notNull().default('#1E4D3B'),
  backgroundColorHex: text('background_color_hex').notNull().default('#FAF7F2'),
  schemaJson: text('schema_json').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Template Versions (Immutable snapshots for version control)
export const templateVersions = pgTable('template_versions', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id')
    .references(() => templates.id)
    .notNull(),
  versionNumber: integer('version_number').notNull(),
  changelog: text('changelog').notNull(),
  schemaSnapshotJson: text('schema_snapshot_json').notNull(),
  createdByUid: text('created_by_uid').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Media Assets (Music, Sound Effects, Fonts, Ornamental Vectors)
export const mediaAssets = pgTable('media_assets', {
  id: serial('id').primaryKey(),
  assetType: text('asset_type').notNull(), // MUSIC | SFX | FONT | ASSET
  slug: text('slug').notNull().unique(),
  titleFa: text('title_fa').notNull(),
  titleEn: text('title_en').notNull(),
  category: text('category').notNull(),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  synthPresetJson: text('synth_preset_json').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Events (User Invitation Projects — isolated from master templates)
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  ownerUid: text('owner_uid').notNull(),
  templateId: integer('template_id')
    .references(() => templates.id)
    .notNull(),
  slug: text('slug').notNull().unique(),
  titleFa: text('title_fa').notNull(),
  titleEn: text('title_en').notNull(),
  hostsHeadlineFa: text('hosts_headline_fa').notNull(),
  hostsHeadlineEn: text('hosts_headline_en').notNull(),
  eventDateJalali: text('event_date_jalali').notNull(),
  eventDateIso: text('event_date_iso').notNull(),
  eventTimeText: text('event_time_text').notNull(),
  venueTitleFa: text('venue_title_fa').notNull(),
  venueAddressFa: text('venue_address_fa').notNull(),
  latitude: text('latitude').notNull().default('35.8169'),
  longitude: text('longitude').notNull().default('51.4714'),
  status: text('status').notNull().default('PUBLISHED'), // PUBLISHED | UNPUBLISHED | DRAFT
  openingSceneConfigJson: text('opening_scene_config_json').notNull(),
  audioConfigJson: text('audio_config_json').notNull(),
  canvasStateJson: text('canvas_state_json').notNull(),
  versionHistoryJson: text('version_history_json').notNull().default('[]'),
  viewsCount: integer('views_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 7. Guests (Private Guest List — never exposed publicly)
export const guests = pgTable('guests', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .references(() => events.id)
    .notNull(),
  fullName: text('full_name').notNull(),
  salutationFa: text('salutation_fa').notNull(),
  phoneOrEmail: text('phone_or_email').notNull().default(''),
  maxCompanions: integer('max_companions').notNull().default(2),
  vipTag: text('vip_tag').notNull().default('VIP'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Invitation Tokens (Unique personalized guest tokens)
export const invitationTokens = pgTable('invitation_tokens', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .references(() => events.id)
    .notNull(),
  guestId: integer('guest_id')
    .references(() => guests.id)
    .notNull(),
  token: text('token').notNull().unique(),
  openedCount: integer('opened_count').notNull().default(0),
  lastOpenedAt: timestamp('last_opened_at'),
  isRevoked: boolean('is_revoked').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. RSVP Responses
export const rsvpResponses = pgTable('rsvp_responses', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .references(() => events.id)
    .notNull(),
  guestId: integer('guest_id'),
  invitationToken: text('invitation_token').notNull().default('PUBLIC'),
  guestName: text('guest_name').notNull(),
  attendanceStatus: text('attendance_status').notNull(), // ATTENDING | NOT_ATTENDING | MAYBE
  guestCount: integer('guest_count').notNull().default(1),
  dietaryOrCustomAnswer: text('dietary_or_custom_answer').notNull().default(''),
  messageToHosts: text('message_to_hosts').notNull().default(''),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

// 10. Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  ownerUid: text('owner_uid').notNull(),
  eventId: integer('event_id'),
  planOrItemTitle: text('plan_or_item_title').notNull(),
  baseAmountToman: integer('base_amount_toman').notNull().default(50000),
  discountAmountToman: integer('discount_amount_toman').notNull().default(0),
  finalAmountToman: integer('final_amount_toman').notNull().default(50000),
  couponCode: text('coupon_code').notNull().default(''),
  status: text('status').notNull().default('PAID'), // PAID | PENDING | REFUNDED
  gatewayProvider: text('gateway_provider').notNull().default('ZARINPAL'),
  gatewayRefId: text('gateway_ref_id').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  ownerUid: text('owner_uid').notNull(),
  tierCode: text('tier_code').notNull(), // ATELIER_PRO | STUDIO_AGENCY | SINGLE_EVENT
  titleFa: text('title_fa').notNull(),
  priceMonthlyToman: integer('price_monthly_toman').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  renewsAtIso: text('renews_at_iso').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Coupons
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull(), // PERCENTAGE | FIXED_TOMAN
  discountValue: integer('discount_value').notNull(),
  maxUses: integer('max_uses').notNull().default(100),
  usedCount: integer('used_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  expiresAtIso: text('expires_at_iso').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Platform Settings
export const platformSettings = pgTable('platform_settings', {
  id: serial('id').primaryKey(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value').notNull(),
  labelFa: text('label_fa').notNull(),
  category: text('category').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 14. Audit Logs (Administrative & Security Audit Trail)
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorUid: text('actor_uid').notNull(),
  actorEmail: text('actor_email').notNull(),
  actionCode: text('action_code').notNull(),
  targetEntity: text('target_entity').notNull(),
  targetId: text('target_id').notNull(),
  detailsJson: text('details_json').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const templatesRelations = relations(templates, ({ many }) => ({
  versions: many(templateVersions),
  events: many(events),
}));

export const templateVersionsRelations = relations(templateVersions, ({ one }) => ({
  template: one(templates, {
    fields: [templateVersions.templateId],
    references: [templates.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  template: one(templates, {
    fields: [events.templateId],
    references: [templates.id],
  }),
  guests: many(guests),
  tokens: many(invitationTokens),
  rsvps: many(rsvpResponses),
}));

export const guestsRelations = relations(guests, ({ one, many }) => ({
  event: one(events, {
    fields: [guests.eventId],
    references: [events.id],
  }),
  tokens: many(invitationTokens),
}));

export const invitationTokensRelations = relations(invitationTokens, ({ one }) => ({
  event: one(events, {
    fields: [invitationTokens.eventId],
    references: [events.id],
  }),
  guest: one(guests, {
    fields: [invitationTokens.guestId],
    references: [guests.id],
  }),
}));

export const rsvpResponsesRelations = relations(rsvpResponses, ({ one }) => ({
  event: one(events, {
    fields: [rsvpResponses.eventId],
    references: [events.id],
  }),
}));
