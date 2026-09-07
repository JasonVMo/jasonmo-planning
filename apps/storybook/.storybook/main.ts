import type { StorybookConfig } from "@storybook/react-vite";
import { createRequire } from "node:module";
import { dirname } from "node:path";

const require = createRequire(import.meta.url);
const packageDirectory = (name: string) => dirname(require.resolve(`${name}/package.json`));

const config: StorybookConfig = {
  framework: {
    name: packageDirectory("@storybook/react-vite"),
    options: {},
  },
  stories: ["../fixtures/**/*.stories.@(ts|tsx)"],
  addons: [packageDirectory("@storybook/addon-a11y"), packageDirectory("@storybook/addon-vitest")],
  core: {
    disableTelemetry: true,
  },
};

export default config;
