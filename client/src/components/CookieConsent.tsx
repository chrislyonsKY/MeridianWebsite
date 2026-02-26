import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Shield, Cookie, ChevronDown, ChevronUp } from "lucide-react";

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: true,
  analytics: false,
};

const STORAGE_KEY = "meridian_cookie_consent";
const PREFS_KEY = "meridian_cookie_preferences";

function getStoredConsent(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function getStoredPreferences(): CookiePreferences {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_PREFERENCES;
}

function saveConsent(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, "true");
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function useCookiePreferences() {
  const [preferences, setPreferences] = useState<CookiePreferences>(getStoredPreferences);
  const [showManage, setShowManage] = useState(false);

  const updatePreferences = (prefs: CookiePreferences) => {
    setPreferences(prefs);
    saveConsent(prefs);
  };

  return { preferences, updatePreferences, showManage, setShowManage };
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showManage, setShowManage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!getStoredConsent()) {
        setVisible(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleAcceptAll = () => {
    saveConsent({ essential: true, functional: true, analytics: true });
    setVisible(false);
  };

  const handleRejectNonEssential = () => {
    saveConsent({ essential: true, functional: false, analytics: false });
    setVisible(false);
  };

  const handleSaveCustom = (prefs: CookiePreferences) => {
    saveConsent(prefs);
    setShowManage(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-[100] bg-card border-t border-border shadow-lg"
        data-testid="cookie-banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground font-medium mb-1">
                  We value your privacy
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use cookies to enhance your browsing experience, remember your preferences, and understand how you use our site.
                  You can customize your choices below.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="rounded-none text-xs flex-1 md:flex-none"
                onClick={() => setShowManage(true)}
                data-testid="button-manage-cookies"
              >
                Manage
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none text-xs flex-1 md:flex-none"
                onClick={handleRejectNonEssential}
                data-testid="button-reject-cookies"
              >
                Essential Only
              </Button>
              <Button
                size="sm"
                className="rounded-none text-xs flex-1 md:flex-none"
                onClick={handleAcceptAll}
                data-testid="button-accept-cookies"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CookiePreferencesModal
        isOpen={showManage}
        onClose={() => setShowManage(false)}
        onSave={handleSaveCustom}
      />
    </>
  );
}

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prefs: CookiePreferences) => void;
}

export function CookiePreferencesModal({ isOpen, onClose, onSave }: CookiePreferencesModalProps) {
  const [prefs, setPrefs] = useState<CookiePreferences>(getStoredPreferences);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPrefs(getStoredPreferences());
    }
  }, [isOpen]);

  const toggleExpanded = (cat: string) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  const categories = [
    {
      id: "essential" as const,
      label: "Essential Cookies",
      description: "Required for the website to function properly. These cannot be disabled.",
      details: [
        "Session management — keeps you logged in",
        "Security tokens — protects against cross-site request forgery",
        "Cookie consent — remembers your privacy choices",
      ],
      locked: true,
    },
    {
      id: "functional" as const,
      label: "Functional Cookies",
      description: "Enable personalized features like saved preferences, edition selection, and theme settings.",
      details: [
        "Theme preference — light or dark mode",
        "Edition selection — your chosen news region",
        "Font size — your text size preference",
        "Location setting — your local news area",
      ],
      locked: false,
    },
    {
      id: "analytics" as const,
      label: "Analytics Cookies",
      description: "Help us understand how visitors use our site so we can improve the experience.",
      details: [
        "Page views — which pages are most popular",
        "Session duration — how long visitors stay",
        "Feature usage — which features are used most",
        "Performance metrics — page load times",
      ],
      locked: false,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" data-testid="cookie-preferences-modal">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy Preferences
          </DialogTitle>
          <DialogDescription>
            Control how cookies are used on The Meridian. Essential cookies are always active.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {categories.map((cat) => {
            const isExpanded = expandedCategory === cat.id;
            return (
              <div
                key={cat.id}
                className="border border-border p-4"
                data-testid={`cookie-category-${cat.id}`}
              >
                <div className="flex items-center justify-between">
                  <button
                    className="flex items-center gap-2 text-left flex-1"
                    onClick={() => toggleExpanded(cat.id)}
                    data-testid={`button-expand-${cat.id}`}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                    </div>
                  </button>
                  <div className="flex-shrink-0 ml-3">
                    {cat.locked ? (
                      <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-muted">
                        Always On
                      </span>
                    ) : (
                      <Switch
                        checked={prefs[cat.id]}
                        onCheckedChange={(checked) =>
                          setPrefs((p) => ({ ...p, [cat.id]: checked }))
                        }
                        data-testid={`switch-${cat.id}`}
                      />
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <ul className="mt-3 ml-6 space-y-1.5 border-t border-border/50 pt-3">
                    {cat.details.map((detail, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-foreground/40 mt-0.5">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1 rounded-none text-sm"
            onClick={onClose}
            data-testid="button-cancel-preferences"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-none text-sm"
            onClick={() => onSave(prefs)}
            data-testid="button-save-preferences"
          >
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
