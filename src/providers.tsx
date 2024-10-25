// src/providers.tsx
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

type ThemeProviderProps = {
  children: ReactNode;
  attribute?: string | undefined;
  defaultTheme?: string | undefined;
  enableSystem?: boolean | undefined;
  disableTransitionOnChange?: boolean | undefined;
  storageKey?: string | undefined;
  nonce?: string | undefined;
  forcedTheme?: string | undefined;
  themes?: string[] | undefined;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = true,
  themes = ["light", "dark", "system"],
  ...props
}: ThemeProviderProps) {
  return (
    // @ts-ignore
    <NextThemesProvider
      {...props}
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      attribute={attribute}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      themes={themes}
    >
      {children}
    </NextThemesProvider>
  );
}