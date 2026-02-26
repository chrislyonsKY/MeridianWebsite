import { pgTable, text, timestamp, varchar, boolean, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Make sure to export the auth schema so it gets created in the db
export * from "./models/auth";

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  url: text("url").notNull(),
  rssUrl: text("rss_url"),
  biasRating: varchar("bias_rating", { length: 20 }).notNull(), // left, center-left, center, center-right, right
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  sourceId: serial("source_id").references(() => sources.id),
  title: text("title").notNull(),
  url: text("url").notNull().unique(),
  snippet: text("snippet"),
  author: text("author"),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at").notNull(),
  ingestedAt: timestamp("ingested_at").defaultNow().notNull(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  headline: text("headline").notNull(),
  summary: text("summary"),
  topic: varchar("topic", { length: 50 }).notNull(),
  region: varchar("region", { length: 30 }).default("us"),
  keyFacts: text("key_facts").array(),
  divergenceSummary: text("divergence_summary"),
  consensusScore: integer("consensus_score"),
  narrativeLens: jsonb("narrative_lens"),
  coverageGaps: jsonb("coverage_gaps"),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

export const storyArticles = pgTable("story_articles", {
  id: serial("id").primaryKey(),
  storyId: serial("story_id").references(() => stories.id, { onDelete: 'cascade' }),
  articleId: serial("article_id").references(() => articles.id, { onDelete: 'cascade' }),
  sourceSnippet: text("source_snippet"), // How this specific source framed it
});

export const sourcesRelations = relations(sources, ({ many }) => ({
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  source: one(sources, {
    fields: [articles.sourceId],
    references: [sources.id],
  }),
  storyArticles: many(storyArticles),
}));

export const storiesRelations = relations(stories, ({ many }) => ({
  storyArticles: many(storyArticles),
}));

export const storyArticlesRelations = relations(storyArticles, ({ one }) => ({
  story: one(stories, {
    fields: [storyArticles.storyId],
    references: [stories.id],
  }),
  article: one(articles, {
    fields: [storyArticles.articleId],
    references: [articles.id],
  }),
}));

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  storyId: integer("story_id").references(() => stories.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: varchar("subject", { length: 50 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSourceSchema = createInsertSchema(sources).omit({
  id: true,
  createdAt: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  ingestedAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});

export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sources.$inferSelect;

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

export const insertContactSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  isRead: true,
  createdAt: true,
});
export type InsertContact = z.infer<typeof insertContactSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
