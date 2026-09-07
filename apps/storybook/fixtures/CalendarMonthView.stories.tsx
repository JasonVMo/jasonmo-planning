import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { CalendarMonthView } from "@tracker/entity-ui";
import { calendarModel } from "./calendar.ts";
import { StoryWidth } from "./StoryWidth.tsx";

const meta = {
  title: "Entity views/Calendar month",
  component: CalendarMonthView,
  parameters: { layout: "fullscreen" },
  args: calendarModel,
  render: (args) => (
    <StoryWidth width="72rem">
      <CalendarMonthView {...args} />
    </StoryWidth>
  ),
} satisfies Meta<typeof CalendarMonthView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("link", { name: "Monday, September 7, 2026, 6 events" }),
    ).toHaveAttribute("href", "#/calendar/day/2026-09-07?timeZone=America%2FLos_Angeles");
    await expect(canvas.getByRole("link", { name: "+3 more" })).toBeVisible();
  },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Narrow: Story = {
  render: (args) => (
    <StoryWidth width="20rem">
      <CalendarMonthView {...args} />
    </StoryWidth>
  ),
};
export const Empty: Story = { args: { events: [] } };
export const LeapFebruary: Story = { args: { date: "2028-02-29", title: "February 2028" } };
