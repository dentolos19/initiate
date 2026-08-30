import { ReactNode, createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

type ResolvedTheme = "dark" | "light";
type Theme = ResolvedTheme | "system";

interface ThemeContextValue {
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  theme: Theme;
}

interface ThemeProviderProps {
  children?: ReactNode;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const themeEvent = "theme-change";
const storageKey = "theme";

const isTheme = (value: string | null): value is Theme => value === "dark" || value === "light" || value === "system";

const getSnapshot = () => {
  const storedTheme = window.localStorage.getItem(storageKey);
  const theme = isTheme(storedTheme) ? storedTheme : "system";
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const resolvedTheme = theme === "system" ? systemTheme : theme;
  return `${theme}:${resolvedTheme}`;
};

const getServerSnapshot = () => "system:light";

const subscribe = (notify: () => void) => {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", notify);
  window.addEventListener("storage", notify);
  window.addEventListener(themeEvent, notify);

  return () => {
    query.removeEventListener("change", notify);
    window.removeEventListener("storage", notify);
    window.removeEventListener(themeEvent, notify);
  };
};

const setTheme = (theme: Theme) => {
  window.localStorage.setItem(storageKey, theme);
  window.dispatchEvent(new Event(themeEvent));
};

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [theme, resolvedTheme] = snapshot.split(":") as [Theme, ResolvedTheme];

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", resolvedTheme === "dark" ? "#252525" : "#ffffff");
  }, [resolvedTheme]);

  const value = useMemo(() => ({ resolvedTheme, setTheme, theme }), [resolvedTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider.");
  return context;
};
