import { savedPrompts, type SavedPrompt, type InsertSavedPrompt } from "../shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getSavedPrompt(id: number): Promise<SavedPrompt | undefined>;
  getAllSavedPrompts(): Promise<SavedPrompt[]>;
  createSavedPrompt(insertPrompt: InsertSavedPrompt): Promise<SavedPrompt>;
  deleteSavedPrompt(id: number): Promise<void>;
  searchSavedPrompts(query: string): Promise<SavedPrompt[]>;
}

export class DatabaseStorage implements IStorage {
  async getSavedPrompt(id: number): Promise<SavedPrompt | undefined> {
    const [prompt] = await db.select().from(savedPrompts).where(eq(savedPrompts.id, id));
    return prompt || undefined;
  }

  async getAllSavedPrompts(): Promise<SavedPrompt[]> {
    return await db.select().from(savedPrompts).orderBy(desc(savedPrompts.createdAt));
  }

  async createSavedPrompt(insertPrompt: InsertSavedPrompt): Promise<SavedPrompt> {
    const [prompt] = await db
      .insert(savedPrompts)
      .values({
        ...insertPrompt,
        updatedAt: new Date()
      })
      .returning();
    return prompt;
  }

  async deleteSavedPrompt(id: number): Promise<void> {
    await db.delete(savedPrompts).where(eq(savedPrompts.id, id));
  }

  async searchSavedPrompts(query: string): Promise<SavedPrompt[]> {
    return await db.select().from(savedPrompts)
      .where(sql`
        title ILIKE ${'%' + query + '%'} OR 
        original_query ILIKE ${'%' + query + '%'} OR 
        generated_prompt ILIKE ${'%' + query + '%'}
      `)
      .orderBy(desc(savedPrompts.createdAt));
  }
}

export const storage = new DatabaseStorage();