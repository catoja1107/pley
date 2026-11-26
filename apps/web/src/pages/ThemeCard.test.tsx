import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { startTheme, THEME_KEY } from "@/theme";
import { mockApi, renderWithProviders } from "@/test/render";
import { ThemeCard } from "./ThemeCard";

afterEach(() => {
  localStorage.clear();
  startTheme();
});

describe("ThemeCard", () => {
  it("starts in Midnight on a device that picked none", () => {
    startTheme();
    renderWithProviders(<ThemeCard />);
    expect(screen.getAllByRole("radio")).toHaveLength(9);
    expect(screen.getByRole("radio", { name: /^Midnight/ })).toBeChecked();
  });

  it("shows the theme picked at once and keeps it on this device, asking the server nothing", async () => {
    startTheme();
    const requests = mockApi({});
    renderWithProviders(<ThemeCard />);

    await userEvent.click(screen.getByRole("radio", { name: /^Starlight/ }));
    expect(document.documentElement.dataset.theme).toBe("starlight");
    expect(screen.getByRole("radio", { name: /^Starlight/ })).toBeChecked();
    expect(localStorage.getItem(THEME_KEY)).toBe("starlight");
    expect(requests).toEqual([]);
  });

  it("shows this device's last pick when it comes back", () => {
    localStorage.setItem(THEME_KEY, "twilight");
    startTheme();
    renderWithProviders(<ThemeCard />);
    expect(document.documentElement.dataset.theme).toBe("twilight");
    expect(screen.getByRole("radio", { name: /^Twilight/ })).toBeChecked();
  });
});
