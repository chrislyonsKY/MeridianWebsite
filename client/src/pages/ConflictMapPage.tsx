import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStories } from "@/hooks/use-stories";
import type { StoryResponse } from "@shared/routes";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ChevronRight, X, AlertTriangle, ArrowUpDown, Filter, MapPin, Layers } from "lucide-react";

type BasemapStyle = "dark-gray" | "imagery" | "topographic" | "streets" | "navigation" | "oceans";

const ESRI_BASEMAPS: Array<{
  id: BasemapStyle;
  label: string;
  baseUrl: string;
  refUrl?: string;
  bg: string;
}> = [
  {
    id: "dark-gray",
    label: "Dark Gray",
    baseUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    refUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    bg: "#1c1a16",
  },
  {
    id: "imagery",
    label: "Satellite",
    baseUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    refUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    bg: "#0a1628",
  },
  {
    id: "topographic",
    label: "Topographic",
    baseUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    bg: "#d9d4c6",
  },
  {
    id: "streets",
    label: "Streets",
    baseUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    bg: "#e8e0d8",
  },
  {
    id: "navigation",
    label: "Navigation",
    baseUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    refUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    bg: "#e4e1d9",
  },
  {
    id: "oceans",
    label: "Oceans",
    baseUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
    refUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}",
    bg: "#1a3a5c",
  },
];

interface ConflictNode {
  story: StoryResponse;
  severity: "critical" | "high" | "moderate" | "low";
  sourceCount: number;
  uniqueSourceCount: number;
  biasSpread: number;
  consensusScore: number | null;
  lat: number;
  lng: number;
}

