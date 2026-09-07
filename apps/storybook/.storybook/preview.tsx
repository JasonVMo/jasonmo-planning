import type { Preview } from "@storybook/react-vite";
import { TrackerProvider } from "@planning/entity-ui";
import "../fixtures/storybook.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Tracker theme",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  parameters: {
    a11y: {
      test: "error",
    },
    backgrounds: {
      disable: true,
    },
    controls: {
      expanded: true,
    },
  },
  decorators: [
    (Story, context) => (
      <TrackerProvider
        mode={context.globals["theme"] === "dark" ? "dark" : "light"}
        className="story-provider"
      >
        <div className="story-canvas">
          <Story />
        </div>
      </TrackerProvider>
    ),
  ],
};

export default preview;
