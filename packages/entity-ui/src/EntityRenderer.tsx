import type { RenderContext, SiteEntity, ViewType } from "@tracker/entity-model";
import { MessageBar, MessageBarBody, MessageBarTitle } from "@fluentui/react-components";
import { viewRegistry } from "./view-registry.tsx";

export interface EntityRendererProps {
  entity: SiteEntity;
  viewType?: ViewType;
  context?: RenderContext;
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

export function EntityRenderer({ entity, viewType, context }: EntityRendererProps) {
  const selectedType =
    viewType ?? (context === undefined ? entity.view.defaultType : entity.view.byContext[context]);

  switch (selectedType) {
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
