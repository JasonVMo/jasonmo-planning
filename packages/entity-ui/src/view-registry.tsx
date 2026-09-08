import type {
  CardViewModel,
  FullViewModel,
  LabelViewModel,
  TileViewModel,
  ViewType,
  EventViewModel,
  TripViewModel,
  FlightViewModel,
  CalendarMonthViewModel,
  CalendarDayViewModel,
  TimelineViewModel,
} from "@planning/entity-model";
import type { ComponentType } from "react";
import { CardView } from "./views/CardView.tsx";
import { FullView } from "./views/FullView.tsx";
import { LabelView } from "./views/LabelView.tsx";
import { TileView } from "./views/TileView.tsx";
import { EventView } from "./views/EventView.tsx";
import { TripView } from "./views/TripView.tsx";
import { FlightView } from "./views/FlightView.tsx";
import { CalendarMonthView } from "./views/CalendarMonthView.tsx";
import { CalendarDayView } from "./views/CalendarDayView.tsx";
import { TimelineView } from "./views/TimelineView.tsx";

export interface ViewModelMap {
  label: LabelViewModel;
  tile: TileViewModel;
  card: CardViewModel;
  full: FullViewModel;
  event: EventViewModel;
  trip: TripViewModel;
  flight: FlightViewModel;
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
  trip: TripView,
  flight: FlightView,
  "calendar-month": CalendarMonthView,
  "calendar-day": CalendarDayView,
  timeline: TimelineView,
} satisfies ViewRendererRegistry;
