import { Link } from "wouter";
import { ArrowLeft, Compass, Scale, Eye, Brain, Users, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pt-16 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <header className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
            About The Meridian
          </h1>
          <p className="text-xl text-muted-foreground font-serif italic">
            Finding the signal in the noise.
          </p>
          <div className="editorial-divider"></div>
        </header>

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-foreground">
          <p className="drop-cap">
            The Meridian was built on a simple premise: the news shouldn't tell you what to think. 
            In a media landscape increasingly shaped by editorial slant, algorithmic echo chambers, and 
            emotional framing, finding objective information has become exhausting. We set out to fix that.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">What We Do</h2>
          <p>
            The Meridian aggregates reporting from dozens of news sources across the political spectrum — 
            from left to right, mainstream to independent, domestic to international. Our AI engine clusters 
            articles covering the same story, extracts the verifiable facts, identifies where outlets agree 
            and diverge, and presents a single, neutralized summary.
          </p>
          <p>
            The result is a feed of stories stripped of spin, where every claim is cross-referenced against 
            multiple sources and every narrative divergence is made transparent.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12 not-prose">
            <div className="flex flex-col items-center text-center p-6 border border-border/60 bg-card" data-testid="about-value-neutrality">
              <Scale className="w-8 h-8 text-foreground mb-4" />
              <h3 className="font-serif font-semibold text-foreground mb-2">Neutrality First</h3>
              <p className="text-sm text-muted-foreground">Every summary is generated to present facts without editorial framing or emotional language.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 border border-border/60 bg-card" data-testid="about-value-transparency">
              <Eye className="w-8 h-8 text-foreground mb-4" />
              <h3 className="font-serif font-semibold text-foreground mb-2">Full Transparency</h3>
              <p className="text-sm text-muted-foreground">See exactly which sources reported each story and how their narratives differ.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 border border-border/60 bg-card" data-testid="about-value-access">
              <Globe className="w-8 h-8 text-foreground mb-4" />
              <h3 className="font-serif font-semibold text-foreground mb-2">Open Access</h3>
              <p className="text-sm text-muted-foreground">All content is free to read. No paywalls, no gates. Informed citizens make better decisions.</p>
            </div>
          </div>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">How It Works</h2>
          <p>
            Our pipeline runs continuously, pulling articles from RSS feeds across our source network. 
            Using advanced language models, we:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Cluster</strong> articles from different outlets that cover the same underlying event or topic.</li>
            <li><strong>Extract</strong> the key facts that multiple sources agree on — the consensus reality.</li>
            <li><strong>Identify</strong> narrative divergences — where outlets frame the same facts differently or emphasize different angles.</li>
            <li><strong>Synthesize</strong> a neutral summary that presents what happened without telling you how to feel about it.</li>
          </ul>
          <p>
            Each story also includes a consensus score, narrative lens analysis, and coverage gap detection, 
            giving you a complete picture of not just what happened, but how it's being reported.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">Our Sources</h2>
          <p>
            We pull from a wide spectrum of outlets — including the Associated Press, Reuters, BBC News, 
            The New York Times, The Wall Street Journal, Fox News, NPR, OAN, Al Jazeera, Bloomberg, 
            and many more. We also cover specialized beats with sources like Nature, Scientific American, 
            STAT News, TechCrunch, and The Economist.
          </p>
          <p>
            Each source is rated on a bias scale from left to right, not to judge them, but to ensure 
            our coverage draws from across the full spectrum. You can explore our complete source list on 
            the <Link href="/sources" className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors">Sources page</Link>.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">Why "The Meridian"?</h2>
          <p>
            A meridian is a line that divides east from west — a fixed reference point for navigation. 
            In a world where the truth is pulled in every direction, The Meridian aims to be that 
            fixed point: a place where you can orient yourself with facts, not spin.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">Get in Touch</h2>
          <p>
            Have questions, feedback, or a source suggestion? We'd love to hear from you. 
            Visit our <Link href="/contact" className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors">Contact page</Link> to 
            send us a message.
          </p>
        </div>

        <div className="mt-20 pt-10 border-t border-border flex justify-center">
          <Link href="/" className="inline-flex items-center px-6 py-3 bg-foreground text-background font-serif font-bold hover:bg-foreground/90 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
