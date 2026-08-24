import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { Shell } from "@jasonmo/shell";
import { topics } from "./generated-topics.ts";

const root = document.querySelector("#root");

if (!root) {
  throw new Error("Missing root element");
}

createRoot(root).render(
  <FluentProvider theme={webLightTheme}>
    <Shell topics={topics} />
  </FluentProvider>,
);
