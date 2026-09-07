import {
  FluentProvider,
  teamsDarkTheme,
  teamsLightTheme,
  type FluentProviderProps,
  type Theme,
} from "@fluentui/react-components";
import type { ReactNode } from "react";

export type TrackerThemeMode = "light" | "dark";

const trackerLightTheme: Theme = {
  ...teamsLightTheme,
  colorBrandBackground: "#315ca8",
  colorBrandBackgroundHover: "#274d91",
  colorBrandForeground1: "#315ca8",
  colorNeutralBackground1: "#fbfcff",
  colorNeutralBackground2: "#f3f6fb",
};

const trackerDarkTheme: Theme = {
  ...teamsDarkTheme,
  colorBrandBackground: "#79a7ff",
  colorBrandBackgroundHover: "#9bbdff",
  colorBrandForeground1: "#9bbdff",
  colorNeutralBackground1: "#111827",
  colorNeutralBackground2: "#172033",
};

export interface TrackerProviderProps {
  children: ReactNode;
  mode?: TrackerThemeMode;
  className?: string;
  style?: FluentProviderProps["style"];
}

export function TrackerProvider({
  children,
  mode = "light",
  className,
  style,
}: TrackerProviderProps) {
  return (
    <FluentProvider
      theme={mode === "dark" ? trackerDarkTheme : trackerLightTheme}
      className={className}
      style={style}
    >
      {children}
    </FluentProvider>
  );
}
