import type {
  CardViewModel,
  FullViewModel,
  LabelViewModel,
  TileViewModel,
  ViewType,
} from "@tracker/entity-model";
import type { ComponentType } from "react";
import { CardView } from "./views/CardView.tsx";
import { FullView } from "./views/FullView.tsx";
import { LabelView } from "./views/LabelView.tsx";
import { TileView } from "./views/TileView.tsx";

export interface ViewModelMap {
  label: LabelViewModel;
  tile: TileViewModel;
  card: CardViewModel;
  full: FullViewModel;
}

export type ViewRendererRegistry = {
  [View in ViewType]: ComponentType<ViewModelMap[View]>;
};

export const viewRegistry = {
  label: LabelView,
  tile: TileView,
  card: CardView,
  full: FullView,
} satisfies ViewRendererRegistry;
