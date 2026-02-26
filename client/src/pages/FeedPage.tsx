import { useState } from "react";
import { Link } from "wouter";
import { useStories } from "@/hooks/use-stories";
import { useQuery } from "@tanstack/react-query";
import { StoryCard } from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, ExternalLink, Flame, ArrowRight, Layers } from "lucide-react";
import { useEdition } from "@/components/EditionSelector";
import type { StoryResponse } from "@shared/routes";

interface LocalArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  snippet: string;
}

const TOPICS = ["All", "Politics", "World", "Business", "Technology", "Science", "Health", "Sports", "Entertainment", "Environment"];

export default function FeedPage() {
  const [activeTopic, setActiveTopic] = useState("All");
  const [page, setPage] = useState(1);
  const { edition, location } = useEdition();
  
  const { data, isLoading, isError } = useStories({
    topic: activeTopic === "All" ? undefined : activeTopic.toLowerCase(),
    region: edition,
    page,
    limit: 12
  });

  const { data: localNews } = useQuery<{ articles: LocalArticle[]; location: string }>({
    queryKey: ["/api/local-news", location],
    queryFn: async () => {
      if (!location) return { articles: [], location: "" };
      const res = await fetch(`/api/local-news?location=${encodeURIComponent(location)}`);
      if (!res.ok) return { articles: [], location };
      return res.json();
    },
    enabled: !!location && location.length > 0,
  });

  const { data: trendingData } = useQuery<{ stories: StoryResponse[] }>({
    queryKey: ["/api/stories/trending"],
    queryFn: async () => {
      const res = await fetch("/api/stories/trending?limit=6", { credentials: "include" });
      if (!res.ok) return { stories: [] };
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {trendingData && trendingData.stories.length > 0 && (
          <div className="mb-12" data-testid="trending-banner">
            <div className="flex items-center gap-2 mb-5">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="font-serif text-xl font-bold text-foreground uppercase tracking-wider">Trending</h2>
              <div className="flex-1 border-t border-border/50 ml-3" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-thin">
              {trendingData.stories.map((story) => {
                const sourceCount = story.storyArticles?.length || 0;
                return (
                  <Link
                    key={story.id}
                    href={`/story/${story.id}`}
                    className="group flex-shrink-0 w-72 bg-card border border-border/60 hover:border-foreground/30 p-5 transition-all cursor-pointer"
                    data-testid={`trending-story-${story.id}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">{story.topic}</span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                        <Layers className="w-3 h-3" />
                        {sourceCount}
                      </span>
                    </div>
                    <h3 className="font-serif text-sm font-bold leading-snug text-foreground line-clamp-3 group-hover:text-primary/80 transition-colors mb-3">
                      {story.headline}
                    </h3>
                    <div className="flex items-center text-[10px] text-muted-foreground gap-1 group-hover:text-foreground transition-colors">
                      <span>Read more</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {localNews && localNews.articles.length > 0 && (
          <div className="mb-12 border border-border bg-card p-6" data-testid="local-news-section">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-foreground" />
              <h2 className="font-serif text-xl font-bold text-foreground">
                Local News — {localNews.location}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localNews.articles.map((article, i) => (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 p-3 border border-border/50 hover:border-foreground/30 hover:bg-muted/50 transition-colors"
                  data-testid={`local-article-${i}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:underline line-clamp-2 mb-1">
                      {article.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {article.source} · {new Date(article.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Header & Filters */}
        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-8">
            The Feed
          </h1>
          
          <div className="flex flex-wrap gap-2 border-b border-border/50 pb-4">
            {TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  setActiveTopic(topic);
                  setPage(1); // Reset page on topic change
                }}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTopic === topic
                    ? "bg-foreground text-background"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="text-center py-32 border border-border bg-card">
            <h3 className="font-serif text-2xl text-foreground mb-2">Unable to load stories</h3>
            <p className="text-muted-foreground">Please try again later.</p>
          </div>
        ) : data?.stories.length === 0 ? (
          <div className="text-center py-32 border border-border bg-card">
            <h3 className="font-serif text-2xl text-foreground mb-2">No stories found</h3>
            <p className="text-muted-foreground">Check back later for updates on {activeTopic}.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {data?.stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>

            {/* Pagination Controls */}
            {data && data.totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center gap-4 border-t border-border/50 pt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-none font-serif"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground font-medium">
                  Page {data.currentPage} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="rounded-none font-serif"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
