import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { SiGoogle, SiFacebook, SiApple, SiGithub } from "react-icons/si";
import { queryClient } from "@/lib/queryClient";

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}

type AuthMode = "signin" | "signup" | "forgot";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
}

type OAuthProviderConfig = {
  id: string;
  label: string;
  icon: (props: { className?: string; style?: React.CSSProperties }) => JSX.Element | null;
  color: string;
  iconColor: string | undefined;
};

const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  { id: "google", label: "Google", icon: (p) => <SiGoogle {...p} />, color: "hover:bg-[#4285F4]/10 hover:border-[#4285F4]/30", iconColor: "#4285F4" },
  { id: "facebook", label: "Facebook", icon: (p) => <SiFacebook {...p} />, color: "hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30", iconColor: "#1877F2" },
  { id: "apple", label: "Apple", icon: (p) => <SiApple {...p} />, color: "hover:bg-foreground/5 hover:border-foreground/30", iconColor: undefined },
  { id: "github", label: "GitHub", icon: (p) => <SiGithub {...p} />, color: "hover:bg-[#333]/10 hover:border-[#333]/30", iconColor: undefined },
  { id: "microsoft", label: "Microsoft", icon: (p) => <MicrosoftIcon {...p} />, color: "hover:bg-[#00A4EF]/10 hover:border-[#00A4EF]/30", iconColor: undefined },
];

export function AuthModal({ isOpen, onClose, defaultMode = "signin" }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setForgotSent(false);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleClose = () => {
    resetForm();
    setMode(defaultMode);
    onClose();
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Sign in failed", description: data.message, variant: "destructive" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome back", description: `Signed in as ${data.email}` });
      handleClose();
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Sign up failed", description: data.message, variant: "destructive" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Account created", description: "Welcome to The Meridian!" });
      handleClose();
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      await res.json();
      setForgotSent(true);
      toast({ title: "Check your email", description: "If an account exists, we've sent a reset link." });
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const oauthButtons = (
    <div className="space-y-3">
      <div className="grid gap-2">
        {OAUTH_PROVIDERS.map(provider => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handleOAuth(provider.id)}
            className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-border bg-card text-foreground text-sm font-medium transition-colors ${provider.color}`}
            data-testid={`oauth-btn-${provider.id}`}
          >
            {provider.icon({ className: "w-4 h-4", style: provider.iconColor ? { color: provider.iconColor } : undefined })}
            Continue with {provider.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground tracking-widest">or</span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md border-border bg-background max-h-[90vh] overflow-y-auto" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-center tracking-tight">
            {mode === "signin" && "Sign In"}
            {mode === "signup" && "Create Account"}
            {mode === "forgot" && "Reset Password"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {mode === "signin" && "Sign in to personalize your experience."}
            {mode === "signup" && "Join The Meridian to customize your news digest."}
            {mode === "forgot" && "Enter your email to receive a password reset link."}
          </DialogDescription>
        </DialogHeader>

        {mode === "signin" && (
          <div className="space-y-4 mt-2">
            {oauthButtons}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                    placeholder="you@example.com"
                    required
                    data-testid="input-signin-email"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                    placeholder="Your password"
                    required
                    data-testid="input-signin-password"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-forgot-password"
                >
                  Forgot password?
                </button>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-none font-serif bg-foreground text-background hover:bg-foreground/90"
                data-testid="button-signin-submit"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In with Email"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-foreground font-medium hover:underline"
                  data-testid="link-switch-signup"
                >
                  Sign up
                </button>
              </p>
            </form>
          </div>
        )}

        {mode === "signup" && (
          <div className="space-y-4 mt-2">
            {oauthButtons}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="signup-first" className="block text-sm font-medium text-foreground mb-1.5">First name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="signup-first"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                      placeholder="First"
                      data-testid="input-signup-firstname"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="signup-last" className="block text-sm font-medium text-foreground mb-1.5">Last name</label>
                  <input
                    id="signup-last"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                    placeholder="Last"
                    data-testid="input-signup-lastname"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                    placeholder="you@example.com"
                    required
                    data-testid="input-signup-email"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    data-testid="input-signup-password"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="signup-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                    placeholder="Confirm password"
                    required
                    data-testid="input-signup-confirm"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-none font-serif bg-foreground text-background hover:bg-foreground/90"
                data-testid="button-signup-submit"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account with Email"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-foreground font-medium hover:underline"
                  data-testid="link-switch-signin"
                >
                  Sign in
                </button>
              </p>
            </form>
          </div>
        )}

        {mode === "forgot" && (
          <div className="mt-2">
            {forgotSent ? (
              <div className="text-center py-4 space-y-4">
                <Mail className="w-12 h-12 text-foreground mx-auto" />
                <p className="text-foreground font-serif text-lg">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  If an account with that email exists, we've sent password reset instructions.
                </p>
                <button
                  onClick={() => switchMode("signin")}
                  className="text-sm text-foreground font-medium hover:underline"
                  data-testid="link-back-signin"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                      placeholder="you@example.com"
                      required
                      data-testid="input-forgot-email"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-none font-serif bg-foreground text-background hover:bg-foreground/90"
                  data-testid="button-forgot-submit"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="text-foreground font-medium hover:underline"
                    data-testid="link-back-signin-2"
                  >
                    Back to sign in
                  </button>
                </p>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
