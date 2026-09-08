import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { EntityRenderer, FlightView } from "@planning/entity-ui";
import { connectingFlight, directFlight, travelEntity } from "./travel.ts";
import { StoryWidth } from "./StoryWidth.tsx";

const meta = {
  title: "Entity views/Flight",
  component: FlightView,
  args: directFlight,
  render: (args) => (
    <StoryWidth width="48rem">
      <FlightView {...args} />
    </StoryWidth>
  ),
} satisfies Meta<typeof FlightView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Direct: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("list", { name: "Flight legs" })).toBeVisible();
    await expect(canvas.getByText("America/Los_Angeles")).toBeVisible();
    await expect(canvas.getByText("America/New_York")).toBeVisible();
  },
};
export const Connecting: Story = {
  args: connectingFlight,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);
    await expect(canvas.getByText("Connection: 1h 30m before the next leg.")).toBeVisible();
  },
};
export const Delayed: Story = { args: { status: "delayed" } };
export const Cancelled: Story = { args: { status: "cancelled" } };
export const Completed: Story = { args: { status: "completed" } };
export const Dark: Story = { args: connectingFlight, globals: { theme: "dark" } };
export const Narrow: Story = {
  args: connectingFlight,
  render: (args) => (
    <StoryWidth width="19rem">
      <FlightView {...args} />
    </StoryWidth>
  ),
  play: async ({ canvasElement }) => {
    const article = canvasElement.querySelector("article")!;
    await expect(article.scrollWidth).toBeLessThanOrEqual(article.clientWidth);
  },
};
export const CompactDifferentDataType: Story = {
  render: () => (
    <StoryWidth width="24rem">
      <EntityRenderer entity={travelEntity(connectingFlight)} context="collection" />
    </StoryWidth>
  ),
};
export const NarrowDark: Story = { ...Narrow, globals: { theme: "dark" } };
export const Overnight: Story = {
  args: {
    legs: [
      {
        ...directFlight.legs[0],
        departAt: "2026-10-03T22:00:00-07:00",
        arriveAt: "2026-10-04T06:15:00-04:00",
      },
    ],
  },
};
