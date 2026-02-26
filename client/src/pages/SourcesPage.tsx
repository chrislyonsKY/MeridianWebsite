import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Loader2, ExternalLink } from "lucide-react";

const BIAS_LABELS: Record<string, string> = {
  "left": "Left",
  "center-left": "Center-Left",
  "center": "Center",
  "center-right": "Center-Right",
  "right": "Right",
};

const BIAS_COLORS: Record<string, string> = {
  "left": "bg-blue-500",
  "center-left": "bg-sky-400",
  "center": "bg-purple-400",
  "center-right": "bg-rose-400",
  "right": "bg-red-500",
};

const BIAS_ORDER = ["left", "center-left", "center", "center-right", "right"];

export default function SourcesPage() {
  const { data: sourcesList, isLoading } = useQuery({
    queryKey: [api.sources.list.path],
    queryFn: async () => {
      const res = await fetch(api.sources.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sources");
      return res.json();
    },
  });

  const groupedSources = sourcesList
    ? BIAS_ORDER.reduce((acc: Record<string, any[]>, bias) => {
        acc[bias] = sourcesList.filter((s: any) => s.biasRating === bias);
        return acc;
      }, {})
    : {};

  return (
    <div className="min-h-screen bg-background pt-16 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <header className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
            Sources Index
          </h1>
          <p className="text-xl text-muted-foreground font-serif italic">
            The publications we monitor, organized by editorial lean.
          </p>
          <div className="editorial-divider"></div>
        </header>

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-foreground mb-12">
          <p className="drop-cap">
            The Meridian monitors these news sources to build its neutral summaries. We categorize each source 
            based on established media bias charts. A story must be covered by multiple sources across 
            the spectrum before we generate a neutral analysis.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-12">
            {BIAS_ORDER.map((bias) => {
              const items = groupedSources[bias];
              if (!items || items.length === 0) return null;
              return (
                <section key={bias}>
                  <div className="flex items-center gap-3 mb-6 border-b border-border pb-3">
                    <span className={`w-3 h-3 rounded-full ${BIAS_COLORS[bias]}`} />
                    <h2 className="font-serif text-2xl font-bold text-foreground" data-testid={`heading-bias-${bias}`}>
                      {BIAS_LABELS[bias]}
                    </h2>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {items.length} {items.length === 1 ? "source" : "sources"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((source: any) => (
                      <a
                        key={source.id}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 border border-border/60 bg-card hover:bg-muted/50 transition-colors"
                        data-testid={`source-card-${source.id}`}
                      >
                        <div>
                          <span className="font-serif font-semibold text-foreground group-hover:text-foreground/80 transition-colors">
                            {source.name}
                          </span>
                          <span className={`ml-2 inline-block w-2 h-2 rounded-full ${BIAS_COLORS[source.biasRating]}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-20 pt-10 border-t border-border">
          <h3 className="font-serif text-xl font-bold text-foreground mb-4">Bias Rating Spectrum</h3>
          <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden mb-3">
            <div className="flex-1 bg-blue-500 h-full" />
            <div className="flex-1 bg-sky-400 h-full" />
            <div className="flex-1 bg-purple-400 h-full" />
            <div className="flex-1 bg-rose-400 h-full" />
            <div className="flex-1 bg-red-500 h-full" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Left</span>
            <span>Center</span>
            <span>Right</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            Bias ratings are based on established media bias charts and reflect the general editorial 
            lean of each publication. Individual articles may vary from their source's overall rating.
          </p>
        </div>
      </div>
    </div>
  );
}
