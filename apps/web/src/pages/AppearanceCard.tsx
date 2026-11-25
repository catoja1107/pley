import { Check, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import { errorMessage } from "@/api/client";
import { useUpdateProfile } from "@/api/hooks";
import { useAuth } from "@/auth";
import { useToast } from "@/components/Toast";
import { Card, CardTitle, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ACCENT_COLORS, ACCENTS, OWN_ACCENTS, THEMES, prefersLight, setLook, shownTheme, useLook, type Accent, type LookChoice } from "@/appearance";

/**
 * The account's theme and accent (docs/API.md, "Appearance"), on all its
 * devices; this device's own on a server from before themes, which keeps
 * none.
 */
export function AppearanceCard() {
  const { t } = useTranslation();
  const user = useAuth();
  const update = useUpdateProfile();
  const toast = useToast();
  // The choice shown is the account's once AppearanceSync has it.
  const look = useLook();
  const kept = user.theme !== undefined;
  const choice = look.choice;
  // The theme as it shows here: System's is this device's light or dark.
  const shown = shownTheme(choice.theme, prefersLight());
  const mode = shown === "light" ? "light" : "dark";

  const choose = (patch: Partial<LookChoice>) => {
    if (!kept) {
      setLook(patch.theme ?? choice.theme, "accent" in patch ? patch.accent : choice.accent);
      return;
    }
    update.mutate(patch, { onError: (err) => toast.error(errorMessage(err)) });
  };

  const accentOption = (accent: Accent | null) => {
    const color = ACCENT_COLORS[accent ?? OWN_ACCENTS[shown]][mode].accent;
    const label = accent ? t(`appearance.accents.${accent}`) : t("appearance.themeAccent", { accent: t(`appearance.accents.${OWN_ACCENTS[shown]}`) });
    const checked = choice.accent === accent;
    return (
      <button
        key={accent ?? "own"}
        type="button"
        role="radio"
        aria-checked={checked}
        disabled={update.isPending}
        onClick={() => choose({ accent })}
        className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
          checked ? "border-accent bg-surface-3 text-fg" : "border-border text-muted hover:border-border-strong hover:text-fg",
        )}
      >
        <span aria-hidden className="flex size-5 items-center justify-center rounded-full ring-1 ring-fg/20" style={{ backgroundColor: color }}>
          {checked ? <Check className="size-3.5" style={{ color: ACCENT_COLORS[accent ?? OWN_ACCENTS[shown]][mode]["accent-fg"] }} /> : null}
        </span>
        {label}
      </button>
    );
  };

  return (
    <Card>
      <CardTitle icon={<Palette />}>{t("appearance.label")}</CardTitle>
      <p className="mb-4 text-sm text-muted">{t(kept ? "appearance.accountHint" : "appearance.deviceHint")}</p>
      <label className="mb-1.5 block text-sm font-medium text-fg" htmlFor="appearance-theme">
        {t("appearance.theme")}
      </label>
      <Select
        id="appearance-theme"
        className="mb-5 w-full sm:w-80"
        value={choice.theme}
        disabled={update.isPending}
        onChange={(e) => choose({ theme: e.target.value as LookChoice["theme"] })}
      >
        {THEMES.map((theme) => (
          <option key={theme} value={theme}>
            {theme === "system" ? t("appearance.automatic", { theme: t(`appearance.themes.${prefersLight() ? "light" : "dark"}`) }) : t(`appearance.themes.${theme}`)}
          </option>
        ))}
      </Select>
      <p id="appearance-accent" className="mb-1.5 text-sm font-medium text-fg">
        {t("appearance.accent")}
      </p>
      <div role="radiogroup" aria-labelledby="appearance-accent" className="flex flex-wrap gap-2">
        {accentOption(null)}
        {ACCENTS.map((accent) => accentOption(accent))}
      </div>
    </Card>
  );
}
