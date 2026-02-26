import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type FontSize = "small" | "medium" | "large" | "xl";

const FONT_SIZE_SCALE: Record<FontSize, string> = {
  small: "100%",
  medium: "112.5%",
  large: "137.5%",
  xl: "175%",
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  fontSize: "medium",
  setFontSize: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("meridian-theme") as Theme | null;
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("meridian-font-size") as FontSize | null;
      if (stored && stored in FONT_SIZE_SCALE) return stored;
    }
    return "medium";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("meridian-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_SCALE[fontSize];
    localStorage.setItem("meridian-font-size", fontSize);
  }, [fontSize]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
