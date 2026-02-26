import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ArrowRight } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const TOPICS = [
  { id: "politics", label: "Politics", icon: "🏛" },
  { id: "world", label: "World", icon: "🌍" },
  { id: "business", label: "Business", icon: "📈" },
  { id: "technology", label: "Technology", icon: "💻" },
  { id: "science", label: "Science", icon: "🔬" },
  { id: "health", label: "Health", icon: "🏥" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
];

const DIGEST_OPTIONS = [
  { id: "daily", label: "Daily Digest", description: "A morning email with the top neutralized stories" },
  { id: "weekly", label: "Weekly Roundup", description: "A Sunday summary of the week's biggest stories" },
  { id: "none", label: "No Digest", description: "I'll check the site on my own" },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [digestFrequency, setDigestFrequency] = useState("none");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((t) => t !== topicId) : [...prev, topicId]
    );
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          topicPreferences: selectedTopics,
          digestFrequency,
          onboardingCompleted: true,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "You're all set", description: "Your preferences have been saved." });
      setStep(1);
      setSelectedTopics([]);
      setDigestFrequency("none");
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to save preferences. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg border-border bg-background" data-testid="onboarding-modal">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-center tracking-tight">
            {step === 1 ? "What interests you?" : "Stay informed"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-center mt-1">
            {step === 1
              ? "Select the topics you care about most. You can change these anytime."
              : "Choose how you'd like to receive story updates."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={`flex items-center gap-3 p-3 border text-left transition-all ${
                      isSelected
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/30 hover:bg-muted/30"
                    }`}
                    data-testid={`topic-${topic.id}`}
                  >
                    <span className="text-lg">{topic.icon}</span>
                    <span className="text-sm font-medium text-foreground">{topic.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-foreground ml-auto" />}
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => setStep(2)}
              className="w-full rounded-none font-serif bg-foreground text-background hover:bg-foreground/90"
              data-testid="button-onboarding-next"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 space-y-6">
            <div className="space-y-3">
              {DIGEST_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDigestFrequency(option.id)}
                  className={`w-full flex flex-col p-4 border text-left transition-all ${
                    digestFrequency === option.id
                      ? "border-foreground bg-foreground/5"
                      : "border-border hover:border-foreground/30 hover:bg-muted/30"
                  }`}
                  data-testid={`digest-${option.id}`}
                >
                  <span className="text-sm font-semibold text-foreground">{option.label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{option.description}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 rounded-none font-serif"
                data-testid="button-onboarding-back"
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex-1 rounded-none font-serif bg-foreground text-background hover:bg-foreground/90"
                data-testid="button-onboarding-complete"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Reading"}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-2">
          <span className={`w-2 h-2 rounded-full ${step === 1 ? "bg-foreground" : "bg-border"}`} />
          <span className={`w-2 h-2 rounded-full ${step === 2 ? "bg-foreground" : "bg-border"}`} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
