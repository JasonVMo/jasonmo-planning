import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { CalendarDayView } from "@tracker/entity-ui";
import { calendarModel } from "./calendar.ts";
import { StoryWidth } from "./StoryWidth.tsx";

const meta = {
  title: "Entity views/Calendar day",
  component: CalendarDayView,
  parameters: { layout: "fullscreen" },
  args: { ...calendarModel, title: "Day at a glance" },
  render: (args) => (
    <StoryWidth width="64rem">
      <CalendarDayView {...args} />
    </StoryWidth>
  ),
} satisfies Meta<typeof CalendarDayView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "Design review" })).toBeVisible();
    await expect(canvas.getAllByText("Overlaps another event")).toHaveLength(2);
    await expect(canvas.getByText("Continues from previous day")).toBeVisible();
  },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Narrow: Story = {
  render: (args) => (
    <StoryWidth width="20rem">
      <CalendarDayView {...args} />
    </StoryWidth>
  ),
};
export const Empty: Story = { args: { events: [] } };
export const DifferentTimeZone: Story = { args: { timeZone: "Asia/Tokyo" } };
