import { useSyncExternalStore, type CSSProperties } from "react";

/**
 * The theme and accent the app is drawn in (docs/API.md, "Appearance"): the
 * account's, else the one this device showed last. A look sets the colors
 * index.css declares (`--color-*`, Dark's with sky there) on the page; the
 * player keeps Dark's under the Light theme (`useDarkLook`), as the picture
 * under it needs.
 */

export const THEMES = ["system", "dark", "light", "midnight", "obsidian", "arctic"] as const;
export type Theme = (typeof THEMES)[number];
/** A theme as it shows: System is Light or Dark, as the device is set. */
export type ShownTheme = Exclude<Theme, "system">;

export const ACCENTS = ["sky", "blue", "emerald", "teal", "amber", "violet"] as const;
export type Accent = (typeof ACCENTS)[number];

/** The accent each theme has while the account picked none. */
export const OWN_ACCENTS: Record<ShownTheme, Accent> = {
  dark: "sky",
  light: "sky",
  midnight: "blue",
  obsidian: "emerald",
  arctic: "teal",
};

/** A theme's colors, by the names index.css gives them (`--color-<name>`). */
export interface Palette {
  bg: string;
  surface: string;
  "surface-2": string;
  "surface-3": string;
  border: string;
  "border-strong": string;
  fg: string;
  muted: string;
  subtle: string;
  /** The strongest the page draws (white on the dark themes), and its opposite. */
  ink: string;
  paper: string;
  success: string;
  danger: string;
  info: string;
  warning: string;
}

const STATES = { success: "#3fb27f", danger: "#e5484d", info: "#4c9aff", warning: "#f0a83c" };
const INK = { ink: "#ffffff", paper: "#000000" };

export const PALETTES: Record<ShownTheme, Palette> = {
  // index.css's own: Pley's look before themes.
  dark: {
    bg: "#0b0d10",
    surface: "#12151a",
    "surface-2": "#191d24",
    "surface-3": "#222731",
    border: "#2a303b",
    "border-strong": "#3a4250",
    fg: "#e9ebef",
    muted: "#a1a9b6",
    subtle: "#6c7584",
    ...INK,
    ...STATES,
  },
  light: {
    bg: "#f4f5f7",
    surface: "#ffffff",
    "surface-2": "#eef0f3",
    "surface-3": "#e3e7ec",
    border: "#d5dae1",
    "border-strong": "#b8c0cb",
    fg: "#15181d",
    muted: "#4b5361",
    subtle: "#636c7a",
    ink: "#15181d",
    paper: "#ffffff",
    success: "#15704a",
    danger: "#c42b33",
    info: "#1f5cc8",
    warning: "#8a5a00",
  },
  midnight: {
    bg: "#101522",
    surface: "#171f30",
    "surface-2": "#202b40",
    "surface-3": "#28364f",
    border: "#304566",
    "border-strong": "#3f5a82",
    fg: "#ffffff",
    muted: "#aab5c8",
    subtle: "#7584a0",
    ...INK,
    ...STATES,
  },
  obsidian: {
    bg: "#101311",
    surface: "#171e19",
    "surface-2": "#1d2620",
    "surface-3": "#25302a",
    border: "#26372c",
    "border-strong": "#365040",
    fg: "#ffffff",
    muted: "#a8b4aa",
    subtle: "#738276",
    ...INK,
    ...STATES,
  },
  arctic: {
    bg: "#0d1419",
    surface: "#131f26",
    "surface-2": "#192a33",
    "surface-3": "#21353f",
    border: "#203945",
    "border-strong": "#2d5060",
    fg: "#f2fafc",
    muted: "#9ab0b9",
    subtle: "#67818c",
    ...INK,
    ...STATES,
  },
};

/** An accent's colors: the color, a brighter one on hover, the words on it. */
export interface AccentColors {
  accent: string;
  "accent-hover": string;
  "accent-fg": string;
}

/**
 * Bright with dark words on the dark themes; deep with white words on
 * Light, where it is also the color of links on the page.
 */
export const ACCENT_COLORS: Record<Accent, { dark: AccentColors; light: AccentColors }> = {
  sky: {
    dark: { accent: "#38bdf8", "accent-hover": "#7dd3fc", "accent-fg": "#03131f" },
    light: { accent: "#0369a1", "accent-hover": "#075985", "accent-fg": "#ffffff" },
  },
  blue: {
    dark: { accent: "#70a5ff", "accent-hover": "#a9c8ff", "accent-fg": "#04122b" },
    light: { accent: "#2458c8", "accent-hover": "#1d47a6", "accent-fg": "#ffffff" },
  },
  emerald: {
    dark: { accent: "#4ccb83", "accent-hover": "#8be3b1", "accent-fg": "#03190d" },
    light: { accent: "#1f6b44", "accent-hover": "#1d5a3a", "accent-fg": "#ffffff" },
  },
  teal: {
    dark: { accent: "#48e0e5", "accent-hover": "#8deff1", "accent-fg": "#031a1b" },
    light: { accent: "#006a71", "accent-hover": "#005a60", "accent-fg": "#ffffff" },
  },
  amber: {
    dark: { accent: "#f2b65f", "accent-hover": "#f8d08f", "accent-fg": "#1f1403" },
    light: { accent: "#8a4f0c", "accent-hover": "#74420a", "accent-fg": "#ffffff" },
  },
  violet: {
    dark: { accent: "#c18aff", "accent-hover": "#d8b9ff", "accent-fg": "#1a0b2e" },
    light: { accent: "#6e3fd0", "accent-hover": "#5a2fb0", "accent-fg": "#ffffff" },
  },
};

