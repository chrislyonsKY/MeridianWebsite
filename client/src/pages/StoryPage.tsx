import { useParams, Link } from "wouter";
import { useStory } from "@/hooks/use-stories";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BiasBadge } from "@/components/ui/BiasBadge";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Eye, EyeOff, AlertTriangle, CheckCircle2, BarChart3, Layers, Target, Link2, GitCompareArrows, ChevronDown, ChevronUp, Bookmark, Clock } from "lucide-react";
import { SiX, SiFacebook, SiLinkedin } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useAuth } from "@/hooks/use-auth";
import { StoryCard } from "@/components/StoryCard";
import type { StoryResponse } from "@shared/routes";

function getReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

interface NarrativeLensItem {
  sourceName: string;
  biasRating: string;
  framing: string;
  tone: string;
  emphasis: string;
  omissions: string;
  wordChoice: string;
}

interface CoverageGapItem {
  fact: string;
  coveredBy: string[];
  missedBy: string[];
  significance: string;
}

function ConsensusGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getLabel = () => {
    if (score >= 80) return "High Consensus";
    if (score >= 60) return "Moderate Consensus";
    return "Low Consensus";
  };

  return (
    <div className="flex flex-col items-center" data-testid="consensus-gauge">
      <div className="relative w-24 h-24 mb-3">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${score * 2.51} 251`}
            className={getColor().replace("bg-", "text-")}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-2xl font-bold text-foreground">{score}</span>
        </div>
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{getLabel()}</span>
    </div>
  );
}

function ToneBadge({ tone }: { tone: string }) {
  const toneColors: Record<string, string> = {
    alarming: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    critical: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    cautious: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    measured: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    neutral: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
    celebratory: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    sympathetic: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    informative: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  };

  const color = toneColors[tone.toLowerCase()] || toneColors.neutral;
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${color}`} data-testid="tone-badge">
      {tone}
    </span>
  );
}

