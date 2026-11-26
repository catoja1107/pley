import { useSyncExternalStore } from "react";
import { logoIcon } from "@/components/Logo";

/**
 * The theme Pley is drawn in (docs/THEMES.md): each device's own, kept in its
 * storage, Midnight until one is picked there. index.css holds each theme's
 * colors under `[data-theme="…"]`; the page's own is on <html>, set before
 * the first page draws by public/theme.js.
 */
export const THEMES = ["midnight", "midlight", "starlight", "twilight", "moonlight", "nightshade", "greenlight", "sunshine", "blacklight"] as const;
export type Theme = (typeof THEMES)[number];

/** Pley's own, for a device that picked none. */
export const DEFAULT_THEME: Theme = "midnight";

/** Where this device keeps the theme it showed last; public/theme.js reads it too. */
export const THEME_KEY = "pley.theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

let shown: Theme = DEFAULT_THEME;
const listeners = new Set<() => void>();

/** The theme on the page. */
export function currentTheme(): Theme {
  return shown;
}

export function onTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function draw(theme: Theme) {
  const root = document.documentElement;
  // Every color changes at once: what eases its color (a link, a button)
  // would otherwise fade from the old theme while the rest has changed.
  root.classList.add("theme-changing");
  root.dataset.theme = theme;
  // Draws the new colors now, while nothing eases.
  void document.body.offsetHeight;
  setTimeout(() => root.classList.remove("theme-changing"), 0);
  // The browser's own bars (a phone's, an installed app's) in the page's colors.
  const style = getComputedStyle(root);
  const background = style.getPropertyValue("--color-bg").trim();
  if (background) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
  if (style.colorScheme) document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", style.colorScheme);
  // The tab's icon: Pley's own file in Midnight, the logo in the theme's colors in the others.
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
  if (icon && background) {
    icon.href = theme === DEFAULT_THEME ? "/favicon.svg" : `data:image/svg+xml,${encodeURIComponent(logoIcon(style))}`;
  }
}

/** Puts a theme on the page, and keeps it so this device's next visit starts in it. */
export function showTheme(theme: Theme) {
  if (theme === shown && document.documentElement.dataset.theme === theme) return;
  shown = theme;
  draw(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Without storage, the next visit starts in Midnight.
  }
  for (const listener of listeners) listener();
}

/** Before the app draws: the theme of this device's last visit. */
export function startTheme() {
  let kept: string | null = null;
  try {
    kept = localStorage.getItem(THEME_KEY);
  } catch {
    // Nothing kept.
  }
  shown = isTheme(kept) ? kept : DEFAULT_THEME;
  draw(shown);
}

/** The theme on the page, following changes. */
export function useTheme(): Theme {
  return useSyncExternalStore(onTheme, currentTheme);
}