const isTheme = (value: unknown): value is Theme => typeof value === "string" && (THEMES as readonly string[]).includes(value);
const isAccent = (value: unknown): value is Accent => typeof value === "string" && (ACCENTS as readonly string[]).includes(value);

/** A choice as kept: a theme ("dark" for none or one this app doesn't know) and an accent (`null`: the theme's own). */
export interface LookChoice {
  theme: Theme;
  accent: Accent | null;
}

export function lookChoice(theme: unknown, accent: unknown): LookChoice {
  return { theme: isTheme(theme) ? theme : "dark", accent: isAccent(accent) ? accent : null };
}

/** The theme a choice shows: System is Light where the device prefers light, else Dark. */
export function shownTheme(theme: Theme, prefersLight: boolean): ShownTheme {
  if (theme === "system") return prefersLight ? "light" : "dark";
  return theme;
}

export function shownAccent(theme: ShownTheme, accent: Accent | null): Accent {
  return accent ?? OWN_ACCENTS[theme];
}

/** What a look sets: each `--color-*` index.css declares. */
export function lookVariables(theme: ShownTheme, accent: Accent): Record<string, string> {
  const colors: Record<string, string> = { ...PALETTES[theme], ...ACCENT_COLORS[accent][theme === "light" ? "light" : "dark"] };
  return Object.fromEntries(Object.entries(colors).map(([name, value]) => [`--color-${name}`, value]));
}

// --- The look shown, a store the page and its parts follow ---

const STORAGE_KEY = "pley.look";
const LIGHT_QUERY = "(prefers-color-scheme: light)";
const listeners = new Set<() => void>();
let choice: LookChoice = lookChoice("dark", null);
let snapshot = { choice, theme: "dark" as ShownTheme, accent: "sky" as Accent };

/** Whether this device is set to light: what System shows. */
export function prefersLight(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(LIGHT_QUERY).matches;
}

/** The choice in force and what it shows now. */
export function currentLook() {
  return snapshot;
}

export function onLook(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function show() {
  const theme = shownTheme(choice.theme, prefersLight());
  const accent = shownAccent(theme, choice.accent);
  snapshot = { choice, theme, accent };
  const root = document.documentElement;
  for (const [name, value] of Object.entries(lookVariables(theme, accent))) root.style.setProperty(name, value);
  root.style.colorScheme = theme === "light" ? "light" : "dark";
  root.dataset.theme = theme;
  // The browser's own bar, where it takes the page's color.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", PALETTES[theme].bg);
  for (const listener of listeners) listener();
}

/** Shows a choice, and keeps it on the device so the next visit starts in it. */
export function setLook(theme: unknown, accent: unknown) {
  const next = lookChoice(theme, accent);
  if (next.theme === choice.theme && next.accent === choice.accent) return;
  choice = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Without storage the next visit starts in Dark until the account is heard.
  }
  show();
}

/**
 * Before the first page draws: the look of the last visit, and System
 * following the device as its setting changes.
 */
export function startLook() {
  let kept: Partial<LookChoice>;
  try {
    kept = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<LookChoice>;
  } catch {
    kept = {};
  }
  choice = lookChoice(kept.theme, kept.accent);
  show();
  if (typeof window.matchMedia === "function") {
    window.matchMedia(LIGHT_QUERY).addEventListener("change", () => {
      if (choice.theme === "system") show();
    });
  }
}

/**
 * Style for a part that stays dark in the Light theme (the players): Dark's
 * colors with the accent's bright ones; nothing in a dark theme.
 */
export function darkLookStyle(look: { theme: ShownTheme; accent: Accent }): CSSProperties | undefined {
  if (look.theme !== "light") return undefined;
  return { ...lookVariables("dark", look.accent), colorScheme: "dark" };
}

/** The look shown, following changes. */
export function useLook() {
  return useSyncExternalStore(onLook, currentLook);
}

/** darkLookStyle of the look shown, for a player's outermost element. */
export function useDarkLook(): CSSProperties | undefined {
  return darkLookStyle(useLook());
}