export default function StoryPage() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const { data: story, isLoading, isError } = useStory(id);

  const { data: relatedData } = useQuery<{ stories: StoryResponse[] }>({
    queryKey: ["/api/stories", id, "related"],
    queryFn: async () => {
      const res = await fetch(`/api/stories/${id}/related?limit=4`, { credentials: "include" });
      if (!res.ok) return { stories: [] };
      return res.json();
    },
    enabled: !!id && !isNaN(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !story) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-background">
        <h2 className="font-serif text-3xl mb-4">Story not found</h2>
        <Link href="/feed" className="text-primary hover:underline" data-testid="link-back-to-feed">Return to feed</Link>
      </div>
    );
  }

  const publishedDate = story.publishedAt ? new Date(story.publishedAt) : new Date(story.createdAt);
  const narrativeLens = (story as any).narrativeLens as NarrativeLensItem[] | null;
  const coverageGaps = (story as any).coverageGaps as CoverageGapItem[] | null;
  const consensusScore = (story as any).consensusScore as number | null;
  const sourceCount = story.storyArticles?.length || 0;
  const readingTime = getReadingTime([story.summary || "", ...((story as any).keyFacts || [])].join(" "));
  const bookmarked = isBookmarked(story.id);

  return (
    <article className="min-h-screen bg-background pb-32">
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/feed" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Link>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`reading-time-${story.id}`}>
              <Clock className="w-3.5 h-3.5" />
              {readingTime} min read
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layers className="w-3.5 h-3.5" />
              {sourceCount} sources
            </div>
            {isAuthenticated && (
              <button
                onClick={() => toggleBookmark(story.id)}
                className={`p-1.5 rounded-full transition-colors ${bookmarked ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                data-testid={`bookmark-btn-${story.id}`}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark story"}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-foreground text-background text-xs font-bold uppercase tracking-widest" data-testid="badge-topic">
              {story.topic}
            </span>
            <time className="text-sm text-muted-foreground font-medium" data-testid="text-date">
              {format(publishedDate, "MMMM d, yyyy")}
            </time>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-8" data-testid="text-headline">
            {story.headline}
          </h1>

          <div className="flex items-center gap-2 text-sm text-muted-foreground italic border-l-2 border-foreground/20 pl-4">
            <Target className="w-4 h-4 flex-shrink-0" />
            This synthesis was generated by AI from {sourceCount} source articles across the political spectrum.
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-6">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-1">Share</span>
            <Button
              size="icon"
              variant="ghost"
              data-testid="share-twitter"
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                const text = encodeURIComponent(story.headline);
                window.open(`https://x.com/intent/tweet?url=${url}&text=${text}`, "_blank", "noopener,noreferrer");
              }}
            >
              <SiX className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid="share-facebook"
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer");
              }}
            >
              <SiFacebook className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid="share-linkedin"
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener,noreferrer");
              }}
            >
              <SiLinkedin className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid="share-copy-link"
              onClick={() => {
                const url = window.location.href;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(url).then(() => {
                    toast({ title: "Link copied!", description: "The story link has been copied to your clipboard." });
                  }).catch(() => {
                    toast({ title: "Copy failed", description: "Unable to copy link. Try selecting the URL manually." });
                  });
                } else {
                  const ta = document.createElement("textarea");
                  ta.value = url;
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand("copy");
                  document.body.removeChild(ta);
                  toast({ title: "Link copied!", description: "The story link has been copied to your clipboard." });
                }
              }}
            >
              <Link2 className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* The Synthesized Narrative */}
        <section className="prose prose-lg prose-slate dark:prose-invert max-w-none mb-16" data-testid="section-summary">
          <p className="drop-cap text-xl leading-relaxed text-foreground">
            {story.summary}
          </p>
        </section>

        {/* Consensus + Key Facts Row */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 my-16 items-start">
          {consensusScore !== null && consensusScore !== undefined && (
            <div className="bg-card border border-border p-6 flex flex-col items-center">
              <ConsensusGauge score={consensusScore} />
              <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">
                How much sources agree on core facts
              </p>
            </div>
          )}

          {story.keyFacts && story.keyFacts.length > 0 && (
            <section className="bg-card p-8 border border-border" data-testid="section-key-facts">
              <h3 className="font-serif text-2xl font-bold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                <CheckCircle2 className="w-5 h-5" />
                Verified Facts
              </h3>
              <ul className="space-y-4">
                {story.keyFacts.map((fact, index) => (
                  <li key={index} className="flex gap-3 text-sm text-foreground leading-relaxed" data-testid={`text-fact-${index}`}>
                    <span className="block w-1.5 h-1.5 mt-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="editorial-divider"></div>

        {/* Narrative Divergence */}
        {story.divergenceSummary && (
          <section className="my-16" data-testid="section-divergence">
            <h3 className="font-serif text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
              <BarChart3 className="w-6 h-6" />
              Why Coverage Differs
            </h3>
            <div className="bg-muted/30 p-8 border border-border">
              <p className="text-foreground leading-relaxed">{story.divergenceSummary}</p>
            </div>
          </section>
        )}

        {/* Narrative Lens — unique to The Meridian */}
        {narrativeLens && narrativeLens.length > 0 && (
          <>
            <div className="editorial-divider"></div>
            <section className="my-16" data-testid="section-narrative-lens">
              <div className="mb-8">
                <h3 className="font-serif text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                  <Eye className="w-6 h-6" />
                  Narrative Lens
                </h3>
                <p className="text-sm text-muted-foreground">
                  How each source shaped the story through tone, emphasis, and editorial choices. This is what aggregators don't show you.
                </p>
              </div>

              <div className="space-y-4">
                {narrativeLens.map((lens, index) => (
                  <div key={index} className="bg-card border border-border overflow-hidden" data-testid={`card-lens-${index}`}>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted flex items-center justify-center font-serif text-sm font-bold text-foreground">
                            {lens.sourceName.charAt(0)}
                          </div>
                          <span className="font-serif font-bold text-lg">{lens.sourceName}</span>
                          <BiasBadge bias={lens.biasRating} />
                        </div>
                        <ToneBadge tone={lens.tone} />
                      </div>

                      <p className="text-sm text-foreground leading-relaxed mb-4">{lens.framing}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/50">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            <Target className="w-3 h-3" />
                            Emphasis
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">{lens.emphasis}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            <EyeOff className="w-3 h-3" />
                            Omissions
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">{lens.omissions}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            <AlertTriangle className="w-3 h-3" />
                            Word Choice
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">{lens.wordChoice}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Coverage Gaps — unique to The Meridian */}
        {coverageGaps && coverageGaps.length > 0 && (
          <>
            <div className="editorial-divider"></div>
            <section className="my-16" data-testid="section-coverage-gaps">
              <div className="mb-8">
                <h3 className="font-serif text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                  <EyeOff className="w-6 h-6" />
                  Coverage Gaps
                </h3>
                <p className="text-sm text-muted-foreground">
                  Facts and angles that only some sources reported. These blind spots reveal what your usual news source might not tell you.
                </p>
              </div>

              <div className="space-y-4">
                {coverageGaps.map((gap, index) => (
                  <div key={index} className="bg-card border border-border p-6" data-testid={`card-gap-${index}`}>
                    <p className="text-sm font-semibold text-foreground mb-3">{gap.fact}</p>
                    <div className="flex flex-wrap gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-muted-foreground">Covered by:</span>
                        <div className="flex gap-1">
                          {gap.coveredBy.map((s, i) => (
                            <span key={i} className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs text-muted-foreground">Missed by:</span>
                        <div className="flex gap-1">
                          {gap.missedBy.map((s, i) => (
                            <span key={i} className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{gap.significance}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {narrativeLens && narrativeLens.length >= 2 && (
          <>
            <div className="editorial-divider"></div>
            <section className="my-16">
              <Button
                variant="outline"
                onClick={() => {
                  setCompareOpen(!compareOpen);
                  if (!compareOpen && selectedSources.length === 0) {
                    setSelectedSources(narrativeLens.slice(0, 2).map(l => l.sourceName));
                  }
                }}
                className="w-full flex items-center justify-between gap-2"
                data-testid="source-compare-toggle"
              >
                <div className="flex items-center gap-2">
                  <GitCompareArrows className="w-4 h-4" />
                  <span className="font-serif font-bold">Compare Sources</span>
                </div>
                {compareOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {compareOpen && (
                <div className="mt-6" data-testid="source-compare-panel">
                  <div className="flex flex-wrap gap-4 mb-6">
                    {narrativeLens.map((lens) => {
                      const isSelected = selectedSources.includes(lens.sourceName);
                      const isDisabled = !isSelected && selectedSources.length >= 3;
                      return (
                        <label
                          key={lens.sourceName}
                          className={`flex items-center gap-2 px-3 py-2 border border-border rounded-md cursor-pointer transition-colors ${isSelected ? "bg-muted" : ""} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                          data-testid={`source-compare-checkbox-${lens.sourceName}`}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSources(prev => [...prev, lens.sourceName]);
                              } else {
                                setSelectedSources(prev => prev.filter(s => s !== lens.sourceName));
                              }
                            }}
                          />
                          <span className="text-sm font-medium text-foreground">{lens.sourceName}</span>
                          <BiasBadge bias={lens.biasRating} />
                        </label>
                      );
                    })}
                  </div>

                  {selectedSources.length < 2 && (
                    <p className="text-sm text-muted-foreground italic text-center py-8">
                      Select at least 2 sources to compare.
                    </p>
                  )}

                  {selectedSources.length >= 2 && (
                    <div className={`grid gap-4 ${selectedSources.length === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
                      {narrativeLens
                        .filter(lens => selectedSources.includes(lens.sourceName))
                        .map((lens) => (
                          <div key={lens.sourceName} className="bg-card border border-border p-6">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
                              <div className="w-8 h-8 bg-muted flex items-center justify-center font-serif text-sm font-bold text-foreground">
                                {lens.sourceName.charAt(0)}
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-serif font-bold text-base">{lens.sourceName}</span>
                                <div className="flex items-center gap-2">
                                  <BiasBadge bias={lens.biasRating} />
                                  <ToneBadge tone={lens.tone} />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Framing</div>
                                <p className="text-sm text-foreground leading-relaxed">{lens.framing}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                                  <Target className="w-3 h-3" />
                                  Emphasis
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{lens.emphasis}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                                  <EyeOff className="w-3 h-3" />
                                  Omissions
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{lens.omissions}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        <div className="editorial-divider"></div>

        {/* Source Articles */}
        <section className="mt-16" data-testid="section-sources">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif text-3xl font-bold text-foreground">Original Sources</h3>
          </div>

          <div className="space-y-4">
            {story.storyArticles?.map((sa) => (
              <div key={sa.id} className="bg-card border border-border p-6 transition-all hover:border-foreground/30" data-testid={`card-source-${sa.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {sa.article.source.logoUrl ? (
                      <img src={sa.article.source.logoUrl} alt={sa.article.source.name} className="w-6 h-6 object-contain" />
                    ) : (
                      <div className="w-6 h-6 bg-muted flex items-center justify-center font-serif text-xs font-bold text-foreground">
                        {sa.article.source.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-serif font-bold text-lg">{sa.article.source.name}</span>
                    <BiasBadge bias={sa.article.source.biasRating} />
                  </div>
                  <a
                    href={sa.article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                    data-testid={`link-source-${sa.id}`}
                  >
                    Read Original <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>

                <div className="pl-0 sm:pl-9">
                  <h4 className="font-sans font-semibold text-foreground mb-2 line-clamp-2">
                    {sa.article.title}
                  </h4>
                  {sa.sourceSnippet && (
                    <blockquote className="border-l-2 border-border pl-4 text-sm text-muted-foreground italic leading-relaxed">
                      "{sa.sourceSnippet}"
                    </blockquote>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {relatedData && relatedData.stories.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border" data-testid="related-stories-section">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-8 uppercase tracking-wider">Related Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedData.stories.map((related) => (
                <StoryCard key={related.id} story={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
