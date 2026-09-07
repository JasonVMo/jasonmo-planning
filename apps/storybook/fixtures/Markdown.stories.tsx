import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { SafeMarkdown } from "@planning/entity-ui";
import embeddedMarkdown from "./markdown/example.md?raw";
import { StoryWidth } from "./StoryWidth.tsx";

const meta = {
  title: "Content/Markdown embeds",
  component: SafeMarkdown,
  args: { children: embeddedMarkdown },
  render: (args) => (
    <StoryWidth>
      <SafeMarkdown {...args} />
    </StoryWidth>
  ),
} satisfies Meta<typeof SafeMarkdown>;
export default meta;
type Story = StoryObj<typeof meta>;

export const File: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Embedded Markdown example", level: 2 }),
    ).toBeVisible();
    await expect(canvas.getByRole("table")).toBeVisible();
    await expect(canvas.getByRole("checkbox", { name: "Completed task" })).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Incomplete task" })).toBeDisabled();
    await expect(canvas.getByRole("link", { name: "external source" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  },
};
export const String: Story = {
  args: {
    children:
      "## From a source string\n\n**Bold**, *emphasis*, ~~revision~~, and `code`.\n\n- First item\n- Second item",
  },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Narrow: Story = {
  render: (args) => (
    <StoryWidth width="19rem">
      <SafeMarkdown {...args} />
    </StoryWidth>
  ),
  play: async ({ canvasElement }) => {
    const code = within(canvasElement).getByRole("region", { name: "Code block" });
    code.focus();
    await expect(code).toHaveFocus();
  },
};
export const NonExecutable: Story = {
  args: {
    children: `## Safe content

<script>window.unsafeMarkdown = true</script>

[unsafe](javascript:alert(1))

[credentialed](https://user:password@example.com)

[relative](../private.md)

![No remote image](https://example.com/image.png)

[safe source](https://example.com)`,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("link", { name: "unsafe" })).toBeNull();
    await expect(canvas.queryByRole("link", { name: "credentialed" })).toBeNull();
    await expect(canvas.queryByRole("link", { name: "relative" })).toBeNull();
    await expect(canvasElement.querySelector("script, img")).toBeNull();
    await expect(canvas.getByText("[Image omitted: No remote image]")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "safe source" })).toBeVisible();
  },
};
