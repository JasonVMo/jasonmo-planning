import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { TimelineView } from "@planning/entity-ui";
import { calendarModel } from "./calendar.ts";
import { StoryWidth } from "./StoryWidth.tsx";

const meta = {
  title: "Entity views/Timeline",
  component: TimelineView,
  args: { ...calendarModel, title: "Around this day" },
  render: (args) => (
    <StoryWidth width="48rem">
      <TimelineView {...args} />
    </StoryWidth>
  ),
} satisfies Meta<typeof TimelineView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selected = canvas.getByRole("link", { name: "Monday, September 7, 2026, 6 events" });
    selected.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(
      canvas.getByRole("link", { name: "Tuesday, September 8, 2026, 1 event" }),
    ).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(
      canvas.getByRole("link", { name: "Friday, September 4, 2026, 0 events" }),
    ).toHaveFocus();
  },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Narrow: Story = {
  render: (args) => (
    <StoryWidth width="18rem">
      <TimelineView {...args} />
    </StoryWidth>
  ),
};
export const YearBoundary: Story = { args: { date: "2027-01-01", events: [] } };
