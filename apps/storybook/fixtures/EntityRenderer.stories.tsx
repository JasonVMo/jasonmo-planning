import type { Meta, StoryObj } from "@storybook/react-vite";
import { EntityRenderer } from "@tracker/entity-ui";
import { StoryWidth } from "./StoryWidth.tsx";
import { markdownEntity } from "./entities.ts";

const meta = {
  title: "Entity views/Registry selection",
  component: EntityRenderer,
  parameters: { layout: "centered" },
  args: {
    entity: markdownEntity,
  },
} satisfies Meta<typeof EntityRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EntityDefault: Story = {
  render: (args) => (
    <StoryWidth>
      <EntityRenderer {...args} />
    </StoryWidth>
  ),
};

export const NavigationContext: Story = {
  args: { context: "navigation" },
};

export const CollectionContext: Story = {
  args: { context: "collection" },
  render: (args) => (
    <StoryWidth>
      <EntityRenderer {...args} />
    </StoryWidth>
  ),
};

export const ExplicitOccurrenceOverride: Story = {
  args: { context: "relationship", viewType: "label" },
};
