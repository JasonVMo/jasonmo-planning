import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ActivityCard } from "@planning/entity-ui";
import type { ActivityKind } from "@planning/entity-model";
import { StoryWidth } from "./StoryWidth.tsx";

const activities = [
  { kind: "event", title: "Park program", subtitle: "Event" },
  { kind: "appointment", title: "Planning call", subtitle: "Appointment" },
  { kind: "deadline", title: "Reservation window", subtitle: "Deadline" },
  { kind: "reminder", title: "Pack trail permit", subtitle: "Reminder" },
  { kind: "trip", title: "Sequoia & Kings Canyon", subtitle: "Trip" },
  { kind: "segment", title: "Acadia National Park", subtitle: "Trip segment" },
  { kind: "flight", title: "Seattle to Bangor", subtitle: "Flight" },
  { kind: "lodging", title: "Bar Harbor hotel", subtitle: "Lodging" },
  { kind: "rental-car", title: "Bangor rental car", subtitle: "Rental car" },
  { kind: "ticket", title: "Ferry reservation", subtitle: "Ticket" },
  { kind: "tour", title: "Island tour", subtitle: "Tour" },
  { kind: "transit", title: "Train to Hoboken", subtitle: "Transit" },
] satisfies ReadonlyArray<{
  kind: ActivityKind;
  title: string;
  subtitle: string;
}>;

const meta = {
  title: "Components/Activity Card",
  component: ActivityCard,
  args: {
    kind: "flight",
    title: "Seattle to Bangor",
    subtitle: "2-leg flight",
    href: "#/entities/synthetic-flight",
    children: "Compact scheduling details appear in the activity card body.",
  },
  render: (args) => (
    <StoryWidth width="26rem">
      <ActivityCard {...args} />
    </StoryWidth>
  ),
} satisfies Meta<typeof ActivityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flight: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-activity-kind="flight"]')).not.toBeNull();
    await expect(canvasElement.querySelector(".tracker-activity-header__icon")).not.toBeNull();
    const cardLink = canvasElement.querySelector(".tracker-activity-card__link");
    await expect(cardLink).toHaveAttribute("href", "#/entities/synthetic-flight");
    await expect(canvasElement.querySelector(".tracker-activity-header h3 a")).toBeNull();
  },
};

export const Lodging: Story = {
  args: {
    kind: "lodging",
    title: "Comfort Inn Ellsworth - Bar Harbor",
    subtitle: "Lodging",
  },
};

export const RentalCar: Story = {
  args: {
    kind: "rental-car",
    title: "Bangor rental car",
    subtitle: "Rental car",
  },
};

export const ImageBackground: Story = {
  args: {
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 800 300%27%3E%3Crect width=%27800%27 height=%27300%27 fill=%27%230b5a46%27/%3E%3Ccircle cx=%27640%27 cy=%27100%27 r=%27140%27 fill=%27%23228b6b%27/%3E%3C/svg%3E")',
  },
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('[data-has-background-image="true"]');
    await expect(header).not.toBeNull();
    await expect(getComputedStyle(header!).backgroundImage).toContain("linear-gradient");
  },
};

export const AllActivityKinds: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(19rem, 1fr))",
        gap: "1rem",
      }}
    >
      {activities.map((activity) => (
        <ActivityCard
          key={activity.kind}
          {...activity}
          href={`#/entities/synthetic-${activity.kind}`}
        >
          Compact scheduling details appear in the activity card body.
        </ActivityCard>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const activity of activities) {
      const header = canvasElement.querySelector(`[data-activity-kind="${activity.kind}"]`);
      await expect(header).not.toBeNull();
      const icon = header?.querySelector(".material-symbols-rounded");
      if (activity.kind === "segment") {
        await expect(icon).toBeNull();
      } else {
        await expect(icon).not.toBeNull();
      }
    }
  },
};
