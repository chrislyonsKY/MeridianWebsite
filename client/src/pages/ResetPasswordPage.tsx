import { useState } from "react";
import { Link, useSearch } from "wouter";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure your passwords match.", variant: "destructive" });
      return;
    }

    if (password.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Reset failed", description: data.message, variant: "destructive" });
        return;
      }
      setSuccess(true);
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="font-serif text-3xl font-bold text-foreground">Invalid Link</h1>
          <p className="text-muted-foreground">This password reset link is invalid or has expired.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-foreground text-background font-serif font-bold hover:bg-foreground/90 transition-colors" data-testid="link-back-home">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6" data-testid="reset-success">
          <CheckCircle className="w-16 h-16 text-foreground mx-auto" />
          <h1 className="font-serif text-3xl font-bold text-foreground">Password Reset</h1>
          <p className="text-muted-foreground">Your password has been successfully updated. You can now sign in with your new password.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-foreground text-background font-serif font-bold hover:bg-foreground/90 transition-colors" data-testid="link-back-home">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <header className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground tracking-tight mb-2">
            Set New Password
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your new password below.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="reset-password-form">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-1.5">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                placeholder="Min. 8 characters"
                required
                minLength={8}
                data-testid="input-new-password"
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                placeholder="Confirm password"
                required
                data-testid="input-confirm-password"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-none font-serif bg-foreground text-background hover:bg-foreground/90"
            data-testid="button-reset-submit"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
