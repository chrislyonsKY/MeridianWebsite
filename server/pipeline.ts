import RSSParser from "rss-parser";
import OpenAI from "openai";
import { storage } from "./storage";
import type { Source, Article } from "@shared/schema";

const parser = new RSSParser({
  timeout: 10000,
  headers: {
    'User-Agent': 'TheMeridian/1.0 NewsAggregator',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface FetchedArticle {
  sourceId: number;
  sourceName: string;
  biasRating: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt: Date;
}

async function fetchRSSFeed(source: Source): Promise<FetchedArticle[]> {
  if (!source.rssUrl || !source.isActive) return [];

  try {
    console.log(`[Pipeline] Fetching RSS from ${source.name}: ${source.rssUrl}`);
    const feed = await parser.parseURL(source.rssUrl);
    const articles: FetchedArticle[] = [];

    for (const item of feed.items.slice(0, 15)) {
      if (!item.title || !item.link) continue;

      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
      if (isNaN(publishedAt.getTime())) continue;

      const oneDayAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      if (publishedAt < oneDayAgo) continue;

      articles.push({
        sourceId: source.id,
        sourceName: source.name,
        biasRating: source.biasRating,
        title: item.title,
        url: item.link,
        snippet: item.contentSnippet?.slice(0, 500) || item.content?.slice(0, 500) || "",
        publishedAt,
      });
    }

    console.log(`[Pipeline] Got ${articles.length} recent articles from ${source.name}`);
    return articles;
  } catch (err) {
    console.error(`[Pipeline] Failed to fetch RSS from ${source.name}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

async function ingestArticles(fetched: FetchedArticle[]): Promise<Article[]> {
  const newArticles: Article[] = [];

  for (const item of fetched) {
    const existing = await storage.getArticleByUrl(item.url);
    if (existing) continue;

    try {
      const article = await storage.createArticle({
        sourceId: item.sourceId,
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        publishedAt: item.publishedAt,
      });
      newArticles.push(article);
    } catch (err) {
      // Skip duplicate URL errors
    }
  }

  return newArticles;
}

interface ArticleGroup {
  topic: string;
  region: string;
  articles: FetchedArticle[];
}

async function groupArticlesByTopic(articles: FetchedArticle[]): Promise<ArticleGroup[]> {
  if (articles.length === 0) return [];

  const articleList = articles.map((a, i) => `${i}: [${a.sourceName}] "${a.title}" - ${a.snippet.slice(0, 150)}`).join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a news editor. Group these articles by the underlying news event or topic they cover. Only create groups where at least 2 articles from DIFFERENT sources cover the same event. Assign each group a topic category from: politics, business, technology, science, health, world, sports, entertainment, environment.

Also assign each group a region: "us" (primarily US news), "uk" (primarily UK news), "canada" (primarily Canada news), "europe" (primarily Europe news), "international" (global/multi-region or non-Western news). Default to "us" if unclear.

Return JSON: { "groups": [{ "topic": "category", "region": "us", "articleIndices": [0, 3, 7], "suggestedHeadline": "brief neutral headline" }] }

Only include articles that clearly cover the same specific event. Do not force unrelated articles together. It's better to have fewer, higher-quality groups.`,
        },
        {
          role: "user",
          content: articleList,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    const groups: ArticleGroup[] = [];

    for (const group of result.groups || []) {
      const groupArticles = (group.articleIndices || [])
        .filter((i: number) => i >= 0 && i < articles.length)
        .map((i: number) => articles[i]);

      const uniqueSources = new Set(groupArticles.map((a: FetchedArticle) => a.sourceId));
      if (groupArticles.length >= 2 && uniqueSources.size >= 2) {
        groups.push({
          topic: group.topic || "world",
          region: group.region || "us",
          articles: groupArticles,
        });
      }
    }

    console.log(`[Pipeline] AI grouped articles into ${groups.length} story clusters`);
    return groups;
  } catch (err) {
    console.error("[Pipeline] Failed to group articles:", err instanceof Error ? err.message : err);
    return [];
  }
}

async function synthesizeStory(group: ArticleGroup): Promise<void> {
  const articleDescriptions = group.articles.map(
    (a) => `[${a.sourceName} (${a.biasRating})] "${a.title}"\n${a.snippet}`
  ).join("\n\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are The Meridian's AI news synthesizer. You don't just aggregate — you synthesize a single, neutral, fact-first narrative from multiple sources. This is what makes you different from news aggregators.

Given articles from sources with different political leanings, produce a deep analysis:

1. **headline**: A neutral, fact-first headline (no editorializing, no sensationalism)
2. **summary**: A comprehensive synthesis (4-6 sentences) presenting verified facts without political slant. Write it as original journalism, not a summary of summaries.
3. **keyFacts**: 3-5 verified facts confirmed across multiple sources
4. **divergenceSummary**: How sources frame this differently and WHY (what editorial choices reveal about each outlet's priorities)
5. **consensusScore**: 0-100, how much sources agree on core facts (100 = total agreement, 0 = completely contradictory)
6. **narrativeLens**: For each source, analyze the specific narrative techniques used:
   - "tone": overall emotional tone (e.g. "alarming", "measured", "celebratory", "critical")
   - "emphasis": what aspect the source chose to lead with
   - "omissions": what the source left out that others included
   - "wordChoice": specific word choices that reveal editorial slant
7. **coverageGaps**: Facts or angles that only some sources covered, revealing blind spots

Return JSON:
{
  "headline": "...",
  "summary": "...",
  "keyFacts": ["...", "..."],
  "divergenceSummary": "...",
  "consensusScore": 75,
  "narrativeLens": [
    {
      "sourceName": "...",
      "biasRating": "...",
      "framing": "...",
      "tone": "...",
      "emphasis": "...",
      "omissions": "...",
      "wordChoice": "..."
    }
  ],
  "coverageGaps": [
    { "fact": "...", "coveredBy": ["Source A"], "missedBy": ["Source B", "Source C"], "significance": "..." }
  ]
}`,
        },
        {
          role: "user",
          content: articleDescriptions,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    if (!result.headline || !result.summary) {
      console.error("[Pipeline] AI returned incomplete synthesis");
      return;
    }

    const story = await storage.createStory({
      headline: result.headline,
      summary: result.summary,
      topic: group.topic,
      region: group.region,
      keyFacts: result.keyFacts || [],
      divergenceSummary: result.divergenceSummary || "",
      consensusScore: result.consensusScore || null,
      narrativeLens: result.narrativeLens || null,
      coverageGaps: result.coverageGaps || null,
      status: "published",
      publishedAt: new Date(),
    });

    for (const article of group.articles) {
      const dbArticle = await storage.getArticleByUrl(article.url);
      if (!dbArticle) continue;

      const lens = (result.narrativeLens || []).find(
        (nl: any) => nl.sourceName === article.sourceName
      );
      const framing = lens?.framing || `Covered by ${article.sourceName}`;

      await storage.linkArticleToStory(story.id, dbArticle.id, framing);
    }

    console.log(`[Pipeline] Created story: "${result.headline}" with ${group.articles.length} articles`);
  } catch (err) {
    console.error("[Pipeline] Failed to synthesize story:", err instanceof Error ? err.message : err);
  }
}

let pipelineRunning = false;

export async function runPipeline(): Promise<{ message: string; storiesCreated: number }> {
  if (pipelineRunning) {
    return { message: "Pipeline already running", storiesCreated: 0 };
  }

  pipelineRunning = true;
  console.log("[Pipeline] Starting news pipeline...");

  try {
    const sources = await storage.getSources();
    const activeSources = sources.filter(s => s.isActive && s.rssUrl);

    if (activeSources.length === 0) {
      return { message: "No active sources with RSS feeds", storiesCreated: 0 };
    }

    const allFetched: FetchedArticle[] = [];
    for (const source of activeSources) {
      const articles = await fetchRSSFeed(source);
      allFetched.push(...articles);
    }

    console.log(`[Pipeline] Fetched ${allFetched.length} total articles`);

    if (allFetched.length === 0) {
      return { message: "No new articles found", storiesCreated: 0 };
    }

    const newArticles = await ingestArticles(allFetched);
    console.log(`[Pipeline] Ingested ${newArticles.length} new articles`);

    const groups = await groupArticlesByTopic(allFetched);

    let storiesCreated = 0;
    for (const group of groups.slice(0, 8)) {
      await synthesizeStory(group);
      storiesCreated++;
    }

    console.log(`[Pipeline] Complete. Created ${storiesCreated} stories.`);
    return { message: `Pipeline complete. Created ${storiesCreated} stories.`, storiesCreated };
  } catch (err) {
    console.error("[Pipeline] Pipeline failed:", err);
    return { message: "Pipeline failed: " + (err instanceof Error ? err.message : "Unknown error"), storiesCreated: 0 };
  } finally {
    pipelineRunning = false;
  }
}

let refreshInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoRefresh(intervalMinutes: number = 30) {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  console.log(`[Pipeline] Auto-refresh scheduled every ${intervalMinutes} minutes`);

  setTimeout(() => {
    runPipeline().catch(console.error);
  }, 5000);

  refreshInterval = setInterval(() => {
    runPipeline().catch(console.error);
  }, intervalMinutes * 60 * 1000);
}

export function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log("[Pipeline] Auto-refresh stopped");
  }
}