const LOCATION_DB: Array<{ patterns: string[]; lat: number; lng: number }> = [
  { patterns: ["ukraine", "ukrainian", "kyiv", "kiev"], lat: 50.45, lng: 30.52 },
  { patterns: ["crimea", "crimean"], lat: 44.95, lng: 34.1 },
  { patterns: ["donbas", "donetsk", "luhansk"], lat: 48.0, lng: 37.8 },
  { patterns: ["russia", "russian", "moscow", "kremlin"], lat: 55.75, lng: 37.62 },
  { patterns: ["gaza", "gazan", "palestinian"], lat: 31.35, lng: 34.31 },
  { patterns: ["israel", "israeli", "jerusalem", "tel aviv"], lat: 31.77, lng: 35.22 },
  { patterns: ["west bank", "ramallah"], lat: 31.9, lng: 35.2 },
  { patterns: ["lebanon", "lebanese", "beirut", "hezbollah"], lat: 33.89, lng: 35.5 },
  { patterns: ["iran", "iranian", "tehran"], lat: 35.69, lng: 51.39 },
  { patterns: ["iraq", "iraqi", "baghdad"], lat: 33.31, lng: 44.37 },
  { patterns: ["syria", "syrian", "damascus", "aleppo"], lat: 33.51, lng: 36.29 },
  { patterns: ["yemen", "yemeni", "sanaa", "houthi"], lat: 15.37, lng: 44.19 },
  { patterns: ["sudan", "sudanese", "khartoum"], lat: 15.59, lng: 32.53 },
  { patterns: ["south sudan", "juba"], lat: 4.85, lng: 31.6 },
  { patterns: ["somalia", "somali", "mogadishu"], lat: 2.05, lng: 45.32 },
  { patterns: ["libya", "libyan", "tripoli"], lat: 32.89, lng: 13.18 },
  { patterns: ["afghanistan", "afghan", "kabul", "taliban"], lat: 34.53, lng: 69.17 },
  { patterns: ["myanmar", "burmese", "burma", "naypyidaw", "yangon"], lat: 19.76, lng: 96.07 },
  { patterns: ["north korea", "pyongyang"], lat: 39.02, lng: 125.75 },
  { patterns: ["south korea", "south korean", "seoul"], lat: 37.57, lng: 126.98 },
  { patterns: ["taiwan", "taiwanese", "taipei"], lat: 25.03, lng: 121.57 },
  { patterns: ["china", "chinese", "beijing", "xi jinping"], lat: 39.9, lng: 116.4 },
  { patterns: ["hong kong"], lat: 22.32, lng: 114.17 },
  { patterns: ["japan", "japanese", "tokyo"], lat: 35.68, lng: 139.69 },
  { patterns: ["india", "indian", "new delhi", "modi", "mumbai"], lat: 28.61, lng: 77.21 },
  { patterns: ["pakistan", "pakistani", "islamabad", "karachi"], lat: 33.69, lng: 73.04 },
  { patterns: ["bangladesh", "bangladeshi", "dhaka"], lat: 23.81, lng: 90.41 },
  { patterns: ["sri lanka", "colombo"], lat: 6.93, lng: 79.84 },
  { patterns: ["nepal", "kathmandu"], lat: 27.72, lng: 85.32 },
  { patterns: ["venezuela", "venezuelan", "caracas", "maduro"], lat: 10.49, lng: -66.88 },
  { patterns: ["cuba", "cuban", "havana"], lat: 23.11, lng: -82.37 },
  { patterns: ["mexico", "mexican", "mexico city", "cartel", "jalisco", "el mencho"], lat: 19.43, lng: -99.13 },
  { patterns: ["colombia", "colombian", "bogota"], lat: 4.71, lng: -74.07 },
  { patterns: ["brazil", "brazilian", "brasilia", "sao paulo", "rio de janeiro"], lat: -15.79, lng: -47.88 },
  { patterns: ["argentina", "argentine", "argentinian", "buenos aires"], lat: -34.6, lng: -58.38 },
  { patterns: ["peru", "peruvian", "lima"], lat: -12.05, lng: -77.04 },
  { patterns: ["chile", "chilean", "santiago"], lat: -33.45, lng: -70.67 },
  { patterns: ["ecuador", "ecuadorian", "quito"], lat: -0.18, lng: -78.47 },
  { patterns: ["bolivia", "bolivian", "la paz"], lat: -16.5, lng: -68.15 },
  { patterns: ["guatemala", "guatemalan"], lat: 14.63, lng: -90.51 },
  { patterns: ["honduras", "honduran", "tegucigalpa"], lat: 14.07, lng: -87.19 },
  { patterns: ["el salvador", "salvadoran", "bukele"], lat: 13.69, lng: -89.19 },
  { patterns: ["nicaragua", "nicaraguan", "managua"], lat: 12.13, lng: -86.25 },
  { patterns: ["panama", "panamanian"], lat: 9.0, lng: -79.52 },
  { patterns: ["nigeria", "nigerian", "lagos", "abuja"], lat: 9.06, lng: 7.49 },
  { patterns: ["kenya", "kenyan", "nairobi", "mombasa", "moyale"], lat: -1.29, lng: 36.82 },
  { patterns: ["ethiopia", "ethiopian", "addis ababa", "tigray"], lat: 9.02, lng: 38.75 },
  { patterns: ["congo", "congolese", "kinshasa"], lat: -4.32, lng: 15.31 },
  { patterns: ["south africa", "johannesburg", "cape town", "pretoria"], lat: -25.75, lng: 28.19 },
  { patterns: ["egypt", "egyptian", "cairo"], lat: 30.04, lng: 31.24 },
  { patterns: ["morocco", "moroccan", "rabat", "casablanca"], lat: 33.97, lng: -6.85 },
  { patterns: ["tunisia", "tunisian", "tunis"], lat: 36.81, lng: 10.17 },
  { patterns: ["algeria", "algerian", "algiers"], lat: 36.75, lng: 3.04 },
  { patterns: ["ghana", "ghanaian", "accra"], lat: 5.55, lng: -0.2 },
  { patterns: ["senegal", "senegalese", "dakar"], lat: 14.69, lng: -17.44 },
  { patterns: ["cameroon", "cameroonian", "yaounde"], lat: 3.87, lng: 11.52 },
  { patterns: ["tanzania", "tanzanian", "dar es salaam"], lat: -6.79, lng: 39.28 },
  { patterns: ["uganda", "ugandan", "kampala"], lat: 0.35, lng: 32.58 },
  { patterns: ["rwanda", "rwandan", "kigali"], lat: -1.95, lng: 30.06 },
  { patterns: ["zimbabwe", "zimbabwean", "harare"], lat: -17.83, lng: 31.05 },
  { patterns: ["angola", "angolan", "luanda"], lat: -8.84, lng: 13.23 },
  { patterns: ["burkina faso", "ouagadougou"], lat: 12.37, lng: -1.52 },
  { patterns: ["saudi arabia", "saudi", "riyadh"], lat: 24.71, lng: 46.68 },
  { patterns: ["united arab emirates", "uae", "dubai", "abu dhabi"], lat: 24.45, lng: 54.65 },
  { patterns: ["qatar", "qatari", "doha"], lat: 25.29, lng: 51.53 },
  { patterns: ["kuwait", "kuwaiti"], lat: 29.38, lng: 47.99 },
  { patterns: ["bahrain", "bahraini", "manama"], lat: 26.23, lng: 50.59 },
  { patterns: ["oman", "omani", "muscat"], lat: 23.61, lng: 58.54 },
  { patterns: ["jordan", "jordanian", "amman"], lat: 31.95, lng: 35.93 },
  { patterns: ["turkey", "turkish", "ankara", "istanbul", "erdogan"], lat: 39.93, lng: 32.86 },
  { patterns: ["nato"], lat: 50.88, lng: 4.38 },
  { patterns: ["european union"], lat: 50.85, lng: 4.35 },
  { patterns: ["united nations"], lat: 40.75, lng: -73.97 },
  { patterns: ["washington d.c.", "white house", "pentagon"], lat: 38.87, lng: -77.06 },
  { patterns: ["new york city", "new york"], lat: 40.71, lng: -74.01 },
  { patterns: ["london"], lat: 51.51, lng: -0.13 },
  { patterns: ["paris", "france", "french", "macron"], lat: 48.86, lng: 2.35 },
  { patterns: ["berlin", "germany", "german"], lat: 52.52, lng: 13.41 },
  { patterns: ["poland", "polish", "warsaw"], lat: 52.23, lng: 21.01 },
  { patterns: ["romania", "romanian", "bucharest"], lat: 44.43, lng: 26.1 },
  { patterns: ["hungary", "hungarian", "budapest", "orban"], lat: 47.5, lng: 19.04 },
  { patterns: ["finland", "finnish", "helsinki"], lat: 60.17, lng: 24.94 },
  { patterns: ["sweden", "swedish", "stockholm"], lat: 59.33, lng: 18.07 },
  { patterns: ["norway", "norwegian", "oslo"], lat: 59.91, lng: 10.75 },
  { patterns: ["spain", "spanish", "madrid", "barcelona"], lat: 40.42, lng: -3.7 },
  { patterns: ["italy", "italian", "rome", "milan"], lat: 41.9, lng: 12.5 },
  { patterns: ["netherlands", "dutch", "amsterdam", "the hague"], lat: 52.37, lng: 4.9 },
  { patterns: ["belgium", "belgian", "brussels"], lat: 50.85, lng: 4.35 },
  { patterns: ["greece", "greek", "athens"], lat: 37.98, lng: 23.73 },
  { patterns: ["portugal", "portuguese", "lisbon"], lat: 38.72, lng: -9.14 },
  { patterns: ["czech republic", "czech", "prague"], lat: 50.08, lng: 14.42 },
  { patterns: ["slovakia", "slovak", "bratislava"], lat: 48.15, lng: 17.11 },
  { patterns: ["austria", "austrian", "vienna"], lat: 48.21, lng: 16.37 },
  { patterns: ["switzerland", "swiss", "zurich", "geneva", "bern"], lat: 46.95, lng: 7.45 },
  { patterns: ["denmark", "danish", "copenhagen"], lat: 55.68, lng: 12.57 },
  { patterns: ["ireland", "irish", "dublin"], lat: 53.35, lng: -6.26 },
  { patterns: ["australia", "australian", "canberra", "sydney", "melbourne"], lat: -33.87, lng: 151.21 },
  { patterns: ["new zealand", "wellington", "auckland"], lat: -41.29, lng: 174.78 },
  { patterns: ["philippines", "filipino", "manila", "duterte", "marcos"], lat: 14.6, lng: 120.98 },
  { patterns: ["indonesia", "indonesian", "jakarta"], lat: -6.21, lng: 106.85 },
  { patterns: ["thailand", "thai", "bangkok"], lat: 13.76, lng: 100.5 },
  { patterns: ["vietnam", "vietnamese", "hanoi"], lat: 21.03, lng: 105.85 },
  { patterns: ["malaysia", "malaysian", "kuala lumpur"], lat: 3.14, lng: 101.69 },
  { patterns: ["singapore", "singaporean"], lat: 1.35, lng: 103.82 },
  { patterns: ["cambodia", "cambodian", "phnom penh"], lat: 11.56, lng: 104.92 },
  { patterns: ["mali", "malian", "bamako"], lat: 12.64, lng: -8.0 },
  { patterns: ["niger", "nigerien", "niamey"], lat: 13.51, lng: 2.11 },
  { patterns: ["haiti", "haitian", "port-au-prince"], lat: 18.54, lng: -72.34 },
  { patterns: ["mozambique", "mozambican", "maputo"], lat: -25.97, lng: 32.57 },
  { patterns: ["chad", "chadian", "n'djamena"], lat: 12.13, lng: 15.05 },
  { patterns: ["red sea"], lat: 20.0, lng: 38.5 },
  { patterns: ["south china sea"], lat: 15.0, lng: 115.0 },
  { patterns: ["black sea"], lat: 43.0, lng: 35.0 },
  { patterns: ["arctic"], lat: 75.0, lng: 0.0 },
  { patterns: ["sahel"], lat: 14.0, lng: 2.0 },
  { patterns: ["strait of hormuz", "persian gulf"], lat: 26.6, lng: 56.3 },
  { patterns: ["kashmir", "kashmiri"], lat: 34.08, lng: 74.8 },
  { patterns: ["balkans", "serbia", "serbian", "belgrade", "kosovo"], lat: 44.79, lng: 20.46 },
  { patterns: ["georgia", "georgian", "tbilisi"], lat: 41.72, lng: 44.79 },
  { patterns: ["armenia", "armenian", "yerevan"], lat: 40.18, lng: 44.51 },
  { patterns: ["azerbaijan", "azerbaijani", "baku"], lat: 40.41, lng: 49.87 },
  { patterns: ["moldova", "moldovan", "chisinau"], lat: 47.01, lng: 28.86 },
  { patterns: ["belarus", "belarusian", "minsk", "lukashenko"], lat: 53.9, lng: 27.57 },
  { patterns: ["uzbekistan", "tashkent"], lat: 41.3, lng: 69.28 },
  { patterns: ["kazakhstan", "astana", "almaty"], lat: 51.17, lng: 71.43 },
  { patterns: ["canada", "canadian", "ottawa", "toronto"], lat: 45.42, lng: -75.7 },
];

