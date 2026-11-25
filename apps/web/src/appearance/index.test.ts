import { afterEach, describe, expect, it } from "vitest";
import {
  ACCENT_COLORS,
  ACCENTS,
  OWN_ACCENTS,
  PALETTES,
  THEMES,
  currentLook,
  darkLookStyle,
  lookChoice,
  lookVariables,
  setLook,
  shownAccent,
  shownTheme,
  type Accent,
  type ShownTheme,
} from ".";

interface Fixture {
  themes: string[];
  accents: string[];
  themeAccents: Record<string, string>;
}

// The themes and accents every app offers (docs/API.md, "Appearance"), as
// the TVs' fixture names them.
const [fixture] = Object.values(
  import.meta.glob<Fixture>("../../../../packages/tv/test/fixtures/appearance.json", { eager: true, import: "default" }),
);

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((at) => {
    const c = parseInt(hex.slice(at, at + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const hi = Math.max(luminance(a), luminance(b));
  const lo = Math.min(luminance(a), luminance(b));
  return (hi + 0.05) / (lo + 0.05);
}

const SHOWN = Object.keys(PALETTES) as ShownTheme[];

describe("appearance", () => {
  afterEach(() => {
    localStorage.clear();
    setLook("dark", null);
  });

  it("offers what every app offers", () => {
    expect([...THEMES]).toEqual(fixture?.themes);
    expect([...ACCENTS]).toEqual(fixture?.accents);
    expect(OWN_ACCENTS).toEqual(fixture?.themeAccents);
  });

  it("measures contrast as WCAG does", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 2);
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  // Words at 4.5:1 (AA), the main ones at 7:1. The subtle hints are no
  // harder to read than in Pley's Dark, whose look stays as it was.
  it.each(SHOWN.flatMap((theme) => ACCENTS.map((accent) => [theme, accent] as [ShownTheme, Accent])))(
    "keeps %s with %s readable",
    (theme, accent) => {
      const vars = lookVariables(theme, accent);
      const c = (name: string) => vars[`--color-${name}`] ?? "";
      const pairs: [string, string, number][] = [
        ["fg", "bg", 7],
        ["fg", "surface", 7],
        ["fg", "surface-2", 7],
        ["fg", "surface-3", 7],
        ["muted", "bg", 4.5],
        ["muted", "surface", 4.5],
        ["muted", "surface-2", 4.5],
        ["subtle", "bg", contrast(PALETTES.dark.subtle, PALETTES.dark.bg)],
        ["subtle", "surface", contrast(PALETTES.dark.subtle, PALETTES.dark.surface)],
        ["accent", "accent-fg", 4.5],
        ["accent", "bg", 4.5],
        ["accent", "surface", 4.5],
        ["accent-hover", "accent-fg", 4.5],
        ["ink", "bg", 7],
        ["danger", "bg", 4.5],
        ["success", "bg", 4.5],
        ["warning", "bg", 4.5],
      ];
      for (const [fg, bg, least] of pairs) {
        expect(contrast(c(fg), c(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(least);
      }
    },
  );

  it("keeps Pley's look until something else is chosen", () => {
    expect(lookChoice(undefined, undefined)).toEqual({ theme: "dark", accent: null });
    expect(lookChoice("sepia", "mauve")).toEqual({ theme: "dark", accent: null });
    const vars = lookVariables("dark", "sky");
    expect(vars["--color-bg"]).toBe("#0b0d10");
    expect(vars["--color-accent"]).toBe("#38bdf8");
  });

  it("shows System as the device is set, and each theme's own accent", () => {
    expect(shownTheme("system", true)).toBe("light");
    expect(shownTheme("system", false)).toBe("dark");
    expect(shownTheme("midnight", true)).toBe("midnight");
    expect(shownAccent("obsidian", null)).toBe("emerald");
    expect(shownAccent("obsidian", "amber")).toBe("amber");
    expect(lookVariables("light", "violet")["--color-accent"]).toBe(ACCENT_COLORS.violet.light.accent);
    expect(lookVariables("arctic", "violet")["--color-accent"]).toBe(ACCENT_COLORS.violet.dark.accent);
  });

  it("draws the page in the look chosen and keeps it for the next visit", () => {
    setLook("light", "amber");
    const root = document.documentElement;
    expect(root.dataset.theme).toBe("light");
    expect(root.style.getPropertyValue("--color-bg")).toBe(PALETTES.light.bg);
    expect(root.style.getPropertyValue("--color-accent")).toBe(ACCENT_COLORS.amber.light.accent);
    expect(root.style.colorScheme).toBe("light");
    expect(JSON.parse(localStorage.getItem("pley.look") ?? "{}")).toEqual({ theme: "light", accent: "amber" });
    expect(currentLook()).toMatchObject({ theme: "light", accent: "amber" });
  });

  it("keeps the players dark in Light, with the accent's bright colors", () => {
    expect(darkLookStyle({ theme: "midnight", accent: "blue" })).toBeUndefined();
    const style = darkLookStyle({ theme: "light", accent: "teal" }) as Record<string, string>;
    expect(style["--color-bg"]).toBe(PALETTES.dark.bg);
    expect(style["--color-accent"]).toBe(ACCENT_COLORS.teal.dark.accent);
    expect(style.colorScheme).toBe("dark");
  });
});
