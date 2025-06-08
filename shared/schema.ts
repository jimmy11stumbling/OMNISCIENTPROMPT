import { pgTable, serial, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
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

export const insertSavedPromptSchema = createInsertSchema(savedPrompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertSavedPrompt = z.infer<typeof insertSavedPromptSchema>;
export type SavedPrompt = typeof savedPrompts.$inferSelect;