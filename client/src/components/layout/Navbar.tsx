import { Link, useLocation } from "wouter";
import { Compass, Menu, X, User as UserIcon, LogOut, Settings, Sun, Moon, Type, Heart } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthModal } from "@/components/AuthModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { EditionSelector, useEdition } from "@/components/EditionSelector";

export function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, fontSize, setFontSize } = useTheme();
  const editionState = useEdition();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const prevAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && !prevAuthRef.current && user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, user]);

  const fontSizes = [
    { key: "small" as const, label: "A", ariaLabel: "Small text", size: "0.7rem" },
    { key: "medium" as const, label: "A", ariaLabel: "Medium text", size: "0.85rem" },
    { key: "large" as const, label: "A", ariaLabel: "Large text", size: "1rem" },
    { key: "xl" as const, label: "A", ariaLabel: "Extra large text", size: "1.15rem" },
  ];

  const navLinks = [
    { label: "The Feed", href: "/feed" },
    { label: "Conflict Map", href: "/conflicts" },
    { label: "Methodology", href: "/methodology" },
  ];

  const openSignIn = () => {
    setAuthMode("signin");
    setShowAuthModal(true);
  };

  const openSignUp = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2 group">
                <Compass className="h-6 w-6 text-foreground group-hover:rotate-45 transition-transform duration-500" />
                <span className="font-serif font-bold text-xl tracking-tight text-foreground">
                  The Meridian
                </span>
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    location.startsWith(link.href)
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center border border-border rounded-md overflow-hidden" role="group" aria-label="Font size" data-testid="font-size-controls">
                {fontSizes.map((fs, i) => (
                  <button
                    key={fs.key}
                    onClick={() => setFontSize(fs.key)}
                    aria-label={fs.ariaLabel}
                    aria-pressed={fontSize === fs.key}
                    data-testid={`button-font-${fs.key}`}
                    className={`px-2 py-1 transition-colors ${
                      fontSize === fs.key
                        ? "bg-foreground text-background"
                        : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                    } ${i > 0 ? "border-l border-border" : ""}`}
                    style={{ fontSize: fs.size }}
                  >
                    {fs.label}
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                      {user?.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt="Profile"
                          className="h-8 w-8 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                          <UserIcon className="h-4 w-4 text-foreground" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.firstName || user?.email || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setShowOnboarding(true)} data-testid="menu-preferences">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Preferences</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = '/admin'} data-testid="menu-admin">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Pipeline</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => logout()} data-testid="menu-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="default"
                  className="font-serif tracking-wide rounded-none px-6"
                  onClick={openSignIn}
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
              )}
            </div>

            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-muted focus:outline-none transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex justify-end">
            <EditionSelector {...editionState} />
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    location.startsWith(link.href)
                      ? "bg-muted border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-3 pl-3 pr-4 py-2 border-l-4 border-transparent">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-medium text-muted-foreground">Text Size</span>
                <div className="flex items-center border border-border rounded-md overflow-hidden ml-auto" role="group" aria-label="Font size">
                  {fontSizes.map((fs, i) => (
                    <button
                      key={fs.key}
                      onClick={() => setFontSize(fs.key)}
                      aria-label={fs.ariaLabel}
                      aria-pressed={fontSize === fs.key}
                      data-testid={`button-font-${fs.key}-mobile`}
                      className={`px-2 py-1 transition-colors ${
                        fontSize === fs.key
                          ? "bg-foreground text-background"
                          : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                      } ${i > 0 ? "border-l border-border" : ""}`}
                      style={{ fontSize: fs.size }}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                data-testid="button-theme-toggle-mobile"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => {
                      setShowOnboarding(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    data-testid="mobile-preferences"
                  >
                    <Heart className="h-4 w-4" />
                    Preferences
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-destructive hover:bg-muted/50"
                    data-testid="mobile-logout"
                  >
                    Sign Out
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <button
                  onClick={() => {
                    openSignIn();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-foreground hover:bg-muted/50"
                  data-testid="mobile-signin"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </>
  );
}
