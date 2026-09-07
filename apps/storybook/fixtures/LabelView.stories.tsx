import type { Meta, StoryObj } from "@storybook/react-vite";
import { EntityRenderer, LabelView } from "@tracker/entity-ui";
import { ForcedColorsFrame, StoryWidth } from "./StoryWidth.tsx";
import { longEntity, markdownEntity, syntheticStatusEntity } from "./entities.ts";

const meta = {
  title: "Entity views/Label",
  component: LabelView,
  parameters: { layout: "centered" },
  args: markdownEntity.viewModels.label,
} satisfies Meta<typeof LabelView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
export const Narrow: Story = {
  render: (args) => (
    <StoryWidth width="12rem">
      <LabelView {...args} />
    </StoryWidth>
  ),
};
export const Long: Story = {
  args: longEntity.viewModels.label,
  render: (args) => (
    <StoryWidth width="18rem">
      <LabelView {...args} />
    </StoryWidth>
  ),
};
export const State: Story = {
  name: "State: shared by another data type",
  render: () => <EntityRenderer entity={syntheticStatusEntity} viewType="label" />,
};
export const ForcedColors: Story = {
  render: (args) => (
    <ForcedColorsFrame>
      <LabelView {...args} />
    </ForcedColorsFrame>
  ),
};
