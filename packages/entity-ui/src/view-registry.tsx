import type {
  CardViewModel,
  FullViewModel,
  LabelViewModel,
  TileViewModel,
  ViewType,
  EventViewModel,
  CalendarMonthViewModel,
  CalendarDayViewModel,
  TimelineViewModel,
} from "@tracker/entity-model";
import type { ComponentType } from "react";
import { CardView } from "./views/CardView.tsx";
import { FullView } from "./views/FullView.tsx";
import { LabelView } from "./views/LabelView.tsx";
import { TileView } from "./views/TileView.tsx";
import { EventView } from "./views/EventView.tsx";
import { CalendarMonthView } from "./views/CalendarMonthView.tsx";
import { CalendarDayView } from "./views/CalendarDayView.tsx";
import { TimelineView } from "./views/TimelineView.tsx";

export interface ViewModelMap {
  label: LabelViewModel;
  tile: TileViewModel;
  card: CardViewModel;
  full: FullViewModel;
  event: EventViewModel;
  "calendar-month": CalendarMonthViewModel;
  "calendar-day": CalendarDayViewModel;
  timeline: TimelineViewModel;
}

export type ViewRendererRegistry = {
  [View in ViewType]: ComponentType<ViewModelMap[View]>;
};

export const viewRegistry = {
  label: LabelView,
  tile: TileView,
  card: CardView,
  full: FullView,
  event: EventView,
  "calendar-month": CalendarMonthView,
  "calendar-day": CalendarDayView,
  timeline: TimelineView,
} satisfies ViewRendererRegistry;
