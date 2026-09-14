import type { ActivityKind } from "@planning/entity-model";
import { createElement } from "react";
import type { CSSProperties, ReactElement } from "react";

/**
 * Styling properties for activity entries
 */
export type ActivityDataEntry = {
  /**
   * Resolved span for the activity icon using google material symbols that can be set into the <CardHeader> image prop.
   */
  headerIcon: ReactElement | null;

  /**
   * Background style for the activity header that can be set into the <CardHeader> style prop.
   */
  headerBgStyle: CSSProperties;
};

function materialSymbol(name: string): ReactElement {
  return createElement(
    "span",
    {
      "aria-hidden": true,
      className: "material-symbols-rounded tracker-activity-header__icon",
    },
    name,
  );
}

function darkGradient(start: string, end: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(135deg, ${start}, ${end})`,
  };
}

const activityStyles: Record<ActivityKind, ActivityDataEntry> = {
  event: {
    headerIcon: materialSymbol("event"),
    headerBgStyle: darkGradient("#7a3517", "#351307"),
  },
  appointment: {
    headerIcon: materialSymbol("event_available"),
    headerBgStyle: darkGradient("#175b62", "#082d35"),
  },
  deadline: {
    headerIcon: materialSymbol("event_busy"),
    headerBgStyle: darkGradient("#762433", "#330c17"),
  },
  reminder: {
    headerIcon: materialSymbol("notifications"),
    headerBgStyle: darkGradient("#6b4a00", "#2c1d00"),
  },
  trip: {
    headerIcon: materialSymbol("travel_explore"),
    headerBgStyle: darkGradient("#315345", "#122a22"),
  },
  segment: {
    headerIcon: null,
    headerBgStyle: darkGradient("#3e5266", "#172838"),
  },
  flight: {
    headerIcon: materialSymbol("flight"),
    headerBgStyle: darkGradient("#123f73", "#061a33"),
  },
  lodging: {
    headerIcon: materialSymbol("hotel"),
    headerBgStyle: darkGradient("#176b51", "#06392c"),
  },
  "rental-car": {
    headerIcon: materialSymbol("directions_car"),
    headerBgStyle: darkGradient("#623c88", "#2d1748"),
  },
  ticket: {
    headerIcon: materialSymbol("confirmation_number"),
    headerBgStyle: darkGradient("#394789", "#171c4a"),
  },
  tour: {
    headerIcon: materialSymbol("tour"),
    headerBgStyle: darkGradient("#0f5b65", "#062d36"),
  },
  transit: {
    headerIcon: materialSymbol("directions_transit"),
    headerBgStyle: darkGradient("#3d5368", "#172838"),
  },
};

export function getHeaderIcon(kind: ActivityKind): ReactElement | null {
  return activityStyles[kind].headerIcon;
}

export function getHeaderBgStyle(
  kind: ActivityKind,
  backgroundImage?: CSSProperties["backgroundImage"],
): CSSProperties {
  if (!backgroundImage) return activityStyles[kind].headerBgStyle;
  return {
    backgroundImage: `linear-gradient(90deg, rgb(0 0 0 / 28%) 0%, rgb(0 0 0 / 18%) 62%, rgb(0 0 0 / 0%) 100%), ${backgroundImage}`,
    backgroundBlendMode: "multiply",
  };
}
