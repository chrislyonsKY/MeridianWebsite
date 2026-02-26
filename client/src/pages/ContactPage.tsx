import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Send, Mail, MessageSquare, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send message");
      }

      setSubmitted(true);
      toast({
        title: "Message sent",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <header className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-muted-foreground font-serif italic">
            Questions, concerns, or feedback — we're listening.
          </p>
          <div className="editorial-divider"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="flex flex-col items-center text-center p-6 border border-border/60 bg-card" data-testid="contact-info-general">
            <MessageSquare className="w-8 h-8 text-foreground mb-4" />
            <h3 className="font-serif font-semibold text-foreground mb-2">General Inquiries</h3>
            <p className="text-sm text-muted-foreground">Questions about our platform, methodology, or coverage.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border border-border/60 bg-card" data-testid="contact-info-privacy">
            <AlertCircle className="w-8 h-8 text-foreground mb-4" />
            <h3 className="font-serif font-semibold text-foreground mb-2">Privacy Requests</h3>
            <p className="text-sm text-muted-foreground">Data access, correction, or deletion requests per our Privacy Policy.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border border-border/60 bg-card" data-testid="contact-info-press">
            <Mail className="w-8 h-8 text-foreground mb-4" />
            <h3 className="font-serif font-semibold text-foreground mb-2">Press & Partnerships</h3>
            <p className="text-sm text-muted-foreground">Media inquiries, source partnerships, or collaboration proposals.</p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-20 border border-border bg-card" data-testid="contact-success">
            <Send className="w-12 h-12 text-foreground mx-auto mb-6" />
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Message Sent</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Thank you for reaching out. We review every message and will respond as soon as possible.
            </p>
            <Button
              onClick={() => { setSubmitted(false); setName(""); setEmail(""); setMessage(""); setSubject("general"); }}
              variant="outline"
              className="rounded-none font-serif"
              data-testid="button-send-another"
            >
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8" data-testid="contact-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block font-serif font-semibold text-foreground mb-2 text-sm">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                  placeholder="Your name"
                  data-testid="input-name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block font-serif font-semibold text-foreground mb-2 text-sm">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                  placeholder="your@email.com"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block font-serif font-semibold text-foreground mb-2 text-sm">
                Subject
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                data-testid="select-subject"
              >
                <option value="general">General Inquiry</option>
                <option value="privacy">Privacy / Data Request</option>
                <option value="feedback">Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="press">Press & Partnerships</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block font-serif font-semibold text-foreground mb-2 text-sm">
                Message <span className="text-destructive">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm resize-none"
                placeholder="How can we help?"
                data-testid="input-message"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={sending}
                className="rounded-none font-serif bg-foreground text-background hover:bg-foreground/90 px-8 py-3"
                data-testid="button-submit"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Send Message</>
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-20 pt-10 border-t border-border flex justify-center">
          <Link href="/" className="inline-flex items-center px-6 py-3 bg-foreground text-background font-serif font-bold hover:bg-foreground/90 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
