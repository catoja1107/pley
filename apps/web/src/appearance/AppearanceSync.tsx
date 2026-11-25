import { useEffect } from "react";
import { useMe } from "@/api/hooks";
import { setLook } from ".";

/**
 * Shows the signed-in account's theme and accent. Until the account is
 * heard, signed out, and on a server that keeps none, the look of the last
 * visit stays. Reads the account from the cache without asking for it.
 */
export function AppearanceSync() {
  const me = useMe(false);
  const theme = me.data?.theme;
  const accent = me.data?.accent;

  useEffect(() => {
    if (theme !== undefined) setLook(theme, accent);
  }, [theme, accent]);

  return null;
}
