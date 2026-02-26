import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import RSSParser from "rss-parser";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { runPipeline, startAutoRefresh } from "./pipeline";

const localNewsParser = new RSSParser({
  timeout: 10000,
  headers: { 'User-Agent': 'TheMeridian/1.0 NewsAggregator' },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up authentication before other routes
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/config/map", (_req, res) => {
    res.json({ esriApiKey: process.env.ESRI_API_KEY || "" });
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ message: "Name, email, and message are required." });
      }

      await storage.createContactSubmission({ name, email, subject: subject || "general", message });
      console.log(`[Contact] New submission from ${name} (${email}) — ${subject}`);
      res.json({ success: true });
    } catch (err) {
      console.error("[Contact] Failed to save submission:", err);
      res.status(500).json({ message: "Failed to send message. Please try again later." });
    }
  });

  app.get("/api/contact/submissions", async (req, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (err) {
      console.error("[Contact] Failed to fetch submissions:", err);
      res.status(500).json({ message: "Failed to fetch submissions." });
    }
  });

  app.patch("/api/contact/submissions/:id/read", async (req, res) => {
    try {
      await storage.markContactRead(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error("[Contact] Failed to mark as read:", err);
      res.status(500).json({ message: "Failed to update submission." });
    }
  });

  app.get("/api/local-news", async (req, res) => {
    try {
      const location = req.query.location as string;
      if (!location || location.trim().length === 0) {
        return res.json({ articles: [] });
      }

      const encoded = encodeURIComponent(location.trim());
      const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;

      const feed = await localNewsParser.parseURL(rssUrl);
      const articles = (feed.items || []).slice(0, 10).map((item) => {
        const sourceName = item.source || (item.title?.match(/- (.+)$/)?.[1]) || "Unknown";
        const cleanTitle = item.title?.replace(/ - [^-]+$/, "") || item.title || "";
        return {
          title: cleanTitle,
          url: item.link || "",
          source: sourceName,
          publishedAt: item.pubDate || new Date().toISOString(),
          snippet: item.contentSnippet?.slice(0, 200) || "",
        };
      });

      res.json({ articles, location: location.trim() });
    } catch (err) {
      console.error("[LocalNews] Failed to fetch:", err instanceof Error ? err.message : err);
      res.json({ articles: [], location: req.query.location });
    }
  });

  app.get(api.stories.list.path, async (req, res) => {
    try {
      const topic = req.query.topic as string | undefined;
      const region = req.query.region as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const result = await storage.getStories(page, limit, topic, region);
      res.json(result);
    } catch (err) {
      console.error("Error fetching stories:", err);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.get(api.stories.get.path, async (req, res) => {
    try {
      const story = await storage.getStory(Number(req.params.id));
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      res.json(story);
    } catch (err) {
      console.error("Error fetching story:", err);
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  app.get(api.sources.list.path, async (req, res) => {
    try {
      const sourcesList = await storage.getSources();
      res.json(sourcesList);
    } catch (err) {
      console.error("Error fetching sources:", err);
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });

  app.post(api.pipeline.trigger.path, async (req, res) => {
    try {
      const result = await runPipeline();
      res.json(result);
    } catch (err) {
      console.error("Pipeline error:", err);
      res.status(500).json({ message: "Failed to trigger pipeline" });
    }
  });

  await seedDatabase();
  await updateSourceRssUrls();
  startAutoRefresh(30);

  return httpServer;
}

async function seedDatabase() {
  const sources = await storage.getSources();
  if (sources.length > 0) return;

  const nyt = await storage.createSource({
    name: "The New York Times",
    url: "https://nytimes.com",
    rssUrl: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    biasRating: "center-left",
    isActive: true,
  });

  const wsj = await storage.createSource({
    name: "The Wall Street Journal",
    url: "https://wsj.com",
    rssUrl: "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
    biasRating: "center-right",
    isActive: true,
  });

  const ap = await storage.createSource({
    name: "Associated Press",
    url: "https://apnews.com",
    rssUrl: "https://feedx.net/rss/ap.xml",
    biasRating: "center",
    isActive: true,
  });

  const fox = await storage.createSource({
    name: "Fox News",
    url: "https://foxnews.com",
    rssUrl: "https://moxie.foxnews.com/google-publisher/latest.xml",
    biasRating: "right",
    isActive: true,
  });

  const npr = await storage.createSource({
    name: "NPR",
    url: "https://npr.org",
    rssUrl: "https://feeds.npr.org/1001/rss.xml",
    biasRating: "center-left",
    isActive: true,
  });

  const reuters = await storage.createSource({
    name: "Reuters",
    url: "https://reuters.com",
    rssUrl: "https://feedx.net/rss/reuters.xml",
    biasRating: "center",
    isActive: true,
  });

  const bbc = await storage.createSource({
    name: "BBC News",
    url: "https://bbc.com/news",
    rssUrl: "http://feeds.bbci.co.uk/news/rss.xml",
    biasRating: "center",
    isActive: true,
  });

  // Insert Articles for Story 1
  const article1a = await storage.createArticle({
    sourceId: nyt.id,
    title: "Federal Reserve Signals Potential Rate Cuts Later This Year",
    url: "https://nytimes.com/fed-rates-1",
    snippet: "The central bank held rates steady but indicated that inflation is moving closer to its 2% target.",
    publishedAt: new Date(),
  });

  const article1b = await storage.createArticle({
    sourceId: wsj.id,
    title: "Fed Leaves Rates Unchanged, Cites Strong Economic Growth",
    url: "https://wsj.com/fed-rates-2",
    snippet: "Policymakers maintain current interest rates as they balance inflation concerns with a surprisingly resilient labor market.",
    publishedAt: new Date(),
  });

  const article1c = await storage.createArticle({
    sourceId: fox.id,
    title: "Consumers Continue to Suffer as Fed Delays Rate Relief",
    url: "https://foxnews.com/fed-rates-3",
    snippet: "Another meeting passes with no relief for American families struggling with high borrowing costs.",
    publishedAt: new Date(),
  });

  // Create Story 1
  const story1 = await storage.createStory({
    headline: "Federal Reserve Maintains Current Interest Rates, Hints at Future Cuts",
    summary: "The Federal Reserve concluded its latest policy meeting by leaving benchmark interest rates unchanged at 5.25%-5.5%. Chairman Jerome Powell noted that while inflation has eased from its peak, the central bank needs more confidence that it is moving sustainably toward their 2% target before initiating cuts. The announcement met market expectations.",
    topic: "business",
    keyFacts: [
      "Interest rates remain at a 23-year high of 5.25%-5.5%.",
      "This is the fifth consecutive meeting without a rate change.",
      "The Fed's inflation target remains at 2%."
    ],
    divergenceSummary: "Coverage diverges primarily on the framing of the delay. Left-leaning and centrist outlets emphasize the cautious optimism regarding cooling inflation and strong economic fundamentals. Right-leaning outlets focus heavily on the continued financial burden high rates place on average consumers.",
    status: "published",
    publishedAt: new Date(),
  });

  await storage.linkArticleToStory(story1.id, article1a.id, "Emphasized the Fed's acknowledgment that inflation is cooling and moving in the right direction.");
  await storage.linkArticleToStory(story1.id, article1b.id, "Focused on the robust labor market data giving the Fed runway to wait.");
  await storage.linkArticleToStory(story1.id, article1c.id, "Framed the decision as an ongoing failure to provide relief to consumers struggling with debt.");

  // Insert Articles for Story 2
  const article2a = await storage.createArticle({
    sourceId: ap.id,
    title: "SpaceX Successfully Launches Next Generation Communication Satellite",
    url: "https://apnews.com/spacex-launch",
    snippet: "A Falcon 9 rocket successfully delivered a new commercial payload to orbit before completing a landing at sea.",
    publishedAt: new Date(Date.now() - 86400000), // Yesterday
  });

  const article2b = await storage.createArticle({
    sourceId: npr.id,
    title: "Latest SpaceX Launch Adds to Growing Low Earth Orbit Congestion",
    url: "https://npr.org/spacex-congestion",
    snippet: "While technically successful, astronomers again raise concerns about the increasing number of commercial satellites disrupting observations.",
    publishedAt: new Date(Date.now() - 86400000), // Yesterday
  });

  // Create Story 2
  const story2 = await storage.createStory({
    headline: "SpaceX Completes Falcon 9 Launch of Commercial Satellite",
    summary: "SpaceX successfully launched a Falcon 9 rocket from Cape Canaveral, delivering a next-generation communications satellite into low Earth orbit. The first stage booster successfully landed on a drone ship in the Atlantic Ocean minutes after liftoff. This marks the company's 30th launch of the year.",
    topic: "technology",
    keyFacts: [
      "Launch occurred at Cape Canaveral Space Force Station.",
      "Payload was a commercial communications satellite.",
      "The first stage booster was successfully recovered."
    ],
    divergenceSummary: "Most outlets covered the launch as a routine technical success. However, coverage from public media outlets prominently featured concerns from the scientific community regarding light pollution and orbital debris caused by the increasing frequency of commercial launches.",
    status: "published",
    publishedAt: new Date(Date.now() - 86400000),
  });

  await storage.linkArticleToStory(story2.id, article2a.id, "Reported the launch as a straightforward technical success.");
  await storage.linkArticleToStory(story2.id, article2b.id, "Dedicated the majority of the article to the environmental and astronomical impacts of the launch.");
}

const SOURCE_REGISTRY: Record<string, { url: string; rssUrl: string; biasRating: string }> = {
  "The New York Times": { url: "https://nytimes.com", rssUrl: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", biasRating: "center-left" },
  "The Wall Street Journal": { url: "https://wsj.com", rssUrl: "https://feeds.a.dj.com/rss/RSSWorldNews.xml", biasRating: "center-right" },
  "Associated Press": { url: "https://apnews.com", rssUrl: "https://feedx.net/rss/ap.xml", biasRating: "center" },
  "Fox News": { url: "https://foxnews.com", rssUrl: "https://moxie.foxnews.com/google-publisher/latest.xml", biasRating: "right" },
  "NPR": { url: "https://npr.org", rssUrl: "https://feeds.npr.org/1001/rss.xml", biasRating: "center-left" },
  "Reuters": { url: "https://reuters.com", rssUrl: "https://feedx.net/rss/reuters.xml", biasRating: "center" },
  "BBC News": { url: "https://bbc.com/news", rssUrl: "http://feeds.bbci.co.uk/news/rss.xml", biasRating: "center" },
  "OAN": { url: "https://oann.com", rssUrl: "https://www.oann.com/feed/", biasRating: "right" },
  "Ars Technica": { url: "https://arstechnica.com", rssUrl: "https://feeds.arstechnica.com/arstechnica/index", biasRating: "center" },
  "TechCrunch": { url: "https://techcrunch.com", rssUrl: "https://techcrunch.com/feed/", biasRating: "center-left" },
  "Wired": { url: "https://wired.com", rssUrl: "https://www.wired.com/feed/rss", biasRating: "center-left" },
  "The Verge": { url: "https://theverge.com", rssUrl: "https://www.theverge.com/rss/index.xml", biasRating: "center-left" },
  "Scientific American": { url: "https://scientificamerican.com", rssUrl: "http://rss.sciam.com/ScientificAmerican-Global", biasRating: "center" },
  "Nature News": { url: "https://nature.com", rssUrl: "https://www.nature.com/nature.rss", biasRating: "center" },
  "Science Daily": { url: "https://sciencedaily.com", rssUrl: "https://www.sciencedaily.com/rss/all.xml", biasRating: "center" },
  "STAT News": { url: "https://statnews.com", rssUrl: "https://www.statnews.com/feed/", biasRating: "center" },
  "Medical News Today": { url: "https://medicalnewstoday.com", rssUrl: "https://rss.medicalnewstoday.com/featurednews.xml", biasRating: "center" },
  "The Guardian - Environment": { url: "https://theguardian.com/environment", rssUrl: "https://www.theguardian.com/environment/rss", biasRating: "center-left" },
  "E&E News": { url: "https://eenews.net", rssUrl: "https://www.eenews.net/feed/", biasRating: "center" },
  "Bloomberg": { url: "https://bloomberg.com", rssUrl: "https://feeds.bloomberg.com/markets/news.rss", biasRating: "center" },
  "CNBC": { url: "https://cnbc.com", rssUrl: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", biasRating: "center" },
  "Financial Times": { url: "https://ft.com", rssUrl: "https://www.ft.com/?format=rss", biasRating: "center" },
  "The Economist": { url: "https://economist.com", rssUrl: "https://www.economist.com/latest/rss.xml", biasRating: "center" },
  "Al Jazeera": { url: "https://aljazeera.com", rssUrl: "https://www.aljazeera.com/xml/rss/all.xml", biasRating: "center-left" },

  // UK Sources
  "The Guardian": { url: "https://theguardian.com", rssUrl: "https://www.theguardian.com/uk/rss", biasRating: "center-left" },
  "The Telegraph": { url: "https://telegraph.co.uk", rssUrl: "https://www.telegraph.co.uk/rss.xml", biasRating: "center-right" },
  "The Independent": { url: "https://independent.co.uk", rssUrl: "https://www.independent.co.uk/news/uk/rss", biasRating: "center-left" },
  "Sky News": { url: "https://news.sky.com", rssUrl: "https://feeds.skynews.com/feeds/rss/home.xml", biasRating: "center" },
  "Daily Mail": { url: "https://dailymail.co.uk", rssUrl: "https://www.dailymail.co.uk/articles.rss", biasRating: "right" },
  "The Times UK": { url: "https://thetimes.co.uk", rssUrl: "https://www.thetimes.co.uk/rss", biasRating: "center-right" },
  "BBC UK": { url: "https://bbc.co.uk/news/uk", rssUrl: "http://feeds.bbci.co.uk/news/uk/rss.xml", biasRating: "center" },

  // Canada Sources
  "CBC News": { url: "https://cbc.ca/news", rssUrl: "https://www.cbc.ca/webfeed/rss/rss-topstories", biasRating: "center" },
  "The Globe and Mail": { url: "https://theglobeandmail.com", rssUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/canada/", biasRating: "center" },
  "National Post": { url: "https://nationalpost.com", rssUrl: "https://nationalpost.com/feed", biasRating: "center-right" },
  "CTV News": { url: "https://ctvnews.ca", rssUrl: "https://www.ctvnews.ca/rss/ctvnews-ca-top-stories-public-rss-1.822009", biasRating: "center" },
  "Toronto Star": { url: "https://thestar.com", rssUrl: "https://www.thestar.com/search/?f=rss&t=article&c=news*&l=50&s=start_time&sd=desc", biasRating: "center-left" },
  "Global News Canada": { url: "https://globalnews.ca", rssUrl: "https://globalnews.ca/feed/", biasRating: "center" },

  // Europe Sources
  "Deutsche Welle": { url: "https://dw.com", rssUrl: "https://rss.dw.com/rdf/rss-en-all", biasRating: "center" },
  "France 24": { url: "https://france24.com", rssUrl: "https://www.france24.com/en/rss", biasRating: "center" },
  "Euronews": { url: "https://euronews.com", rssUrl: "https://www.euronews.com/rss", biasRating: "center" },
  "The Local EU": { url: "https://thelocal.com", rssUrl: "https://www.thelocal.com/feeds/rss.php", biasRating: "center" },
  "Politico Europe": { url: "https://politico.eu", rssUrl: "https://www.politico.eu/feed/", biasRating: "center" },
  "EUobserver": { url: "https://euobserver.com", rssUrl: "https://euobserver.com/rss.xml", biasRating: "center" },
  "Der Spiegel International": { url: "https://spiegel.de/international", rssUrl: "https://www.spiegel.de/international/index.rss", biasRating: "center-left" },

  // International / Global Sources
  "Reuters World": { url: "https://reuters.com/world", rssUrl: "https://www.reutersagency.com/feed/", biasRating: "center" },
  "South China Morning Post": { url: "https://scmp.com", rssUrl: "https://www.scmp.com/rss/91/feed", biasRating: "center" },
  "The Japan Times": { url: "https://japantimes.co.jp", rssUrl: "https://www.japantimes.co.jp/feed/", biasRating: "center" },
  "Times of India": { url: "https://timesofindia.indiatimes.com", rssUrl: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", biasRating: "center" },
  "ABC News Australia": { url: "https://abc.net.au/news", rssUrl: "https://www.abc.net.au/news/feed/51120/rss.xml", biasRating: "center" },
  "The Straits Times": { url: "https://straitstimes.com", rssUrl: "https://www.straitstimes.com/news/world/rss.xml", biasRating: "center" },
  "Africa News": { url: "https://africanews.com", rssUrl: "https://www.africanews.com/feed/", biasRating: "center" },

  // Africa
  "AllAfrica": { url: "https://allafrica.com", rssUrl: "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf", biasRating: "center" },
  "The East African": { url: "https://theeastafrican.co.ke", rssUrl: "https://www.theeastafrican.co.ke/tea/rss", biasRating: "center" },
  "Daily Maverick": { url: "https://dailymaverick.co.za", rssUrl: "https://www.dailymaverick.co.za/rss", biasRating: "center-left" },
  "Premium Times Nigeria": { url: "https://premiumtimesng.com", rssUrl: "https://www.premiumtimesng.com/feed", biasRating: "center" },
  "News24 South Africa": { url: "https://news24.com", rssUrl: "https://feeds.news24.com/articles/news24/TopStories/rss", biasRating: "center" },
  "The Africa Report": { url: "https://theafricareport.com", rssUrl: "https://www.theafricareport.com/feed/", biasRating: "center" },

  // Middle East
  "Middle East Eye": { url: "https://middleeasteye.net", rssUrl: "https://www.middleeasteye.net/rss", biasRating: "center-left" },
  "The National UAE": { url: "https://thenationalnews.com", rssUrl: "https://www.thenationalnews.com/rss", biasRating: "center" },
  "Haaretz": { url: "https://haaretz.com", rssUrl: "https://www.haaretz.com/cmlink/1.628765", biasRating: "center-left" },
  "Arab News": { url: "https://arabnews.com", rssUrl: "https://www.arabnews.com/rss.xml", biasRating: "center" },
  "Iran International": { url: "https://iranintl.com", rssUrl: "https://www.iranintl.com/en/rss", biasRating: "center" },

  // Latin America
  "Buenos Aires Herald": { url: "https://buenosairesherald.com", rssUrl: "https://buenosairesherald.com/feed/", biasRating: "center" },
  "MercoPress": { url: "https://mercopress.com", rssUrl: "https://en.mercopress.com/rss", biasRating: "center" },
  "Mexico News Daily": { url: "https://mexiconewsdaily.com", rssUrl: "https://mexiconewsdaily.com/feed/", biasRating: "center" },
  "Brazil Reports": { url: "https://brazilreports.com", rssUrl: "https://brazilreports.com/feed/", biasRating: "center" },

  // Asia-Pacific
  "Nikkei Asia": { url: "https://asia.nikkei.com", rssUrl: "https://asia.nikkei.com/rss", biasRating: "center" },
  "The Diplomat": { url: "https://thediplomat.com", rssUrl: "https://thediplomat.com/feed/", biasRating: "center" },
  "Channel News Asia": { url: "https://channelnewsasia.com", rssUrl: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml", biasRating: "center" },
  "Kyodo News": { url: "https://english.kyodonews.net", rssUrl: "https://english.kyodonews.net/rss/news.xml", biasRating: "center" },
  "The Hindu": { url: "https://thehindu.com", rssUrl: "https://www.thehindu.com/feeder/default.rss", biasRating: "center" },

  // Eastern Europe / Russia
  "The Moscow Times": { url: "https://themoscowtimes.com", rssUrl: "https://www.themoscowtimes.com/rss/news", biasRating: "center" },
  "Kyiv Independent": { url: "https://kyivindependent.com", rssUrl: "https://kyivindependent.com/feed/", biasRating: "center" },
  "TASS English": { url: "https://tass.com", rssUrl: "https://tass.com/rss/v2.xml", biasRating: "right" },

  // Humanitarian / Conflict-specific
  "ReliefWeb": { url: "https://reliefweb.int", rssUrl: "https://reliefweb.int/updates/rss.xml", biasRating: "center" },
  "UN News": { url: "https://news.un.org", rssUrl: "https://news.un.org/feed/subscribe/en/news/all/rss.xml", biasRating: "center" },
  "The New Humanitarian": { url: "https://thenewhumanitarian.org", rssUrl: "https://www.thenewhumanitarian.org/rss.xml", biasRating: "center" },
  "ICRC News": { url: "https://icrc.org", rssUrl: "https://www.icrc.org/en/rss", biasRating: "center" },
};

async function updateSourceRssUrls() {
  const existingSources = await storage.getSources();
  for (const source of existingSources) {
    const entry = SOURCE_REGISTRY[source.name];
    if (entry && source.rssUrl !== entry.rssUrl) {
      await storage.updateSource(source.id, { rssUrl: entry.rssUrl });
      console.log(`[Seed] Updated RSS URL for ${source.name}`);
    }
  }

  for (const [name, entry] of Object.entries(SOURCE_REGISTRY)) {
    const existing = await storage.getSourceByName(name);
    if (!existing) {
      await storage.createSource({
        name,
        url: entry.url,
        rssUrl: entry.rssUrl,
        biasRating: entry.biasRating,
        isActive: true,
      });
      console.log(`[Seed] Added new source: ${name}`);
    }
  }
}
