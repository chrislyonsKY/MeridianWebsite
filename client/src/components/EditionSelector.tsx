import { useState, useEffect, useSyncExternalStore, useCallback } from "react";
import { ChevronDown, MapPin, Check, Globe, Navigation } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const EDITIONS = [
  { key: "us", label: "US", flag: "🇺🇸" },
  { key: "international", label: "International", flag: "🌍" },
  { key: "uk", label: "UK", flag: "🇬🇧" },
  { key: "canada", label: "Canada", flag: "🇨🇦" },
  { key: "europe", label: "Europe", flag: "🇪🇺" },
] as const;

export type Edition = typeof EDITIONS[number]["key"];

const editionListeners = new Set<() => void>();
let editionSnapshot = {
  edition: (() => {
    try {
      const stored = localStorage.getItem("meridian-edition");
      if (stored && EDITIONS.some(e => e.key === stored)) return stored as Edition;
    } catch {}
    return "us" as Edition;
  })(),
  location: (() => {
    try { return localStorage.getItem("meridian-location") || ""; } catch { return ""; }
  })(),
};

function notifyEditionListeners() {
  editionListeners.forEach(fn => fn());
}

function subscribeEdition(callback: () => void) {
  editionListeners.add(callback);
  return () => { editionListeners.delete(callback); };
}

function getEditionSnapshot() {
  return editionSnapshot;
}

export function useEdition() {
  const snapshot = useSyncExternalStore(subscribeEdition, getEditionSnapshot);

  const setEdition = useCallback((e: Edition) => {
    editionSnapshot = { ...editionSnapshot, edition: e };
    try { localStorage.setItem("meridian-edition", e); } catch {}
    notifyEditionListeners();
  }, []);

  const setLocation = useCallback((loc: string) => {
    editionSnapshot = { ...editionSnapshot, location: loc };
    try { localStorage.setItem("meridian-location", loc); } catch {}
    notifyEditionListeners();
  }, []);

  return { edition: snapshot.edition, setEdition, location: snapshot.location, setLocation };
}

interface EditionSelectorProps {
  edition: Edition;
  setEdition: (e: Edition) => void;
  location: string;
  setLocation: (loc: string) => void;
}

export function EditionSelector({ edition, setEdition, location, setLocation }: EditionSelectorProps) {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState(location);
  const [detecting, setDetecting] = useState(false);

  const currentEdition = EDITIONS.find(e => e.key === edition) || EDITIONS[0];

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&zoom=10`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "";
          const state = data.address?.state || "";
          const locationStr = [city, state].filter(Boolean).join(", ");
          setLocationInput(locationStr);
          setLocation(locationStr);
        } catch {
          setLocationInput("Location detected");
          setLocation("Location detected");
        }
        setDetecting(false);
      },
      () => {
        setDetecting(false);
      },
      { timeout: 10000 }
    );
  };

  const saveLocation = () => {
    setLocation(locationInput);
    setShowLocationModal(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="hidden sm:inline">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>

        <button
          onClick={() => setShowLocationModal(true)}
          className="hidden sm:flex items-center gap-1 hover:text-foreground transition-colors"
          data-testid="button-set-location"
        >
          <MapPin className="w-3 h-3" />
          {location || "Set Location"}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
              data-testid="button-edition-selector"
            >
              <span>{currentEdition.flag}</span>
              <span>{currentEdition.label} Edition</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {EDITIONS.map((ed) => (
              <DropdownMenuItem
                key={ed.key}
                onClick={() => setEdition(ed.key)}
                className="cursor-pointer flex items-center gap-2"
                data-testid={`menu-edition-${ed.key}`}
              >
                {edition === ed.key && <Check className="w-3 h-3" />}
                <span className={edition === ed.key ? "" : "ml-5"}>{ed.flag}</span>
                <span>{ed.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowLocationModal(true)}
              className="cursor-pointer flex items-center gap-2"
              data-testid="menu-set-location"
            >
              <MapPin className="w-3 h-3 ml-5" />
              <span>{location ? `Location: ${location}` : "Set Location"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Set Your Location</DialogTitle>
            <DialogDescription>
              Enter your city or region to see local news relevant to your area.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="location-input" className="block text-sm font-medium text-foreground mb-1.5">
                City, State or Region
              </label>
              <input
                id="location-input"
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="e.g. Louisville, Kentucky"
                className="w-full px-3 py-2 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                data-testid="input-location"
              />
            </div>
            <Button
              variant="outline"
              onClick={detectLocation}
              disabled={detecting}
              className="w-full rounded-none text-sm"
              data-testid="button-detect-location"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {detecting ? "Detecting..." : "Use Current Location"}
            </Button>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setLocationInput("");
                  setLocation("");
                  setShowLocationModal(false);
                }}
                className="rounded-none text-sm"
                data-testid="button-clear-location"
              >
                Clear
              </Button>
              <Button
                onClick={saveLocation}
                className="rounded-none text-sm bg-foreground text-background hover:bg-foreground/90"
                data-testid="button-save-location"
              >
                Save Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
