import { Link, Text } from "@fluentui/react-components";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

const allowedProtocols = new Set(["http:", "https:", "mailto:"]);

export function safeMarkdownUrl(url: string): string {
  const value = url.trim();
  if (!/^[A-Za-z][A-Za-z\d+.-]*:/.test(value)) {
    return defaultUrlTransform(value);
  }
  try {
    const parsed = new URL(value);
    return allowedProtocols.has(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
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
          img: ({ alt }) => (
            <Text as="span" italic className="tracker-markdown__image-note">
              {alt ? `[Image omitted: ${alt}]` : "[Image omitted]"}
            </Text>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
