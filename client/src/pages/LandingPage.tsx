import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Scale, BookOpen, BrainCircuit } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[1.1] tracking-tight mb-8">
              The news, <br className="hidden md:block"/>
              <span className="italic font-light text-muted-foreground">neutralized.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12 font-sans">
              We ingest stories from across the political spectrum, extract the undeniable facts, 
              and present a singular, objective narrative. Escape the echo chamber.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Button asChild size="lg" className="rounded-none px-8 py-6 text-base font-serif tracking-wide bg-foreground text-background hover:bg-foreground/90">
                  <Link href="/feed">
                    Read The Feed <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="rounded-none px-8 py-6 text-base font-serif tracking-wide bg-foreground text-background hover:bg-foreground/90" onClick={() => setShowAuth(true)} data-testid="button-create-account">
                    Create Free Account
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-none px-8 py-6 text-base font-serif tracking-wide bg-transparent border-foreground text-foreground hover:bg-muted">
                    <Link href="/methodology">
                      How It Works
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Abstract typographic background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] font-serif font-bold text-muted/20 select-none pointer-events-none -z-10">
          M
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              A new standard for information.
            </h2>
            <div className="w-16 h-px bg-foreground mx-auto mt-6 opacity-20"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <BookOpen className="w-8 h-8 mb-6 text-foreground" />,
                title: "Comprehensive Sourcing",
                desc: "We pull articles from dozens of verified publishers spanning the entire political spectrum, ensuring no perspective is left unseen."
              },
              {
                icon: <BrainCircuit className="w-8 h-8 mb-6 text-foreground" />,
                title: "AI Synthesis",
                desc: "Our engine strips away emotional language, adjectives, and partisan framing to find the overlapping consensus of facts."
              },
              {
                icon: <Scale className="w-8 h-8 mb-6 text-foreground" />,
                title: "Divergence Tracking",
                desc: "Where facts are disputed, we clearly highlight the divergence, showing exactly how different outlets framed the exact same event."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="flex flex-col items-center text-center p-6 border border-border/40 bg-background"
              >
                {feature.icon}
                <h3 className="font-serif text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Quote */}
      <section className="py-32 border-y border-border/50 bg-background relative overflow-hidden">
        {/* Unsplash abstract editorial image */}
        {/* abstract grayscale minimalist photography */}
        <img 
          src="https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=2000&auto=format&fit=crop" 
          alt="Abstract architecture" 
          className="absolute inset-0 w-full h-full object-cover opacity-5 grayscale"
        />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <span className="font-serif text-6xl text-muted-foreground/30 absolute -top-8 left-0">"</span>
          <h2 className="font-serif text-3xl md:text-5xl font-light leading-snug text-foreground italic">
            In an age of infinite information, clarity is the ultimate luxury. 
            We do the reading so you can do the thinking.
          </h2>
          <span className="font-serif text-6xl text-muted-foreground/30 absolute -bottom-16 right-0">"</span>
        </div>
      </section>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        defaultMode="signup"
      />
    </div>
  );
}
