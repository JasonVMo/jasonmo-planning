import type { Meta, StoryObj } from "@storybook/react-vite";
import { EntityRenderer, TileView } from "@tracker/entity-ui";
import { ForcedColorsFrame, StoryWidth } from "./StoryWidth.tsx";
import { longEntity, markdownEntity, syntheticStatusEntity } from "./entities.ts";

const meta = {
  title: "Entity views/Tile",
  component: TileView,
  parameters: { layout: "centered" },
  args: markdownEntity.viewModels.tile,
} satisfies Meta<typeof TileView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  render: (args) => (
    <StoryWidth>
      <TileView {...args} />
    </StoryWidth>
  ),
};
export const Dark: Story = {
  globals: { theme: "dark" },
  render: (args) => (
    <StoryWidth>
      <TileView {...args} />
    </StoryWidth>
  ),
};
export const Narrow: Story = {
  render: (args) => (
    <StoryWidth width="15rem">
      <TileView {...args} />
    </StoryWidth>
  ),
};
export const Long: Story = {
  args: longEntity.viewModels.tile,
  render: (args) => (
    <StoryWidth width="24rem">
      <TileView {...args} />
    </StoryWidth>
  ),
};
export const State: Story = {
  name: "State: shared by another data type",
  render: () => (
    <StoryWidth>
      <EntityRenderer entity={syntheticStatusEntity} viewType="tile" />
    </StoryWidth>
  ),
};
export const ForcedColors: Story = {
  render: (args) => (
    <ForcedColorsFrame>
      <TileView {...args} />
    </ForcedColorsFrame>
  ),
};
