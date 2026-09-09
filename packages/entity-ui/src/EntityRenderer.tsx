import type { RenderContext, SiteEntity, ViewType } from "@planning/entity-model";
import { MessageBar, MessageBarBody, MessageBarTitle } from "@fluentui/react-components";
import { viewRegistry } from "./view-registry.tsx";

export interface EntityRendererProps {
  entity: SiteEntity;
  viewType?: ViewType;
  context?: RenderContext;
  showTripChildren?: boolean;
}

function MissingViewModel({ entity, viewType }: { entity: SiteEntity; viewType: ViewType }) {
  return (
    <MessageBar intent="error" role="alert" data-testid="missing-view-model">
      <MessageBarBody>
        <MessageBarTitle>View unavailable</MessageBarTitle>
        Entity “{entity.title}” does not include the required {viewType} view model.
      </MessageBarBody>
    </MessageBar>
  );
}

export function EntityRenderer({
  entity,
  viewType,
  context,
  showTripChildren = true,
}: EntityRendererProps) {
  const selectedType =
    viewType ?? (context === undefined ? entity.view.defaultType : entity.view.byContext[context]);

  switch (selectedType) {
    case "trip": {
      const model = entity.viewModels.trip;
      return model ? (
        <viewRegistry.trip
          {...model}
          compact={context !== undefined && context !== "detail"}
          showChildren={showTripChildren}
        />
      ) : (
        <MissingViewModel entity={entity} viewType={selectedType} />
      );
    }
    case "flight": {
      const model = entity.viewModels.flight;
      return model ? (
        <viewRegistry.flight {...model} compact={context !== undefined && context !== "detail"} />
      ) : (
        <MissingViewModel entity={entity} viewType={selectedType} />
      );
    }
    case "event": {
      const model = entity.viewModels.event;
      return model ? (
        <viewRegistry.event {...model} compact={context !== undefined && context !== "detail"} />
      ) : (
        <MissingViewModel entity={entity} viewType={selectedType} />
      );
    }
    case "calendar-month": {
      const model = entity.viewModels["calendar-month"];
      const Renderer = viewRegistry["calendar-month"];
      return model ? (
        <Renderer {...model} />
      ) : (
        <MissingViewModel entity={entity} viewType={selectedType} />
      );
    }
    case "calendar-day": {
      const model = entity.viewModels["calendar-day"];
      const Renderer = viewRegistry["calendar-day"];
      return model ? (
        <Renderer {...model} />
      ) : (
        <MissingViewModel entity={entity} viewType={selectedType} />
      );
    }
    case "timeline": {
      const model = entity.viewModels.timeline;
      return model ? (
        <viewRegistry.timeline {...model} />
      ) : (
        <MissingViewModel entity={entity} viewType={selectedType} />
      );
    }
    case "label": {
      const model = entity.viewModels.label;
      return model ? (
        <viewRegistry.label {...model} />
      ) : (
        <MissingViewModel entity={entity} viewType={selectedType} />
      );
    }
    case "tile": {
      const model = entity.viewModels.tile;
      return model ? (
        <viewRegistry.tile {...model} />
      ) : (
        <MissingViewModel entity={entity} viewType={selectedType} />
      );
    }
    case "card": {
      const model = entity.viewModels.card;
      return model ? (
        <viewRegistry.card {...model} />
      ) : (
        <MissingViewModel entity={entity} viewType={selectedType} />
      );
    }
    case "full": {
      const model = entity.viewModels.full;
      return model ? (
        <viewRegistry.full {...model} />
      ) : (
        <MissingViewModel entity={entity} viewType={selectedType} />
      );
    }
  }
}
