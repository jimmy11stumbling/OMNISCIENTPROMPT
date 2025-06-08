import { pgTable, serial, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const savedPrompts = pgTable('saved_prompts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  originalQuery: text('original_query').notNull(),
  platform: text('platform').notNull(),
  generatedPrompt: text('generated_prompt').notNull(),
  reasoning: text('reasoning'),
  ragContext: jsonb('rag_context'),
  tokensUsed: integer('tokens_used').default(0),
  responseTime: integer('response_time').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  fullName: text('full_name'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('user'),
  isActive: boolean('is_active').default(true),
  emailVerified: boolean('email_verified').default(false),
  verificationToken: text('verification_token'),
  apiKey: text('api_key'),
  apiQuotaDaily: integer('api_quota_daily').default(100),
  apiQuotaUsedToday: integer('api_quota_used_today').default(0),
  apiQuotaResetDate: text('api_quota_reset_date'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('info'),
  isRead: boolean('is_read').default(false),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow()
});

export const ragDocuments = pgTable('rag_documents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  platform: text('platform').notNull(),
  documentType: text('document_type'),
  content: text('content').notNull(),
  keywords: jsonb('keywords'),
  uploadedBy: integer('uploaded_by'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const insertSavedPromptSchema = createInsertSchema(savedPrompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

export const insertRagDocumentSchema = createInsertSchema(ragDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertSavedPrompt = z.infer<typeof insertSavedPromptSchema>;
export type SavedPrompt = typeof savedPrompts.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertRagDocument = z.infer<typeof insertRagDocumentSchema>;
export type RagDocument = typeof ragDocuments.$inferSelect;