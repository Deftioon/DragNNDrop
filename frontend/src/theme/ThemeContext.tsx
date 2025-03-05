import {
  FC,
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Theme, themes, darkTheme } from "./theme";
import './theme.css';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(darkTheme);

  // Load theme preference from localStorage on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && themes[savedTheme]) {
      setTheme(themes[savedTheme]);
    } else {
      // Or use system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setTheme(prefersDark ? themes.dark : themes.light);
    }
  }, []);

  // Apply theme CSS variables whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    console.log("Applying theme:", theme.name);
    
    // Apply all theme colors as CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case for CSS variables
      const cssVarName = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      const cssVar = `--color-${cssVarName}`;
      root.style.setProperty(cssVar, value);
      console.log(`Setting ${cssVar} to ${value}`);
      
      // Also set old var names for backward compatibility
      if (key === 'textPrimary') root.style.setProperty('--text-primary', value);
      if (key === 'textSecondary') root.style.setProperty('--text-secondary', value);
      if (key === 'background') root.style.setProperty('--bg-primary', value);
      if (key === 'surface') root.style.setProperty('--bg-secondary', value);
      if (key === 'border') root.style.setProperty('--border-color', value);
      if (key === 'shadow') root.style.setProperty('--shadow-color', value);
      if (key === 'bgFloating') {
        root.style.setProperty('--bg-floating', value);
        root.style.setProperty('--bg-popup', value);
      }
    });
    
    localStorage.setItem("theme", theme.name.toLowerCase());
  }, [theme]);

  // Apply theme class to body
  useEffect(() => {
    if (theme.name === 'Dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme.name === "Dark" ? themes.light : themes.dark,
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
