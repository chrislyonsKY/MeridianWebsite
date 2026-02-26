import { db } from "./db";
import {
  sources,
  articles,
  stories,
  storyArticles,
  bookmarks,
  contactSubmissions,
  type Source,
  type Article,
  type Story,
  type Bookmark,
  type ContactSubmission,
  type InsertSource,
  type InsertArticle,
  type InsertStory,
  type InsertContact,
} from "@shared/schema";
import { eq, desc, asc, inArray, count, and, ilike, or, ne, sql } from "drizzle-orm";

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

  // Bookmarks
  getBookmarks(userId: string): Promise<any[]>;
  addBookmark(userId: string, storyId: number): Promise<Bookmark>;
  removeBookmark(userId: string, storyId: number): Promise<void>;
  isBookmarked(userId: string, storyId: number): Promise<boolean>;

  // Search & Discovery
  searchStories(query: string, limit?: number): Promise<any[]>;
  getTrendingStories(limit?: number): Promise<any[]>;
  getRelatedStories(storyId: number, limit?: number): Promise<any[]>;

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

  async getBookmarks(userId: string): Promise<any[]> {
    const userBookmarks = await db.select().from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));

    if (userBookmarks.length === 0) return [];

    const storyIds = userBookmarks.map(b => b.storyId);
    const fetchedStories = await db.select().from(stories)
      .where(inArray(stories.id, storyIds));

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

    return fetchedStories.map(story => ({
      ...story,
      storyArticles: linkedArticles
        .filter(la => la.storyId === story.id)
        .map(la => ({ id: la.id, sourceSnippet: la.sourceSnippet, article: { ...la.article, source: la.source } })),
    }));
  }

  async addBookmark(userId: string, storyId: number): Promise<Bookmark> {
    const existing = await db.select().from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.storyId, storyId)));
    if (existing.length > 0) return existing[0];
    const [bookmark] = await db.insert(bookmarks).values({ userId, storyId }).returning();
    return bookmark;
  }

  async removeBookmark(userId: string, storyId: number): Promise<void> {
    await db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.storyId, storyId)));
  }

  async isBookmarked(userId: string, storyId: number): Promise<boolean> {
    const result = await db.select().from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.storyId, storyId)));
    return result.length > 0;
  }

  async searchStories(query: string, limit: number = 20): Promise<any[]> {
    const searchPattern = `%${query}%`;
    const fetchedStories = await db.select().from(stories)
      .where(and(
        eq(stories.status, "published"),
        or(ilike(stories.headline, searchPattern), ilike(stories.summary, searchPattern))
      ))
      .orderBy(desc(stories.publishedAt))
      .limit(limit);

    if (fetchedStories.length === 0) return [];

    const storyIds = fetchedStories.map(s => s.id);
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

    return fetchedStories.map(story => ({
      ...story,
      storyArticles: linkedArticles
        .filter(la => la.storyId === story.id)
        .map(la => ({ id: la.id, sourceSnippet: la.sourceSnippet, article: { ...la.article, source: la.source } })),
    }));
  }

  async getTrendingStories(limit: number = 10): Promise<any[]> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const storySourceCounts = await db
      .select({
        storyId: storyArticles.storyId,
        sourceCount: count(storyArticles.id),
      })
      .from(storyArticles)
      .innerJoin(stories, eq(storyArticles.storyId, stories.id))
      .where(and(
        eq(stories.status, "published"),
      ))
      .groupBy(storyArticles.storyId)
      .orderBy(desc(count(storyArticles.id)))
      .limit(limit);

    if (storySourceCounts.length === 0) return [];

    const storyIds = storySourceCounts.map(s => s.storyId);
    const fetchedStories = await db.select().from(stories)
      .where(inArray(stories.id, storyIds));

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

    const sourceCountMap = new Map(storySourceCounts.map(s => [s.storyId, Number(s.sourceCount)]));

    return fetchedStories
      .map(story => ({
        ...story,
        sourceCount: sourceCountMap.get(story.id) || 0,
        storyArticles: linkedArticles
          .filter(la => la.storyId === story.id)
          .map(la => ({ id: la.id, sourceSnippet: la.sourceSnippet, article: { ...la.article, source: la.source } })),
      }))
      .sort((a, b) => b.sourceCount - a.sourceCount);
  }

  async getRelatedStories(storyId: number, limit: number = 4): Promise<any[]> {
    const [story] = await db.select().from(stories).where(eq(stories.id, storyId));
    if (!story) return [];

    const fetchedStories = await db.select().from(stories)
      .where(and(
        eq(stories.status, "published"),
        eq(stories.topic, story.topic),
        ne(stories.id, storyId)
      ))
      .orderBy(desc(stories.publishedAt))
      .limit(limit);

    if (fetchedStories.length === 0) return [];

    const storyIds = fetchedStories.map(s => s.id);
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

    return fetchedStories.map(story => ({
      ...story,
      storyArticles: linkedArticles
        .filter(la => la.storyId === story.id)
        .map(la => ({ id: la.id, sourceSnippet: la.sourceSnippet, article: { ...la.article, source: la.source } })),
    }));
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
