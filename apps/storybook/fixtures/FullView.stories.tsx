import type { Meta, StoryObj } from "@storybook/react-vite";
import { EntityRenderer, FullView } from "@tracker/entity-ui";
import { ForcedColorsFrame, StoryWidth } from "./StoryWidth.tsx";
import { longEntity, markdownEntity, syntheticStatusEntity } from "./entities.ts";

const meta = {
  title: "Entity views/Full",
  component: FullView,
  parameters: { layout: "centered" },
  args: markdownEntity.viewModels.full,
} satisfies Meta<typeof FullView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  render: (args) => (
    <StoryWidth>
      <FullView {...args} />
    </StoryWidth>
  ),
};
export const Dark: Story = {
  globals: { theme: "dark" },
  render: (args) => (
    <StoryWidth>
      <FullView {...args} />
    </StoryWidth>
  ),
};
export const Narrow: Story = {
  render: (args) => (
    <StoryWidth width="19rem">
      <FullView {...args} />
    </StoryWidth>
  ),
};
export const Long: Story = {
  args: longEntity.viewModels.full,
  render: (args) => (
    <StoryWidth width="52rem">
      <FullView {...args} />
    </StoryWidth>
  ),
};
export const State: Story = {
  name: "State: missing incompatible model",
  render: () => (
    <StoryWidth>
      <EntityRenderer entity={syntheticStatusEntity} viewType="full" />
    </StoryWidth>
  ),
};
export const ForcedColors: Story = {
  render: (args) => (
    <ForcedColorsFrame>
      <FullView {...args} />
    </ForcedColorsFrame>
  ),
};
