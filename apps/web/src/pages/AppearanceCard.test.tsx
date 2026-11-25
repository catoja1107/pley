import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { User } from "@/api/types";
import { ACCENT_COLORS, PALETTES, currentLook, setLook } from "@/appearance";
import { AppearanceSync } from "@/appearance/AppearanceSync";
import { mockApi, renderWithProviders, testUser } from "@/test/render";
import { AppearanceCard } from "./AppearanceCard";

afterEach(() => {
  setLook("dark", null);
  localStorage.clear();
});

describe("AppearanceCard", () => {
  it("keeps the theme and accent for the account, and draws the page in them", async () => {
    const user = userEvent.setup();
    const account: User = { ...testUser, theme: "dark", accent: null };
    let saved = account;
    const requests = mockApi({ "PATCH /api/me": (req) => (saved = { ...saved, ...(req.body as Partial<User>) }) });
    const { client } = renderWithProviders(
      <>
        <AppearanceSync />
        <AppearanceCard />
      </>,
      { user: account },
    );
    client.setQueryData(["me"], account);

    const theme = await screen.findByLabelText("Theme");
    expect(theme).toHaveValue("dark");
    expect(screen.getByRole("radio", { name: "The theme's own (Sky)" })).toHaveAttribute("aria-checked", "true");

    await user.selectOptions(theme, "Midnight");
    await waitFor(() => expect(requests.at(-1)?.body).toEqual({ theme: "midnight" }));
    await waitFor(() => expect(document.documentElement.style.getPropertyValue("--color-bg")).toBe(PALETTES.midnight.bg));
    // Midnight's own accent, named.
    expect(await screen.findByRole("radio", { name: "The theme's own (Blue)" })).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("radio", { name: "Amber" }));
    await waitFor(() => expect(requests.at(-1)?.body).toEqual({ accent: "amber" }));
    await waitFor(() => expect(document.documentElement.style.getPropertyValue("--color-accent")).toBe(ACCENT_COLORS.amber.dark.accent));

    await user.click(screen.getByRole("radio", { name: "The theme's own (Blue)" }));
    await waitFor(() => expect(requests.at(-1)?.body).toEqual({ accent: null }));
  });

  it("keeps it on this device where the server keeps none", async () => {
    const user = userEvent.setup();
    const requests = mockApi({});
    const { client } = renderWithProviders(<AppearanceCard />);
    // A Pley from before themes names none.
    client.setQueryData(["me"], testUser);

    await user.selectOptions(await screen.findByLabelText("Theme"), "Light");
    expect(currentLook()).toMatchObject({ theme: "light", accent: "sky" });
    expect(JSON.parse(localStorage.getItem("pley.look") ?? "{}")).toEqual({ theme: "light", accent: null });
    expect(requests).toHaveLength(0);
    expect(screen.getByText("How Pley looks on this device. Update Pley on the server to keep it for your account.")).toBeInTheDocument();
  });
});