const REGION_FALLBACK: Record<string, { lat: number; lng: number }> = {
  "us": { lat: 38.9, lng: -97.0 },
  "uk": { lat: 54.0, lng: -2.0 },
  "canada": { lat: 56.0, lng: -96.0 },
  "europe": { lat: 50.0, lng: 10.0 },
  "international": { lat: 20.0, lng: 30.0 },
};

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const LOCATION_REGEXES = LOCATION_DB.map((loc) => ({
  regex: new RegExp(loc.patterns.map(p => `\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).join("|"), "i"),
  lat: loc.lat,
  lng: loc.lng,
}));

function storyToCoords(story: StoryResponse): { lat: number; lng: number } {
  const headline = story.headline || "";
  const summary = story.summary || "";

  let bestMatch: { lat: number; lng: number } | null = null;
  let bestScore = -1;

  for (const loc of LOCATION_REGEXES) {
    const globalRegex = new RegExp(loc.regex.source, "gi");
    const headlineMatches = (headline.match(globalRegex) || []).length;
    const summaryMatches = (summary.match(globalRegex) || []).length;
    if (headlineMatches === 0 && summaryMatches === 0) continue;

    const score = headlineMatches * 10 + summaryMatches;
    let posBonus = 0;
    if (headlineMatches > 0) {
      const firstPos = headline.search(new RegExp(loc.regex.source, "i"));
      posBonus = firstPos >= 0 ? (1 - firstPos / headline.length) * 5 : 0;
    }
    const totalScore = score + posBonus;
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMatch = { lat: loc.lat, lng: loc.lng };
    }
  }

  if (bestMatch) {
    const seed = story.id || 0;
    const jitterLat = (seededRandom(seed * 13) - 0.5) * 2;
    const jitterLng = (seededRandom(seed * 17) - 0.5) * 2;
    return {
      lat: Math.max(-85, Math.min(85, bestMatch.lat + jitterLat)),
      lng: bestMatch.lng + jitterLng,
    };
  }

  const region = (story as any).region || "international";
  const fallback = REGION_FALLBACK[region] || REGION_FALLBACK["international"];
  const seed = story.id || 0;
  const jitterLat = (seededRandom(seed * 13) - 0.5) * 6;
  const jitterLng = (seededRandom(seed * 17) - 0.5) * 6;
  return {
    lat: Math.max(-85, Math.min(85, fallback.lat + jitterLat)),
    lng: fallback.lng + jitterLng,
  };
}

function getConsensusScore(story: StoryResponse): number | null {
  const score = (story as any).consensusScore;
  if (typeof score === "number" && !isNaN(score)) return score;
  return null;
}

function getUniqueSources(story: StoryResponse) {
  return Array.from(
    new Map(
      story.storyArticles?.map((sa) => [sa.article.source.id, sa.article.source]) || []
    ).values()
  );
}

const CONFLICT_KEYWORDS_STRONG = [
  "war", "military", "troops", "soldiers", "airstrike",
  "invasion", "invade", "occupation",
  "missile", "bomb", "bombing", "drone strike", "nuclear",
  "ceasefire", "peace talks",
  "sanctions", "embargo", "blockade",
  "regime", "coup", "overthrow", "junta",
  "insurgent", "militia", "cartel",
  "terrorism", "terrorist",
  "nato", "security council",
  "refugee", "humanitarian crisis",
  "geopolitical", "escalation",
  "trade war",
  "uprising", "unrest", "crackdown",
];

const CONFLICT_REGIONS = [
  "russia", "ukraine", "gaza", "israel", "hamas", "hezbollah", "iran",
  "taiwan", "north korea", "syria", "yemen", "sudan", "myanmar",
  "afghanistan", "iraq", "libya", "somalia", "venezuela",
];

function isGlobalConflictStory(story: StoryResponse): boolean {
  const uniqueSources = getUniqueSources(story);
  if (uniqueSources.length < 2) return false;
  if (!["world", "politics"].includes(story.topic)) return false;
  const headline = story.headline.toLowerCase();
  const text = `${headline} ${(story.summary || "").toLowerCase()}`;
  const hasStrongKeyword = CONFLICT_KEYWORDS_STRONG.some(kw => text.includes(kw));
  const hasConflictRegion = CONFLICT_REGIONS.some(r => text.includes(r));
  if (hasStrongKeyword && hasConflictRegion) return true;
  if (CONFLICT_KEYWORDS_STRONG.filter(kw => text.includes(kw)).length >= 2) return true;
  return false;
}

const STOP_WORDS = new Set(["the","and","for","that","with","from","this","after","says","have","been","will","more","than","into","over","about","also","could","would","their","which","when","what","were","there","being","other","some","them","does","most","only","says","said","upon","under"]);

function deduplicateConflicts(nodes: ConflictNode[]): ConflictNode[] {
  const getSignificantWords = (headline: string) =>
    headline.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
  const results: ConflictNode[] = [];
  for (const node of nodes) {
    const words = getSignificantWords(node.story.headline);
    const wordSet = new Set(words);
    let duplicateIndex = -1;
    for (let i = 0; i < results.length; i++) {
      const existingWords = getSignificantWords(results[i].story.headline);
      const overlap = existingWords.filter(w => wordSet.has(w)).length;
      const minLen = Math.min(words.length, existingWords.length);
      if (minLen > 0 && overlap / minLen >= 0.5 && overlap >= 3) {
        duplicateIndex = i;
        break;
      }
    }
    if (duplicateIndex >= 0) {
      if (node.uniqueSourceCount > results[duplicateIndex].uniqueSourceCount) {
        results[duplicateIndex] = node;
      }
    } else {
      results.push(node);
    }
  }
  return results;
}

function getSeverity(consensusScore: number | null, biasSpread: number, uniqueSourceCount: number): ConflictNode["severity"] {
  let score = 0;
  if (consensusScore !== null) {
    if (consensusScore < 40) score += 3;
    else if (consensusScore < 60) score += 2;
    else if (consensusScore < 80) score += 1;
  } else {
    score += 2;
  }
  if (biasSpread >= 75) score += 3;
  else if (biasSpread >= 50) score += 2;
  else if (biasSpread >= 25) score += 1;
  if (uniqueSourceCount >= 4) score += 1;
  if (score >= 5) return "critical";
  if (score >= 3) return "high";
  if (score >= 2) return "moderate";
  return "low";
}

function getSeverityColor(level: ConflictNode["severity"]) {
  switch (level) {
    case "critical": return { hex: "#dc2626", dot: "bg-red-600", text: "text-red-700 dark:text-red-400", label: "Critical", ring: "#fca5a5" };
    case "high": return { hex: "#ea580c", dot: "bg-orange-600", text: "text-orange-700 dark:text-orange-400", label: "High", ring: "#fdba74" };
    case "moderate": return { hex: "#ca8a04", dot: "bg-amber-600", text: "text-amber-700 dark:text-amber-400", label: "Moderate", ring: "#fcd34d" };
    case "low": return { hex: "#7c3aed", dot: "bg-violet-600", text: "text-violet-700 dark:text-violet-400", label: "Low", ring: "#c4b5fd" };
  }
}

function getBiasSpread(story: StoryResponse): number {
  const biasValues: Record<string, number> = {
    "left": 0, "center-left": 25, "center": 50, "center-right": 75, "right": 100
  };
  const uniqueSources = getUniqueSources(story);
  const ratings = uniqueSources.map(s => biasValues[s.biasRating] ?? 50);
  if (ratings.length < 2) return 0;
  return Math.max(...ratings) - Math.min(...ratings);
}

function ScaleMarkers({ nodes, selectedId, onSelect }: { nodes: ConflictNode[]; selectedId: number | null; onSelect: (node: ConflictNode | null) => void }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  const baseRadius = useMemo(() => {
    if (zoom <= 2) return 6;
    if (zoom <= 4) return 8;
    if (zoom <= 6) return 12;
    return 16;
  }, [zoom]);

  return (
    <>
      {nodes.map((node) => {
        const sev = getSeverityColor(node.severity);
        const isSelected = selectedId === node.story.id;
        const sizeMultiplier = node.severity === "critical" ? 1.5 : node.severity === "high" ? 1.25 : node.severity === "moderate" ? 1.1 : 1;
        const radius = baseRadius * sizeMultiplier * (isSelected ? 1.4 : 1);

        return (
          <CircleMarker
            key={node.story.id}
            center={[node.lat, node.lng]}
            radius={radius}
            pathOptions={{
              fillColor: sev.hex,
              fillOpacity: isSelected ? 0.95 : 0.8,
              color: isSelected ? "#ffffff" : sev.ring,
              weight: isSelected ? 2.5 : 1.5,
              opacity: isSelected ? 1 : 0.7,
            }}
            eventHandlers={{
              click: () => onSelect(isSelected ? null : node),
            }}
          >
            <Popup closeButton={false} className="conflict-popup" autoPan={false}>
              <div className="font-sans text-xs max-w-[200px]" role="tooltip">
                <p className="font-semibold text-foreground leading-tight mb-1">{node.story.headline.substring(0, 80)}{node.story.headline.length > 80 ? "..." : ""}</p>
                <div className="flex items-center gap-2 text-[11px] text-foreground/60">
                  <span className="capitalize">{node.story.topic}</span>
                  <span>{node.uniqueSourceCount} sources</span>
                  {node.consensusScore !== null && <span>Consensus: {node.consensusScore}</span>}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function FlyToSelected({ selectedNode }: { selectedNode: ConflictNode | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedNode) {
      map.flyTo([selectedNode.lat, selectedNode.lng], Math.max(map.getZoom(), 4), { duration: 0.8 });
    }
  }, [selectedNode, map]);
  return null;
}

function DetailPanel({ node, onClose }: { node: ConflictNode; onClose: () => void }) {
  const sev = getSeverityColor(node.severity);
  const narrativeLens = (node.story as any).narrativeLens as Array<{ sourceName: string; biasRating: string; framing: string; tone: string }> | null;
  const coverageGaps = (node.story as any).coverageGaps as Array<{ fact: string; coveredBy: string[]; missedBy: string[]; significance: string }> | null;
  const uniqueSources = getUniqueSources(node.story);

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-180px)]" data-testid="conflict-detail-panel" role="region" aria-label="Conflict details">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${sev.dot}`} aria-hidden="true" />
            <span className={`text-xs font-semibold uppercase tracking-wider ${sev.text}`}>{sev.label} Divergence</span>
          </div>
          <button onClick={onClose} aria-label="Close detail panel" className="min-h-[36px] min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" data-testid="button-close-detail">
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 className="font-serif text-lg font-semibold text-foreground leading-tight mb-4" data-testid="text-detail-headline">
          {node.story.headline}
        </h2>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center p-2 rounded-sm bg-muted/40" data-testid="stat-consensus">
            <div className={`text-xl font-serif font-bold ${sev.text}`}>{node.consensusScore ?? "—"}</div>
            <div className="text-[11px] uppercase tracking-wider text-foreground/60 dark:text-foreground/50 font-medium">Consensus</div>
          </div>
          <div className="text-center p-2 rounded-sm bg-muted/40" data-testid="stat-sources">
            <div className="text-xl font-serif font-bold text-foreground">{node.uniqueSourceCount}</div>
            <div className="text-[11px] uppercase tracking-wider text-foreground/60 dark:text-foreground/50 font-medium">Sources</div>
          </div>
          <div className="text-center p-2 rounded-sm bg-muted/40" data-testid="stat-bias-range">
            <div className="text-xl font-serif font-bold text-foreground">{node.biasSpread}</div>
            <div className="text-[11px] uppercase tracking-wider text-foreground/60 dark:text-foreground/50 font-medium">Bias Range</div>
          </div>
        </div>

        {node.story.summary && (
          <div className="mb-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70 dark:text-foreground/60 mb-2">Summary</h3>
            <p className="text-sm text-foreground leading-relaxed" data-testid="text-summary">{node.story.summary}</p>
          </div>
        )}

        {node.story.divergenceSummary && (
          <div className="mb-5 border-l-2 border-amber-600 dark:border-amber-400 pl-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              Narrative Divergence
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed" data-testid="text-divergence">{node.story.divergenceSummary}</p>
          </div>
        )}

        {uniqueSources.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70 dark:text-foreground/60 mb-2">Sources</h3>
            <div className="flex flex-wrap gap-1.5" data-testid="source-matrix">
              {uniqueSources.map((source) => {
                const biasStyle: Record<string, string> = {
                  "left": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
                  "center-left": "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
                  "center": "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
                  "center-right": "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
                  "right": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
                };
                return (
                  <span key={source.id} data-testid={`source-badge-${source.id}`}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm ${biasStyle[source.biasRating] || "bg-muted text-foreground/70"}`}>
                    {source.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {narrativeLens && narrativeLens.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70 dark:text-foreground/60 mb-2">How Each Side Frames It</h3>
            <div className="space-y-2" data-testid="framing-analysis">
              {narrativeLens.map((lens, i) => (
                <div key={i} className="border border-border rounded-sm p-3" data-testid={`framing-item-${i}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">{lens.sourceName}</span>
                    <span className="text-[11px] text-foreground/60 dark:text-foreground/50 capitalize">{lens.tone}</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{lens.framing}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {coverageGaps && coverageGaps.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70 dark:text-foreground/60 mb-2">Coverage Gaps</h3>
            <div className="space-y-2" data-testid="coverage-gaps">
              {coverageGaps.map((gap, i) => (
                <div key={i} className="border border-border rounded-sm p-3" data-testid={`gap-item-${i}`}>
                  <p className="text-xs text-foreground mb-1">{gap.fact}</p>
                  <div className="text-[11px] text-red-700 dark:text-red-400 font-medium">Missed by: {gap.missedBy.join(", ")}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href={`/story/${node.story.id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-foreground text-background text-xs font-semibold tracking-wide hover:opacity-90 transition-opacity rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          data-testid="link-full-report">
          Read Full Analysis <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function ConflictListItem({ node, isSelected, onClick }: { node: ConflictNode; isSelected: boolean; onClick: () => void }) {
  const sev = getSeverityColor(node.severity);
  return (
    <button
      onClick={onClick}
      aria-label={`${sev.label} divergence conflict: ${node.story.headline}. ${node.uniqueSourceCount} sources.`}
      aria-pressed={isSelected}
      role="listitem"
      data-testid={`conflict-list-${node.story.id}`}
      className={`w-full text-left px-4 py-3.5 min-h-[44px] border-b border-border/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring ${
        isSelected ? "bg-muted/60" : "hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sev.dot}`} aria-hidden="true" />
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${sev.text}`}>{sev.label}</span>
        <span className="text-[11px] text-foreground/60 dark:text-foreground/50 ml-auto font-medium">{node.uniqueSourceCount} sources</span>
      </div>
      <p className="text-sm text-foreground line-clamp-2 leading-snug font-medium">{node.story.headline}</p>
      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-foreground/60 dark:text-foreground/50">
        <span className="capitalize font-medium">{node.story.topic}</span>
        {node.consensusScore !== null && <span>Consensus: {node.consensusScore}</span>}
      </div>
    </button>
  );
}

export default function ConflictMapPage() {
  const [activeTopic, setActiveTopic] = useState("ALL");
  const [selectedNode, setSelectedNode] = useState<ConflictNode | null>(null);
  const [sortBy, setSortBy] = useState<"severity" | "sources" | "recent">("severity");
  const [activeBasemap, setActiveBasemap] = useState<BasemapStyle>("dark-gray");
  const [basemapMenuOpen, setBasemapMenuOpen] = useState(false);
  const currentBasemap = useMemo(() => ESRI_BASEMAPS.find(b => b.id === activeBasemap) || ESRI_BASEMAPS[0], [activeBasemap]);
  const isDarkBasemap = activeBasemap === "dark-gray" || activeBasemap === "imagery" || activeBasemap === "oceans";
  const basemapMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!basemapMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (basemapMenuRef.current && !basemapMenuRef.current.contains(e.target as Node)) {
        setBasemapMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [basemapMenuOpen]);

  const { data: mapConfig } = useQuery<{ esriApiKey: string }>({
    queryKey: ["/api/config/map"],
  });
  const esriApiKey = mapConfig?.esriApiKey || "";

  const { data, isLoading } = useStories({
    topic: activeTopic === "ALL" ? undefined : activeTopic.toLowerCase(),
    limit: 100,
  });

  const topics = ["ALL", "POLITICS", "WORLD"];

  const conflictNodes: ConflictNode[] = useMemo(() => {
    if (!data?.stories) return [];
    const raw = data.stories.filter(isGlobalConflictStory).map((story) => {
      const consensusScore = getConsensusScore(story);
      const uniqueSources = getUniqueSources(story);
      const biasSpread = getBiasSpread(story);
      const coords = storyToCoords(story);
      return {
        story,
        severity: getSeverity(consensusScore, biasSpread, uniqueSources.length),
        sourceCount: story.storyArticles?.length || 0,
        uniqueSourceCount: uniqueSources.length,
        biasSpread,
        consensusScore,
        lat: coords.lat,
        lng: coords.lng,
      };
    });
    return deduplicateConflicts(raw);
  }, [data?.stories]);

  const sortedNodes = useMemo(() => {
    const sorted = [...conflictNodes];
    switch (sortBy) {
      case "severity": {
        const order = { critical: 0, high: 1, moderate: 2, low: 3 };
        sorted.sort((a, b) => order[a.severity] - order[b.severity]);
        break;
      }
      case "sources":
        sorted.sort((a, b) => b.uniqueSourceCount - a.uniqueSourceCount);
        break;
      case "recent":
        sorted.sort((a, b) => new Date(b.story.createdAt).getTime() - new Date(a.story.createdAt).getTime());
        break;
    }
    return sorted;
  }, [conflictNodes, sortBy]);

  const criticalCount = conflictNodes.filter(n => n.severity === "critical").length;

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="conflict-map-page">
      <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="a11y-live-region">
        {selectedNode ? `Selected conflict: ${selectedNode.story.headline}` : `${conflictNodes.length} conflicts tracked`}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground" data-testid="text-page-title">
              Narrative Conflict Map
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5" data-testid="text-page-subtitle">
              Global conflicts, geopolitical tensions, and regime events tracked across sources
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground pt-2">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-semibold" data-testid="text-critical-count">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" aria-hidden="true" />
                {criticalCount} critical
              </span>
            )}
            <span className="font-medium" data-testid="text-conflict-count">{conflictNodes.length} conflicts tracked</span>
          </div>
        </div>

        <div className="editorial-divider !my-4" />

        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 flex-wrap" data-testid="topic-filter" role="toolbar" aria-label="Filter by topic">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 hidden sm:block" aria-hidden="true" />
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => { setActiveTopic(topic); setSelectedNode(null); }}
                aria-label={`Filter by ${topic.toLowerCase()}`}
                aria-pressed={activeTopic === topic}
                data-testid={`filter-${topic.toLowerCase()}`}
                className={`min-h-[36px] min-w-[36px] px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  activeTopic === topic
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >{topic}</button>
            ))}
          </div>

          <div className="flex items-center gap-1.5" role="toolbar" aria-label="Sort conflicts">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" aria-hidden="true" />
            {(["severity", "sources", "recent"] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)} aria-label={`Sort by ${s}`} aria-pressed={sortBy === s} data-testid={`sort-${s}`}
                className={`min-h-[36px] min-w-[36px] px-2.5 py-1.5 text-[11px] font-semibold rounded-sm transition-colors capitalize focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  sortBy === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex gap-6 items-start">
          <div
            className="flex-1 relative rounded-sm overflow-hidden border border-border"
            style={{ minHeight: "520px" }}
            data-testid="map-container"
            role="application"
            aria-label={`Conflict map with ${conflictNodes.length} markers`}
            aria-describedby="map-description"
          >
            <div className="sr-only" id="map-description">
              Interactive map showing {conflictNodes.length} geopolitical conflicts. Each marker represents a conflict story; click or use the conflict list to explore details. Use zoom controls or scroll to navigate.
            </div>
            <MapContainer
              center={[25, 10]}
              zoom={2}
              minZoom={2}
              maxZoom={10}
              style={{ height: "520px", width: "100%", background: currentBasemap.bg }}
              zoomControl={true}
              attributionControl={true}
              className="conflict-leaflet-map"
              data-testid="leaflet-map"
            >
              <TileLayer
                key={`base-${activeBasemap}`}
                attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
                url={`${currentBasemap.baseUrl}${esriApiKey ? `?token=${esriApiKey}` : ""}`}
              />
              {currentBasemap.refUrl && (
                <TileLayer
                  key={`ref-${activeBasemap}`}
                  url={`${currentBasemap.refUrl}${esriApiKey ? `?token=${esriApiKey}` : ""}`}
                  pane="overlayPane"
                />
              )}
              <ScaleMarkers nodes={conflictNodes} selectedId={selectedNode?.story.id ?? null} onSelect={setSelectedNode} />
              <FlyToSelected selectedNode={selectedNode} />
            </MapContainer>

            <div className="absolute top-3 right-3 z-[1000]" data-testid="basemap-switcher" ref={basemapMenuRef}>
              <div className="relative">
                <button
                  onClick={() => setBasemapMenuOpen(!basemapMenuOpen)}
                  className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-sm px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-card transition-colors min-h-[36px]"
                  aria-label="Change basemap style"
                  aria-expanded={basemapMenuOpen}
                  data-testid="basemap-toggle-btn"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{currentBasemap.label}</span>
                </button>
                {basemapMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-card/95 backdrop-blur-sm border border-border rounded-sm shadow-lg overflow-hidden min-w-[140px]" role="listbox" aria-label="Basemap styles">
                    {ESRI_BASEMAPS.map((bm) => (
                      <button
                        key={bm.id}
                        role="option"
                        aria-selected={bm.id === activeBasemap}
                        onClick={() => { setActiveBasemap(bm.id); setBasemapMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors min-h-[36px] flex items-center gap-2 ${
                          bm.id === activeBasemap
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                        data-testid={`basemap-option-${bm.id}`}
                      >
                        <span
                          className="w-3 h-3 rounded-sm border border-border/50 flex-shrink-0"
                          style={{ backgroundColor: bm.bg }}
                          aria-hidden="true"
                        />
                        {bm.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-10 right-3 z-[1000]" data-testid="severity-legend" role="img" aria-label="Legend: Critical (red), High (orange), Moderate (amber), Low (violet) divergence levels">
              <div className="bg-card/90 backdrop-blur-sm border border-border rounded-sm px-3 py-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Divergence</div>
                <div className="flex flex-col gap-1.5">
                  {(["critical", "high", "moderate", "low"] as const).map((level) => {
                    const c = getSeverityColor(level);
                    return (
                      <div key={level} className="flex items-center gap-2" data-testid={`legend-${level}`}>
                        <span className={`w-3 h-3 rounded-full ${c.dot}`} aria-hidden="true" />
                        <span className="text-[11px] text-foreground font-medium">{c.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <nav className="w-80 xl:w-96 flex-shrink-0 hidden lg:block" data-testid="detail-sidebar" aria-label="Conflict details">
            {selectedNode ? (
              <div className="border border-border rounded-sm bg-card">
                <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
              </div>
            ) : (
              <div className="border border-border rounded-sm bg-card">
                <div className="p-4 border-b border-border">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conflict Feed</h2>
                </div>
                <div className="max-h-[460px] overflow-y-auto" data-testid="conflict-list" role="list" aria-label="List of conflicts">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32" role="status" aria-label="Loading conflicts">
                      <div className="text-sm text-muted-foreground animate-pulse">Loading conflicts…</div>
                    </div>
                  ) : sortedNodes.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground text-center px-4" data-testid="empty-state" role="status">
                      No conflicts detected in this category
                    </div>
                  ) : (
                    sortedNodes.map((node) => (
                      <ConflictListItem
                        key={node.story.id}
                        node={node}
                        isSelected={selectedNode?.story.id === node.story.id}
                        onClick={() => setSelectedNode(selectedNode?.story.id === node.story.id ? null : node)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </nav>
        </div>

        <div className="lg:hidden mt-6" data-testid="mobile-conflict-list">
          <div className="border border-border rounded-sm bg-card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {selectedNode ? "Conflict Detail" : "All Conflicts"}
              </h2>
              {selectedNode && (
                <button onClick={() => setSelectedNode(null)} className="min-h-[36px] text-xs text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-2" data-testid="button-back-to-list">
                  ← Back to list
                </button>
              )}
            </div>
            {selectedNode ? (
              <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
            ) : (
              <div className="max-h-[400px] overflow-y-auto" role="list" aria-label="List of conflicts">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground animate-pulse" role="status" aria-label="Loading conflicts">Loading…</div>
                ) : sortedNodes.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground" role="status">No conflicts detected</div>
                ) : (
                  sortedNodes.map((node) => (
                    <ConflictListItem key={node.story.id} node={node} isSelected={false} onClick={() => setSelectedNode(node)} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
