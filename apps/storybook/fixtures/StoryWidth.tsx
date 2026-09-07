import type { ReactNode } from "react";

export function StoryWidth({ children, width = "44rem" }: { children: ReactNode; width?: string }) {
  return <div style={{ width, maxWidth: "100%" }}>{children}</div>;
}

export function ForcedColorsFrame({ children }: { children: ReactNode }) {
  return (
    <div className="story-forced-colors">
      <StoryWidth>{children}</StoryWidth>
    </div>
  );
}
