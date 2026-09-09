import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { EntityRenderer, EventView } from "@planning/entity-ui";
import { appointment, appointmentEntity } from "./calendar.ts";
import { StoryWidth } from "./StoryWidth.tsx";

const meta = {
  title: "Entity views/Event",
  component: EventView,
  args: appointment,
  render: (args) => (
    <StoryWidth width="48rem">
      <EventView {...args} />
    </StoryWidth>
  ),
} satisfies Meta<typeof EventView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Appointment: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
export const Narrow: Story = {
  render: (args) => (
    <StoryWidth width="19rem">
      <EventView {...args} />
    </StoryWidth>
  ),
};
export const AllDay: Story = {
  args: {
    kind: "event",
    schedule: { allDay: true, startDate: "2026-09-07", endDate: "2026-09-09" },
  },
};
export const Cancelled: Story = { args: { status: "cancelled" } };
export const Long: Story = {
  args: {
    title:
      "An intentionally long appointment title that must wrap cleanly on a narrow screen without losing the event details or navigation",
    location:
      "A synthetic location with a deliberately long room name and detailed wayfinding notes",
  },
};
export const CompactCollection: Story = {
  render: () => (
    <StoryWidth width="24rem">
      <EntityRenderer entity={appointmentEntity} context="collection" />
    </StoryWidth>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: appointment.title })).toBeVisible();
    await expect(canvasElement.querySelector(".fui-Card")).not.toBeNull();
  },
};
export const DifferentDataType: Story = {
  render: () => (
    <EntityRenderer
      entity={{ ...appointmentEntity, dataType: "synthetic-milestone" }}
      context="detail"
    />
  ),
};
