import type { Dispatch, FC} from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | undefined;
type Ctx = { theme: Theme; setTheme: Dispatch<React.SetStateAction<Theme>> };

type Props = {
  children: JSX.Element;
  storageKey?: string;
};

const MEDIA = "(prefers-color-scheme: dark)";

const ThemeContext = createContext<Ctx | null>(null);
export function useThemeContext() {

  const ctx = useContext(ThemeContext);
  if (!ctx) {
    console.error("Should use this inside a ThemeProvider Component");
    return;
  }
  return ctx;
}
export const ThemeProvider: FC<Props> = ({storageKey = "theme", children}: Props) => {
  const [theme, setTheme] = useState<Theme>(
    getInitialTheme(storageKey)
  );

  useEffect(() => {
    const val = localStorage.getItem(storageKey) as Theme | null;
    if (val) {
      setTheme(val);
    }
  }, [storageKey]);


  //listen to system pref
  useEffect(() => {
    const getSystemTheme = (ev: MediaQueryListEvent | MediaQueryList) => {
      const isDark = ev.matches;
      const systemTheme = isDark ? "dark" : "light";
      setTheme(systemTheme);
      localStorage.setItem(storageKey, systemTheme);
    };

    const media = window.matchMedia(MEDIA);
    media.addListener(getSystemTheme);
    media.addEventListener("change", getSystemTheme);

    return () => {
      media.removeListener(getSystemTheme);
      media.removeEventListener("change", getSystemTheme);
    };

  }, [storageKey]);

  //listen to theme change
  useEffect(()  => {
      const root = window.document.documentElement;
      if (theme === "dark") {
        root.classList.remove("light");
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      }
      if (typeof theme !== "undefined") {
        window.localStorage.setItem(storageKey, theme);
      }
    }, [storageKey, theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
const getInitialTheme = (key: string, fallback?: "dark" | "light"): Theme => {
  if (typeof window === "undefined") return undefined;
  let theme: Theme;
  try {
    theme = (localStorage.getItem(key) as Theme) ?? undefined;
  } catch (e) {
    // Unsupported
  }
  return theme ?? fallback;
};
