import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, timestamp, uuid, boolean, index, integer, jsonb } from 'drizzle-orm/pg-core';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql);

// Users table - synced with Clerk
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  imageUrl: text('image_url'),
  preferredLanguage: text('preferred_language').default('en'),
  isOnline: boolean('is_online').default(false),
  lastSeen: timestamp('last_seen').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  clerkIdIdx: index('clerk_id_idx').on(table.clerkId),
  emailIdx: index('email_idx').on(table.email),
  onlineIdx: index('online_idx').on(table.isOnline),
}));

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  isGroup: boolean('is_group').default(false),
  createdBy: uuid('created_by').references(() => users.id),
  lastMessageId: uuid('last_message_id'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  createdByIdx: index('conversations_created_by_idx').on(table.createdBy),
  lastMessageIdx: index('conversations_last_message_idx').on(table.lastMessageAt),
}));

// Conversation members table
export const conversationMembers = pgTable('conversation_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow(),
  isAdmin: boolean('is_admin').default(false),
  lastReadAt: timestamp('last_read_at').defaultNow(),
  notificationsEnabled: boolean('notifications_enabled').default(true),
}, (table) => ({
  conversationUserIdx: index('conversation_user_idx').on(table.conversationId, table.userId),
  userConversationIdx: index('user_conversation_idx').on(table.userId, table.conversationId),
}));

// Messages table with translation support
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  translatedContent: text('translated_content'),
  originalLanguage: text('original_language'),
  targetLanguage: text('target_language'),
  isTranslated: boolean('is_translated').default(false),
  messageType: text('message_type').default('text'), // text, image, file
  metadata: jsonb('metadata'), // For storing additional message data
  editedAt: timestamp('edited_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  conversationIdx: index('messages_conversation_idx').on(table.conversationId),
  senderIdx: index('messages_sender_idx').on(table.senderId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
  typeIdx: index('messages_type_idx').on(table.messageType),
}));

// Message translations table for multiple language support
export const messageTranslations = pgTable('message_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  language: text('language').notNull(),
  translatedText: text('translated_text').notNull(),
  confidence: integer('confidence'), // 0-100
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  messageLanguageIdx: index('message_language_idx').on(table.messageId, table.language),
}));

// Push subscriptions table
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dhKey: text('p256dh_key').notNull(),
  authKey: text('auth_key').notNull(),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('push_subscriptions_user_idx').on(table.userId),
  endpointIdx: index('push_subscriptions_endpoint_idx').on(table.endpoint),
  activeIdx: index('push_subscriptions_active_idx').on(table.isActive),
}));

// Typing indicators table for realtime
export const typingIndicators = pgTable('typing_indicators', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  isTyping: boolean('is_typing').default(true),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  conversationUserIdx: index('typing_conversation_user_idx').on(table.conversationId, table.userId),
  updatedAtIdx: index('typing_updated_at_idx').on(table.updatedAt),
}));