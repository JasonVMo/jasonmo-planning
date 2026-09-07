import {
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
} from "@fluentui/react-components";
import { TrackerProvider } from "@tracker/entity-ui";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { parseSiteManifest } from "./manifest.ts";
import type { SiteManifest } from "@tracker/entity-model";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; manifest: SiteManifest }
  | { status: "error"; message: string };

async function loadManifest(signal: AbortSignal): Promise<SiteManifest> {
  const response = await fetch("./manifest.json", {
    signal,
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`manifest.json returned HTTP ${response.status}`);
  const value: unknown = await response.json();
  return parseSiteManifest(value);
}

function Bootstrap() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    loadManifest(controller.signal).then(
      (manifest) => setState({ status: "ready", manifest }),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown manifest loading failure",
          });
        }
      },
    );
    return () => controller.abort();
  }, [attempt]);

  if (state.status === "ready") return <App manifest={state.manifest} />;
  return (
    <TrackerProvider className="bootstrap-provider">
      <main className="bootstrap-state">
        {state.status === "loading" ? (
          <>
            <Spinner size="large" label="Loading research tracker" />
            <p>Loading the audience-safe research manifest…</p>
          </>
        ) : (
          <MessageBar intent="error" role="alert">
            <MessageBarBody>
              <MessageBarTitle>Tracker could not load</MessageBarTitle>
              <p>{state.message}</p>
              <Button
                appearance="primary"
                onClick={() => {
                  setState({ status: "loading" });
                  setAttempt((value) => value + 1);
                }}
              >
                Try again
              </Button>
            </MessageBarBody>
          </MessageBar>
        )}
      </main>
    </TrackerProvider>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Site template is missing #root");

createRoot(root).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
