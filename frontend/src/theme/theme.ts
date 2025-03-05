export interface ColorTheme {
  primary: string;
  secondary: string;
  primaryHover: string;  // Added for button hover states
  primaryActive: string; // Added for button active states
  background: string;
  surface: string;
  error: string;
  onPrimary: string;
  onSecondary: string;
  onBackground: string;
  onSurface: string;
  onError: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  divider: string;
  shadow: string;
  bgFloating: string;
  bgButton: string;
  bgButtonHover: string;
  dropHighlight: string;
  componentBg: string;       // Added for component backgrounds
  inputBg: string;           // Added for input fields
  inputBorder: string;       // Added for input borders
  componentHighlight: string; // Added for component highlights
}

export interface Theme {
  name: string;
  colors: ColorTheme;
}

export const lightTheme: Theme = {
  name: "Light",
  colors: {
    primary: "#5c67f2",
    secondary: "#4caf50",
    primaryHover: "#4a56e0",  // Slightly darker primary
    primaryActive: "#3b46cd", // Even darker for active state
    background: "#ffffff",
    surface: "#f5f5f5",
    error: "#B00020",
    onPrimary: "#ffffff",
    onSecondary: "#ffffff",
    onBackground: "#333333",
    onSurface: "#333333",
    onError: "#ffffff",
    textPrimary: "#212121",
    textSecondary: "#666666",
    border: "#e0e0e0",
    divider: "#e0e0e0",
    shadow: "rgba(0, 0, 0, 0.15)",
    bgFloating: "rgba(255, 255, 255, 0.95)",
    bgButton: "#ffffff",
    bgButtonHover: "#f0f0f0",
    dropHighlight: "rgba(92, 103, 242, 0.1)",
    componentBg: "#ffffff",
    inputBg: "#ffffff",
    inputBorder: "#e0e0e0",
    componentHighlight: "rgba(92, 103, 242, 0.4)",
  },
};

export const darkTheme: Theme = {
  name: "Dark",
  colors: {
    primary: "#7685ff", // Lighter blue that looks better on dark backgrounds
    secondary: "#4caf50",
    primaryHover: "#8795ff", // Even lighter when hovered in dark mode
    primaryActive: "#99a5ff", // Even lighter when active in dark mode
    background: "#121212",
    surface: "#212121",
    error: "#CF6679",
    onPrimary: "#ffffff",
    onSecondary: "#ffffff",
    onBackground: "#e0e0e0",
    onSurface: "#e0e0e0",
    onError: "#000000",
    textPrimary: "#e0e0e0",
    textSecondary: "#a0a0a0",
    border: "#2d2d2d",
    divider: "#2d2d2d",
    shadow: "rgba(0, 0, 0, 0.3)",
    bgFloating: "rgba(33, 33, 33, 0.95)",
    bgButton: "#2d2d2d",
    bgButtonHover: "#3d3d3d",
    dropHighlight: "rgba(92, 103, 242, 0.2)",
    componentBg: "#2a2a2a",
    inputBg: "#333333",
    inputBorder: "#444444",
    componentHighlight: "rgba(118, 133, 255, 0.4)",
  },
};

// Mapping object for themes
export const themes: Record<string, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};
