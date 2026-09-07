import { Link, Text } from "@fluentui/react-components";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isSafeMarkdownUrl } from "@tracker/entity-model";

export function safeMarkdownUrl(url: string): string {
  if (!isSafeMarkdownUrl(url)) return "";
  return url.startsWith("#") ? url : new URL(url).href;
}

function MarkdownLink({
  href,
  children,
}: ComponentPropsWithoutRef<"a"> & { children?: ReactNode }) {
  const safeHref = href === undefined ? "" : safeMarkdownUrl(href);
  if (!safeHref) return <span>{children}</span>;
  const external = safeHref.startsWith("http://") || safeHref.startsWith("https://");
  return (
    <Link
      href={safeHref}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {children}
    </Link>
  );
}

function MarkdownScrollRegion({ children, label }: { children: ReactNode; label: string }) {
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Read-only overflow needs a tab stop for keyboard scrolling.
    <section className="tracker-markdown__scroll" tabIndex={0} aria-label={label}>
      {children}
    </section>
  );
}

export function SafeMarkdown({ children }: { children: string }) {
  return (
    <div className="tracker-markdown">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        urlTransform={safeMarkdownUrl}
        components={{
          a: MarkdownLink,
          h1: ({ children: heading }) => <h2>{heading}</h2>,
          h2: ({ children: heading }) => <h2>{heading}</h2>,
          h3: ({ children: heading }) => <h3>{heading}</h3>,
          h4: ({ children: heading }) => <h4>{heading}</h4>,
          h5: ({ children: heading }) => <h5>{heading}</h5>,
          h6: ({ children: heading }) => <h6>{heading}</h6>,
          pre: ({ children: code }) => (
            <MarkdownScrollRegion label="Code block">
              <pre>{code}</pre>
            </MarkdownScrollRegion>
          ),
          table: ({ children: rows }) => (
            <MarkdownScrollRegion label="Markdown table">
              <table>{rows}</table>
            </MarkdownScrollRegion>
          ),
          img: ({ alt }) => (
            <Text as="span" italic className="tracker-markdown__image-note">
              {alt ? `[Image omitted: ${alt}]` : "[Image omitted]"}
            </Text>
          ),
          input: ({ checked }) => (
            <input
              type="checkbox"
              checked={Boolean(checked)}
              disabled
              aria-label={checked ? "Completed task" : "Incomplete task"}
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
