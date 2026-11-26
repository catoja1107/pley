import { describe, expect, it } from "vitest";
import css from "../index.css?raw";
import { THEMES, type Theme } from ".";

/** Each `[data-theme="…"]` block of index.css: its custom properties by name. */
function palettes(): Map<string, Record<string, string>> {
  const found = new Map<string, Record<string, string>>();
  for (const [, selector, body] of css.matchAll(/([^{}]*\[data-theme="[a-z]+"\][^{}]*)\{([^{}]*)\}/g)) {
    const values = Object.fromEntries([...body!.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name!, value!.trim()]));
    // Each selector of the block that is a theme's alone (not "[data-theme] [data-dark]").
    for (const [, theme] of selector!.matchAll(/^\s*\[data-theme="([a-z]+)"\]\s*,?\s*$/gm)) found.set(theme!, values);
  }
  return found;
}

/** The colors @theme declares, Midnight's. */
function declared(): Record<string, string> {
  const block = /@theme\s*\{([\s\S]*?)\n\s*@keyframes/.exec(css)?.[1] ?? "";
  return Object.fromEntries([...block.matchAll(/(--color-[\w-]+):\s*(#[0-9a-f]{6});/g)].map(([, name, value]) => [name!, value!]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((at) => {
    const c = parseInt(hex.slice(at, at + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** WCAG's contrast ratio of two colors. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe("each theme's colors", () => {
  const all = palettes();

  it("are every color @theme declares, Midnight's being @theme's own", () => {
    const names = Object.keys(declared());
    expect(names.length).toBeGreaterThan(20);
    expect([...all.keys()].sort()).toEqual([...THEMES].sort());
    for (const theme of THEMES) {
      expect(Object.keys(all.get(theme)!).filter((name) => name.startsWith("--color-")).sort(), theme).toEqual(names.sort());
    }
    const midnight = all.get("midnight")!;
    for (const name of names) expect(midnight[name], name).toBe(declared()[name]);
  });

  it("each set a backdrop and a sidebar picture, none or their own, so a preview in one doesn't show the page's", () => {
    for (const theme of THEMES) {
      expect(all.get(theme)!["--glow"], theme).toBeTruthy();
      expect(all.get(theme)!["--sidebar"], theme).toBeTruthy();
    }
  });

  it("keep the players dark in the light themes, in their dark twin's colors", () => {
    const twins = { midlight: "midnight", starlight: "moonlight", greenlight: "nightshade", sunshine: "midnight" };
    for (const [light, dark] of Object.entries(twins)) {
      const block = [...css.matchAll(/([^{}]*)\{[^{}]*\}/g)].find(([, selector]) => selector!.includes(`[data-theme="${dark}"],`));
      expect(block?.[1], light).toContain(`[data-theme="${light}"] [data-dark]`);
    }
  });

  // [words, ground, least contrast]: WCAG AA for text (4.5), AAA for
  // the main text (7).
  const pairs: [string, string, number][] = [
    ["fg", "bg", 7],
    ["fg", "surface", 7],
    ["fg", "surface-2", 7],
    ["fg", "surface-3", 4.5],
    ["muted", "bg", 4.5],
    ["muted", "surface", 4.5],
    ["muted", "surface-2", 4.5],
    ["muted", "surface-3", 4.5],
    // Hints, inputs' placeholders among them.
    ["subtle", "bg", 4.5],
    ["subtle", "surface", 4.5],
    ["subtle", "surface-2", 4.5],
    ["accent", "bg", 4.5],
    ["accent", "surface", 4.5],
    ["accent", "surface-2", 4.5],
    ["accent", "surface-3", 4.5],
    ["accent-fg", "accent", 4.5],
    ["accent-fg", "accent-hover", 4.5],
    ["success", "surface", 4.5],
    ["danger", "surface", 4.5],
    ["info", "surface", 4.5],
    ["warning", "surface", 4.5],
    // Words on a fill: the attention badge, a danger button or badge.
    ["bg", "warning", 4.5],
    ["danger-fg", "danger", 4.5],
  ];

  /** `color` laid at `alpha` over `under`, as `bg-success/15` draws over a card. */
  function over(color: string, alpha: number, under: string): string {
    const channel = (hex: string, at: number) => parseInt(hex.slice(at, at + 2), 16);
    return `#${[1, 3, 5]
      .map((at) => Math.round(channel(color, at) * alpha + channel(under, at) * (1 - alpha)).toString(16).padStart(2, "0"))
      .join("")}`;
  }

  it.each(THEMES)("are readable in %s", (theme: Theme) => {
    const colors = all.get(theme)!;
    const color = (name: string) => colors[`--color-${name}`]!;
    for (const [words, ground, least] of pairs) {
      expect(contrast(color(words), color(ground)), `${words} on ${ground}`).toBeGreaterThanOrEqual(least);
    }
    // A badge in a state's color on its own tint, up to the 20% the app uses.
    for (const state of ["accent", "success", "danger", "warning", "info"]) {
      const tint = over(color(state), 0.2, color("surface"));
      expect(contrast(color(state), tint), `${state} on its tint`).toBeGreaterThanOrEqual(4.5);
    }
    // The danger button, its fill at 90% over the card.
    expect(contrast(color("danger-fg"), over(color("danger"), 0.9, color("surface"))), "danger button").toBeGreaterThanOrEqual(4.5);
    // The logo on its tile: the front poster plain at one end of its
    // gradient, the others fading into the tile behind it.
    const onTile = (name: string) => contrast(color(name), color("brand-tile"));
    expect(Math.max(onTile("brand-light"), onTile("brand")), "logo, front poster").toBeGreaterThanOrEqual(4.5);
    expect(onTile("brand-deep"), "logo, middle poster").toBeGreaterThanOrEqual(2);
    expect(onTile("brand-far"), "logo, back poster").toBeGreaterThanOrEqual(1.3);
  });
});
