import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardView, EntityRenderer } from "@tracker/entity-ui";
import { ForcedColorsFrame, StoryWidth } from "./StoryWidth.tsx";
import { longEntity, markdownEntity, syntheticStatusEntity } from "./entities.ts";

const meta = {
  title: "Entity views/Card",
  component: CardView,
  parameters: { layout: "centered" },
  args: markdownEntity.viewModels.card,
} satisfies Meta<typeof CardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  render: (args) => (
    <StoryWidth>
      <CardView {...args} />
    </StoryWidth>
  ),
};
export const Dark: Story = {
  globals: { theme: "dark" },
  render: (args) => (
    <StoryWidth>
      <CardView {...args} />
    </StoryWidth>
  ),
};
export const Narrow: Story = {
  render: (args) => (
    <StoryWidth width="16rem">
      <CardView {...args} />
    </StoryWidth>
  ),
};
export const Long: Story = {
  args: longEntity.viewModels.card,
  render: (args) => (
    <StoryWidth width="28rem">
      <CardView {...args} />
    </StoryWidth>
  ),
};
export const State: Story = {
  name: "State: blocked synthetic data type",
  render: () => (
    <StoryWidth>
      <EntityRenderer entity={syntheticStatusEntity} viewType="card" />
    </StoryWidth>
  ),
};
export const ForcedColors: Story = {
  render: (args) => (
    <ForcedColorsFrame>
      <CardView {...args} />
    </ForcedColorsFrame>
  ),
};
