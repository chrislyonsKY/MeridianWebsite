import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background pt-16 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <header className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
            Methodology
          </h1>
          <p className="text-xl text-muted-foreground font-serif italic">
            How we build the neutral ground.
          </p>
          <div className="editorial-divider"></div>
        </header>

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-foreground">
          <p className="drop-cap">
            At The Meridian, we take a comprehensive, data-driven approach to news. We aggregate reporting 
            from across the political spectrum, use AI to extract the verifiable facts, and present a singular 
            neutral narrative — giving readers the tools to understand what happened without being told how to feel about it.
          </p>

          <nav className="not-prose my-12 p-6 border border-border bg-card">
            <h3 className="font-serif font-bold text-foreground mb-4">Index</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#bias-ratings" className="text-muted-foreground hover:text-foreground transition-colors">Bias Ratings</a></li>
              <li><a href="#neutrality-engine" className="text-muted-foreground hover:text-foreground transition-colors">The Neutrality Engine</a></li>
              <li><a href="#consensus-score" className="text-muted-foreground hover:text-foreground transition-colors">Consensus Score</a></li>
              <li><a href="#narrative-lens" className="text-muted-foreground hover:text-foreground transition-colors">Narrative Lens Analysis</a></li>
              <li><a href="#coverage-gaps" className="text-muted-foreground hover:text-foreground transition-colors">Coverage Gap Detection</a></li>
              <li><a href="#pipeline" className="text-muted-foreground hover:text-foreground transition-colors">The Pipeline</a></li>
              <li><a href="#transparency" className="text-muted-foreground hover:text-foreground transition-colors">Transparency</a></li>
            </ul>
          </nav>

          <h2 id="bias-ratings" className="font-serif text-3xl font-bold mt-16 mb-6 border-b border-border pb-2">Bias Ratings</h2>
          <p>
            The Meridian's bias ratings assess the political leaning of each news publication in our source network. 
            These ratings are informed by established media bias research organizations and reflect each outlet's 
            overall editorial tendency — not any individual article.
          </p>
          <p>
            The ratings take into consideration factors such as wording, story selection, editorial framing, 
            and political affiliation. The analysis is conducted in the context of the U.S. political system.
          </p>

          <div className="not-prose my-10">
            <div className="relative">
              <div className="flex h-8 rounded-sm overflow-hidden border border-border">
                <div className="flex-1 bg-blue-700 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white">LEFT</div>
                <div className="flex-1 bg-blue-400 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white">CENTER-LEFT</div>
                <div className="flex-1 bg-gray-400 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white">CENTER</div>
                <div className="flex-1 bg-red-400 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white">CENTER-RIGHT</div>
                <div className="flex-1 bg-red-700 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white">RIGHT</div>
              </div>
            </div>
          </div>

          <div className="not-prose space-y-4 my-8">
            {[
              { rating: "Left", color: "bg-blue-700", description: "These publications tend to reflect the positions held by leaders of left-leaning parties. They are moderately to strongly biased toward liberal causes through story selection and/or political affiliation. They may use loaded words, publish misleading reports, or leave out information that doesn't support liberal causes." },
              { rating: "Center-Left", color: "bg-blue-400", description: "These publications have a slight to moderate liberal bias. They often publish factual information but may use loaded words that favor liberal causes. They generally maintain journalistic standards while showing editorial preference." },
              { rating: "Center", color: "bg-gray-400", description: "These publications have no discernable political position. They use very few loaded words and the reporting is well sourced. On a given issue, they present a relatively complete survey of key competing positions. This rating does not necessarily represent \"balance\" or \"neutrality.\"" },
              { rating: "Center-Right", color: "bg-red-400", description: "These publications are slightly to moderately conservative in bias. They often publish factual information but may use loaded words that favor conservative causes. They generally maintain journalistic standards while showing editorial preference." },
              { rating: "Right", color: "bg-red-700", description: "These publications tend to reflect the positions held by leaders of right-leaning parties. They are moderately to strongly biased toward conservative causes through story selection and/or political affiliation. They may publish misleading reports or leave out information that doesn't support conservative causes." },
            ].map((item) => (
              <div key={item.rating} className="flex gap-4 p-4 border border-border bg-card">
                <div className={`${item.color} w-3 flex-shrink-0 rounded-sm`} />
                <div>
                  <h4 className="font-serif font-bold text-foreground mb-1">{item.rating}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <p>
            You may encounter a source that has not been rated. These outlets are still included in our pipeline 
            but will not appear in bias breakdowns until a rating is established.
          </p>

          <h2 id="neutrality-engine" className="font-serif text-3xl font-bold mt-16 mb-6 border-b border-border pb-2">The Neutrality Engine</h2>
          <p>
            Once articles from multiple sources are clustered around the same event, we feed them into our 
            AI-powered Neutrality Engine — a Large Language Model (currently OpenAI's GPT series) operating 
            under strict systemic constraints. The engine is not summarizing — it is <em>synthesizing</em>.
          </p>
          <p>
            The engine is instructed to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Identify the undeniable <strong>Key Facts</strong> that all sources agree upon.</li>
            <li>Strip away all adjectives, emotional framing, and speculative commentary.</li>
            <li>Write a <strong>Neutral Summary</strong> — original journalism based strictly on overlapping facts, not a summary of summaries.</li>
            <li>Identify the <strong>Narrative Divergence</strong> — explicitly stating what details were highlighted by left-leaning sources versus right-leaning sources, and <em>why</em>.</li>
          </ul>
          <p>
            The output is a fact-first narrative that reads like objective reporting, not a mashup of existing articles. 
            The goal is to present what happened in a way that no single outlet did, because no single outlet had 
            the complete picture.
          </p>

          <h2 id="consensus-score" className="font-serif text-3xl font-bold mt-16 mb-6 border-b border-border pb-2">Consensus Score</h2>
          <p>
            Every story on The Meridian includes a <strong>Consensus Score</strong> — a number from 0 to 100 
            that represents how much the underlying sources agree on core facts.
          </p>

          <div className="not-prose my-8">
            <div className="relative h-6 rounded-sm overflow-hidden border border-border">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500" />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-bold text-white">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Contradictory</span>
              <span>Mixed</span>
              <span>Full Agreement</span>
            </div>
          </div>

          <div className="not-prose space-y-3 my-8">
            {[
              { range: "90–100", label: "Strong Consensus", description: "Sources are reporting essentially the same facts with minimal variation. Differences are stylistic, not substantive." },
              { range: "70–89", label: "General Agreement", description: "Core facts align across sources, but there are notable differences in emphasis, framing, or included details." },
              { range: "40–69", label: "Mixed Consensus", description: "Sources agree on some facts but diverge on key details, causes, or implications. Important to read the divergence analysis." },
              { range: "0–39", label: "Low Consensus", description: "Sources present significantly different narratives. The underlying facts may be disputed or selectively reported. Exercise caution." },
            ].map((item) => (
              <div key={item.range} className="flex gap-4 p-4 border border-border bg-card">
                <div className="font-mono text-sm font-bold text-foreground w-16 flex-shrink-0">{item.range}</div>
                <div>
                  <h4 className="font-serif font-bold text-foreground text-sm mb-0.5">{item.label}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 id="narrative-lens" className="font-serif text-3xl font-bold mt-16 mb-6 border-b border-border pb-2">Narrative Lens Analysis</h2>
          <p>
            For every story, we analyze how each contributing source framed the event. The <strong>Narrative Lens</strong> examines 
            four dimensions of editorial choice for each outlet:
          </p>

          <div className="not-prose space-y-3 my-8">
            {[
              { label: "Tone", description: "The overall emotional register of the reporting — alarming, measured, celebratory, critical, dismissive, etc." },
              { label: "Emphasis", description: "What aspect the source chose to lead with. Different outlets often foreground different facets of the same event." },
              { label: "Omissions", description: "What the source left out that other outlets included. These gaps reveal editorial priorities and potential blind spots." },
              { label: "Word Choice", description: "Specific words or phrases that reveal editorial slant — the difference between 'reform' and 'overhaul', or 'undocumented immigrant' and 'illegal alien'." },
            ].map((item) => (
              <div key={item.label} className="flex gap-4 p-4 border border-border bg-card">
                <div className="font-serif font-bold text-foreground w-28 flex-shrink-0">{item.label}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <p>
            This analysis makes explicit what most readers sense intuitively but struggle to articulate: 
            the same set of facts can tell very different stories depending on which facts are emphasized, 
            which are omitted, and what language is used to describe them.
          </p>

          <h2 id="coverage-gaps" className="font-serif text-3xl font-bold mt-16 mb-6 border-b border-border pb-2">Coverage Gap Detection</h2>
          <p>
            A <strong>Coverage Gap</strong> occurs when a fact or angle is reported by some sources but ignored by others. 
            These gaps are often more revealing than the content itself.
          </p>
          <p>
            For each gap we identify:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>The fact or angle</strong> that was selectively reported</li>
            <li><strong>Which outlets covered it</strong> and which missed it</li>
            <li><strong>The significance</strong> — why this omission matters for the reader's understanding</li>
          </ul>
          <p>
            Coverage gaps help readers understand not just what was reported, but what <em>wasn't</em> — 
            and why that absence might be significant.
          </p>

          <h2 id="pipeline" className="font-serif text-3xl font-bold mt-16 mb-6 border-b border-border pb-2">The Pipeline</h2>
          <p>
            Our automated pipeline runs continuously, executing four stages:
          </p>

          <div className="not-prose my-10">
            <div className="space-y-0">
              {[
                { step: "1", title: "Ingestion", desc: "RSS feeds from 20+ sources are polled continuously. Articles from the last 48 hours are ingested and deduplicated." },
                { step: "2", title: "Clustering", desc: "AI groups articles covering the same underlying event into story clusters. Only events with 2+ sources from different outlets qualify." },
                { step: "3", title: "Synthesis", desc: "The Neutrality Engine analyzes each cluster, producing the neutral headline, summary, key facts, divergence analysis, consensus score, narrative lens, and coverage gaps." },
                { step: "4", title: "Publication", desc: "Synthesized stories are published to the feed with full source attribution and links to original articles." },
              ].map((item, i) => (
                <div key={item.step} className="flex gap-4 p-5 border border-border bg-card relative">
                  <div className="flex-shrink-0 w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center font-serif font-bold text-lg">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="absolute left-[2.05rem] -bottom-3 w-0.5 h-6 bg-border z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <h2 id="transparency" className="font-serif text-3xl font-bold mt-16 mb-6 border-b border-border pb-2">Transparency</h2>
          <p>
            We don't hide the original articles. At the bottom of every story, we provide:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>The specific <strong>source snippets</strong> showing exactly how each publication framed the event</li>
            <li>The <strong>bias rating</strong> of each contributing source</li>
            <li>A <strong>direct link</strong> to read their full original article</li>
            <li>The complete <strong>narrative lens breakdown</strong> for each outlet</li>
          </ul>
          <p>
            Our goal is not to replace the news outlets you read. It's to give you the complete picture 
            so you can evaluate their reporting with full context. We do the reading so you can do the thinking.
          </p>

          <div className="not-prose mt-16 p-8 border border-border bg-card text-center">
            <p className="font-serif text-lg text-foreground mb-2">
              "Objective reality is out there."
            </p>
            <p className="text-sm text-muted-foreground">
              Questions about our methodology? <Link href="/contact" className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors">Contact us</Link>.
            </p>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-border flex justify-center">
          <Link href="/feed" className="inline-flex items-center px-6 py-3 bg-foreground text-background font-serif font-bold hover:bg-foreground/90 transition-colors" data-testid="link-read-feed">
            Read The Feed <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
