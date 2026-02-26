import { db } from "./db";
import {
  sources,
  articles,
  stories,
  storyArticles,
  contactSubmissions,
  type Source,
  type Article,
  type Story,
  type ContactSubmission,
  type InsertSource,
  type InsertArticle,
  type InsertStory,
  type InsertContact,
} from "@shared/schema";
import { eq, desc, asc, inArray, count, and } from "drizzle-orm";

export interface IStorage {
  // Sources
  getSources(): Promise<Source[]>;
  getSource(id: number): Promise<Source | undefined>;
  getSourceByName(name: string): Promise<Source | undefined>;
  createSource(source: InsertSource): Promise<Source>;
  updateSource(id: number, updates: Partial<InsertSource>): Promise<Source>;

  // Articles
  getArticles(): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  getArticleByUrl(url: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;

  // Stories
  getStories(page: number, limit: number, topic?: string, region?: string): Promise<{ stories: any[], totalPages: number, currentPage: number }>;
  getStory(id: number): Promise<any | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: number, updates: Partial<InsertStory>): Promise<Story>;

  // Relationships
  linkArticleToStory(storyId: number, articleId: number, sourceSnippet: string): Promise<void>;

  // Contact Submissions
  createContactSubmission(data: InsertContact): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
  markContactRead(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSources(): Promise<Source[]> {
    return await db.select().from(sources).orderBy(asc(sources.name));
  }

  async getSource(id: number): Promise<Source | undefined> {
    const [source] = await db.select().from(sources).where(eq(sources.id, id));
    return source;
  }

  async getSourceByName(name: string): Promise<Source | undefined> {
    const [source] = await db.select().from(sources).where(eq(sources.name, name));
    return source;
  }

  async createSource(source: InsertSource): Promise<Source> {
    const [newSource] = await db.insert(sources).values(source).returning();
    return newSource;
  }

  async updateSource(id: number, updates: Partial<InsertSource>): Promise<Source> {
    const [updated] = await db.update(sources).set(updates).where(eq(sources.id, id)).returning();
    return updated;
  }

  async getArticles(): Promise<Article[]> {
    return await db.select().from(articles).orderBy(desc(articles.publishedAt));
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async getArticleByUrl(url: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.url, url));
    return article;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    return newArticle;
  }

  async getStories(page: number = 1, limit: number = 10, topic?: string, region?: string) {
    const offset = (page - 1) * limit;

    const conditions = [eq(stories.status, "published")];
    if (topic) {
      conditions.push(eq(stories.topic, topic));
    }
    if (region) {
      conditions.push(eq(stories.region, region));
    }
    const whereClause = and(...conditions);

    let query = db.select().from(stories).where(whereClause);
    let countQuery = db.select({ value: count() }).from(stories).where(whereClause);

    const [totalCountResult] = await countQuery;
    const totalCount = Number(totalCountResult.value);
    const totalPages = Math.ceil(totalCount / limit);

    const fetchedStories = await query
      .orderBy(desc(stories.publishedAt))
      .limit(limit)
      .offset(offset);

    // Fetch relations
    const storyIds = fetchedStories.map(s => s.id);
    if (storyIds.length === 0) {
      return { stories: [], totalPages, currentPage: page };
    }

    const linkedArticles = await db
      .select({
        id: storyArticles.id,
        storyId: storyArticles.storyId,
        sourceSnippet: storyArticles.sourceSnippet,
        article: articles,
        source: sources,
      })
      .from(storyArticles)
      .innerJoin(articles, eq(storyArticles.articleId, articles.id))
      .innerJoin(sources, eq(articles.sourceId, sources.id))
      .where(inArray(storyArticles.storyId, storyIds));

    const enrichedStories = fetchedStories.map(story => {
      const articlesForStory = linkedArticles
        .filter(la => la.storyId === story.id)
        .map(la => ({
          id: la.id,
          sourceSnippet: la.sourceSnippet,
          article: {
            ...la.article,
            source: la.source,
          }
        }));

      return {
        ...story,
        storyArticles: articlesForStory,
      };
    });

    return { stories: enrichedStories, totalPages, currentPage: page };
  }

  async getStory(id: number) {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    if (!story) return undefined;

    const linkedArticles = await db
      .select({
        id: storyArticles.id,
        sourceSnippet: storyArticles.sourceSnippet,
        article: articles,
        source: sources,
      })
      .from(storyArticles)
      .innerJoin(articles, eq(storyArticles.articleId, articles.id))
      .innerJoin(sources, eq(articles.sourceId, sources.id))
      .where(eq(storyArticles.storyId, id));

    return {
      ...story,
      storyArticles: linkedArticles.map(la => ({
        id: la.id,
        sourceSnippet: la.sourceSnippet,
        article: {
          ...la.article,
          source: la.source,
        }
      }))
    };
  }

  async createStory(story: InsertStory): Promise<Story> {
    const [newStory] = await db.insert(stories).values(story).returning();
    return newStory;
  }

  async updateStory(id: number, updates: Partial<InsertStory>): Promise<Story> {
    const [updated] = await db
      .update(stories)
      .set(updates)
      .where(eq(stories.id, id))
      .returning();
    return updated;
  }

  async linkArticleToStory(storyId: number, articleId: number, sourceSnippet: string): Promise<void> {
    await db.insert(storyArticles).values({
      storyId,
      articleId,
      sourceSnippet,
    });
  }

  async createContactSubmission(data: InsertContact): Promise<ContactSubmission> {
    const [submission] = await db.insert(contactSubmissions).values(data).returning();
    return submission;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  }

  async markContactRead(id: number): Promise<void> {
    await db.update(contactSubmissions).set({ isRead: true }).where(eq(contactSubmissions.id, id));
  }
}

export const storage = new DatabaseStorage();
