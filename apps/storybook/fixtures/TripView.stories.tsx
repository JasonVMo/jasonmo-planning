import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within, userEvent } from "storybook/test";
import { EntityRenderer, TripView } from "@planning/entity-ui";
import { multiTrip, singleTrip, travelEntity } from "./travel.ts";
import { StoryWidth } from "./StoryWidth.tsx";

const meta = {
  title: "Entity views/Trip",
  component: TripView,
  args: singleTrip,
  render: (args) => (
    <StoryWidth width="48rem">
      <TripView {...args} />
    </StoryWidth>
  ),
} satisfies Meta<typeof TripView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SingleSegment: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: singleTrip.title, level: 1 })).toBeVisible();
    const link = canvas.getByRole("link", { name: "Hikes & Walks" });
    await expect(link).toHaveAttribute("href", "#/entities/synthetic-walks");
    canvas.getByRole("link", { name: singleTrip.title }).focus();
    await userEvent.tab();
    await expect(link).toHaveFocus();
  },
};
export const MultiSegment: Story = { args: multiTrip };
export const Segment: Story = { args: { kind: "segment" } };
export const Active: Story = { args: { status: "active" } };
export const Completed: Story = { args: { status: "completed" } };
export const Cancelled: Story = { args: { status: "cancelled" } };
export const Empty: Story = { args: { children: [], body: "" } };
export const Dark: Story = { args: multiTrip, globals: { theme: "dark" } };
export const Narrow: Story = {
  args: multiTrip,
  render: (args) => (
    <StoryWidth width="19rem">
      <TripView {...args} />
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
      <EntityRenderer entity={travelEntity(singleTrip)} context="collection" />
    </StoryWidth>
  ),
};
export const NarrowDark: Story = { ...Narrow, globals: { theme: "dark" } };
export const LongText: Story = {
  ...Narrow,
  args: {
    ...multiTrip,
    title:
      "A deliberately long synthetic trip title with an extended itinerary and several different destinations",
    destination:
      "A coastal destination with a very long public-safe place name and a remote trailhead",
  },
};
