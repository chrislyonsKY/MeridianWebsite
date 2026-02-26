import { useTriggerPipeline } from "@/hooks/use-stories";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Activity, AlertTriangle, CheckCircle2, Mail, Eye, Clock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ContactSubmission } from "@shared/schema";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const triggerMutation = useTriggerPipeline();

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<ContactSubmission[]>({
    queryKey: ["/api/contact/submissions"],
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/contact/submissions/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact/submissions"] });
    },
  });

  if (authLoading) return null;
  
  if (!user) {
    return <Redirect to="/" />;
  }

  const unreadCount = submissions.filter((s) => !s.isRead).length;

  const subjectLabels: Record<string, string> = {
    general: "General Inquiry",
    privacy: "Privacy / Data Request",
    feedback: "Feedback",
    bug: "Bug Report",
    press: "Press & Partnerships",
  };

  return (
    <div className="min-h-screen bg-background pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-12">System controls and pipeline management.</p>

        <div className="bg-card border border-border p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-muted rounded-full">
              <Activity className="w-6 h-6 text-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-xl font-bold text-foreground mb-2">News Pipeline Trigger</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Manually trigger the ingestion, clustering, and AI neutralization pipeline. 
                This process consumes API credits and may take a few minutes to complete.
              </p>
              
              <Button 
                onClick={() => triggerMutation.mutate()} 
                disabled={triggerMutation.isPending}
                className="font-serif rounded-none px-6"
                data-testid="button-run-pipeline"
              >
                {triggerMutation.isPending ? "Pipeline Running..." : "Run Pipeline Now"}
              </Button>

              {triggerMutation.isSuccess && (
                <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Pipeline triggered successfully. Feed will update shortly.
                </div>
              )}

              {triggerMutation.isError && (
                <div className="mt-4 flex items-center text-sm text-destructive font-medium">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Failed to trigger pipeline. See console for details.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-muted rounded-full">
              <Mail className="w-6 h-6 text-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-xl font-bold text-foreground mb-1">
                Contact Submissions
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-sans" data-testid="text-unread-count">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">Messages from the contact form.</p>
            </div>
          </div>

          {submissionsLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No contact submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className={`border p-4 ${sub.isRead ? "border-border bg-background" : "border-foreground/20 bg-muted/50"}`}
                  data-testid={`contact-submission-${sub.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!sub.isRead && (
                          <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                        )}
                        <span className="font-serif font-semibold text-foreground truncate" data-testid={`text-contact-name-${sub.id}`}>
                          {sub.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({sub.email})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-muted px-2 py-0.5 text-muted-foreground font-medium">
                          {subjectLabels[sub.subject] || sub.subject}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sub.createdAt).toLocaleDateString()} {new Date(sub.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{sub.message}</p>
                    </div>
                    {!sub.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markReadMutation.mutate(sub.id)}
                        disabled={markReadMutation.isPending}
                        className="flex-shrink-0"
                        data-testid={`button-mark-read-${sub.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Mark read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
