import { isCalendarDate, type SiteManifest, type TopicView } from "@tracker/entity-model";
import {
  EntityRenderer,
  formatCalendarDate,
  TrackerProvider,
  type TrackerThemeMode,
} from "@tracker/entity-ui";
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Divider,
  Input,
  Link as FluentLink,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text,
  Title2,
  Title3,
} from "@fluentui/react-components";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  HashRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { Freshness } from "./freshness.tsx";
import { CalendarPage } from "./CalendarPage.tsx";
import { createSearch, searchDocuments } from "./search.ts";
import "./styles/site.css";

interface AppProps {
  manifest: SiteManifest;
}

function routeTitle(pathname: string, manifest: SiteManifest): string {
  if (pathname === "/") return "Research dashboard";
  if (pathname === "/search") return "Search";
  if (pathname === "/calendar" || pathname.startsWith("/calendar/")) {
    const match = /^\/calendar\/(month|day)\/([^/]+)$/.exec(pathname);
    if (match && isCalendarDate(match[2])) {
      return `${formatCalendarDate(match[2], match[1] === "month" ? { month: "long", year: "numeric" } : undefined)} · Calendar`;
    }
    return "Calendar";
  }
  const entityMatch = /^\/entities\/([^/]+)$/.exec(pathname);
  if (entityMatch?.[1]) {
    return (
      manifest.entities.find((entity) => entity.id === entityMatch[1])?.title ?? "Entity not found"
    );
  }
  const topicMatch = /^\/topics\/([^/]+)$/.exec(pathname);
  if (topicMatch?.[1]) {
    return (
      manifest.taxonomy.find((topic) => topic.id === topicMatch[1])?.title ?? "Topic not found"
    );
  }
  return "Page not found";
}

function NavItems({ manifest, onNavigate }: { manifest: SiteManifest; onNavigate?: () => void }) {
  return (
    <>
      <Link className="nav-link nav-link--home" to="/" onClick={onNavigate}>
        <span aria-hidden="true">⌂</span> Dashboard
      </Link>
      <Link className="nav-link" to="/search" onClick={onNavigate}>
        <span aria-hidden="true">⌕</span> Search
      </Link>
      <Link className="nav-link" to="/calendar" onClick={onNavigate}>
        Calendar
      </Link>
      <p className="nav-heading">Topics</p>
      {manifest.taxonomy.map((topic) => (
        <Link className="nav-link" key={topic.id} to={`/topics/${topic.id}`} onClick={onNavigate}>
          {topic.title}
        </Link>
      ))}
    </>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  };
  return (
    <search className="shell-search">
      <form onSubmit={submit}>
        <Input
          aria-label="Search research"
          value={value}
          onChange={(_, data) => setValue(data.value)}
          placeholder="Search research"
        />
        <Button type="submit" appearance="primary">
          Search
        </Button>
      </form>
    </search>
  );
}

function Shell({
  manifest,
  mode,
  setMode,
  children,
}: AppProps & {
  mode: TrackerThemeMode;
  setMode: (mode: TrackerThemeMode) => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  const announcer = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const title = routeTitle(location.pathname, manifest);
    document.title = `${title} · Tracker`;
    if (announcer.current) announcer.current.textContent = `${title} loaded`;
  }, [location.pathname, location.search, manifest]);

  useEffect(() => {
    main.current?.focus();
  }, [location.pathname, manifest]);

  const closeMobile = () => {
    setMobileOpen(false);
    requestAnimationFrame(() => menuButton.current?.focus());
  };

  return (
    <div className="site-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to main content
      </a>
      <header className="topbar">
        <button
          ref={menuButton}
          className="mobile-menu-button"
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          Menu
        </button>
        <Link className="wordmark" to="/" aria-label="Tracker dashboard">
          <span className="wordmark__mark" aria-hidden="true">
            T
          </span>
          <span>Tracker</span>
        </Link>
        <SearchBox />
        <Button
          appearance="subtle"
          aria-label={`Use ${mode === "light" ? "dark" : "light"} theme`}
          onClick={() => setMode(mode === "light" ? "dark" : "light")}
        >
          {mode === "light" ? "Dark" : "Light"}
        </Button>
      </header>
      <aside className="sidebar">
        <nav aria-label="Primary navigation">
          <NavItems manifest={manifest} />
        </nav>
        <div className="sidebar__footer">
          <Text size={200}>Content {manifest.contentDigest.slice(0, 10)}</Text>
        </div>
      </aside>
      <Dialog
        open={mobileOpen}
        onOpenChange={(_, data) => {
          if (!data.open) closeMobile();
        }}
      >
        <DialogSurface className="mobile-nav">
          <DialogBody>
            <DialogTitle
              action={
                <Button appearance="subtle" aria-label="Close navigation" onClick={closeMobile}>
                  Close
                </Button>
              }
            >
              Navigate
            </DialogTitle>
            <DialogContent>
              <nav className="mobile-nav__links" aria-label="Mobile navigation">
                <NavItems manifest={manifest} onNavigate={() => setMobileOpen(false)} />
              </nav>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <div ref={announcer} className="route-announcer" aria-live="polite" aria-atomic="true" />
      <main id="main-content" ref={main} tabIndex={-1} className="main-content">
        {manifest.audience === "local" && !manifest.deployable ? (
          <MessageBar intent="info" className="local-banner">
            <MessageBarBody>
              <MessageBarTitle>Local research view</MessageBarTitle>
              This artifact is explicitly non-deployable and may include owner-only material.
            </MessageBarBody>
          </MessageBar>
        ) : null}
        {children}
      </main>
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-intro">
      <Text className="eyebrow" weight="semibold">
        {eyebrow}
      </Text>
      <h1>{title}</h1>
      <Text size={500}>{description}</Text>
    </header>
  );
}

function DashboardPage({ manifest }: AppProps) {
  const [now] = useState(() => Date.now());
  const entitiesByTopic = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entity of manifest.entities) {
      counts.set(entity.primaryTopicId, (counts.get(entity.primaryTopicId) ?? 0) + 1);
    }
    return counts;
  }, [manifest.entities]);
  const needsReview = manifest.entities
    .filter((entity) => {
      if (entity.lastVerifiedAt === undefined) return true;
      return now - Date.parse(entity.lastVerifiedAt) > 30 * 24 * 60 * 60 * 1000;
    })
    .slice(0, 4);

  return (
    <>
      <PageIntro
        eyebrow="Research workspace"
        title="Follow the evidence, keep the context"
        description="Browse durable research topics, resume items that need verification, and trace every conclusion back to its source."
      />
      <section aria-labelledby="topics-heading">
        <div className="section-heading">
          <Title2 as="h2" id="topics-heading">
            Topics
          </Title2>
          <Badge appearance="tint">{manifest.entities.length} entities</Badge>
        </div>
        <div className="topic-grid">
          {manifest.taxonomy.map((topic, index) => (
            <TopicSummary
              key={topic.id}
              topic={topic}
              count={entitiesByTopic.get(topic.id) ?? 0}
              index={index}
            />
          ))}
        </div>
      </section>
      <section aria-labelledby="attention-heading" className="dashboard-section">
        <div className="section-heading">
          <Title2 as="h2" id="attention-heading">
            Needs attention
          </Title2>
        </div>
        {needsReview.length > 0 ? (
          <div className="entity-grid">
            {needsReview.map((entity) => (
              <EntityRenderer key={entity.id} entity={entity} context="collection" />
            ))}
          </div>
        ) : (
          <Text>All projected entities have been verified recently.</Text>
        )}
      </section>
    </>
  );
}

function TopicSummary({ topic, count, index }: { topic: TopicView; count: number; index: number }) {
  return (
    <Link to={`/topics/${topic.id}`} className={`topic-summary topic-summary--${(index % 4) + 1}`}>
      <span className="topic-summary__accent" aria-hidden="true" />
      <Title3 as="h3">{topic.title}</Title3>
      <Text>{topic.description}</Text>
      <span className="topic-summary__count">
        {count} {count === 1 ? "entity" : "entities"} →
      </span>
    </Link>
  );
}

function TopicPage({ manifest }: AppProps) {
  const { topicId } = useParams();
  const topic = manifest.taxonomy.find((candidate) => candidate.id === topicId);
  if (!topic) return <NotFound kind="topic" />;
  const entities = manifest.entities.filter((entity) => entity.primaryTopicId === topic.id);
  return (
    <>
      <PageIntro eyebrow="Topic collection" title={topic.title} description={topic.description} />
      {entities.length > 0 ? (
        <div className="entity-grid" aria-label={`${topic.title} entities`}>
          {entities.map((entity) => (
            <EntityRenderer key={entity.id} entity={entity} context="collection" />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Title3 as="h2">Nothing here yet</Title3>
          <Text>
            This topic is valid, but no entities are included in the current audience projection.
          </Text>
        </div>
      )}
    </>
  );
}

function EntityPage({ manifest }: AppProps) {
  const { entityId } = useParams();
  const entity = manifest.entities.find((candidate) => candidate.id === entityId);
  if (!entity) return <NotFound kind="entity" />;
  const topic = manifest.taxonomy.find((candidate) => candidate.id === entity.primaryTopicId);
  const backlinks = manifest.entities.flatMap((source) =>
    source.relationships
      .filter((relationship) => relationship.targetId === entity.id)
      .map((relationship) => ({ source, kind: relationship.kind })),
  );
  return (
    <div className="entity-page">
      <div className="entity-page__content">
        <div className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Dashboard</Link>
          <span aria-hidden="true">/</span>
          {topic ? (
            <Link to={`/topics/${topic.id}`}>{topic.title}</Link>
          ) : (
            <span>Uncategorized</span>
          )}
        </div>
        <EntityRenderer entity={entity} context="detail" />
        {entity.relationships.length > 0 ? (
          <section className="relationships" aria-labelledby="relationships-heading">
            <Title2 as="h2" id="relationships-heading">
              Relationships
            </Title2>
            <div className="relationship-list">
              {entity.relationships.map((relationship) => {
                const target = manifest.entities.find(
                  (candidate) => candidate.id === relationship.targetId,
                );
                if (!target) return null;
                return (
                  <div
                    className="relationship"
                    key={`${relationship.kind}:${relationship.targetId}`}
                  >
                    <Badge appearance="outline">{relationship.kind}</Badge>
                    <EntityRenderer
                      entity={target}
                      context="relationship"
                      viewType={relationship.viewType}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
        {backlinks.length > 0 ? (
          <section className="backlinks dashboard-section" aria-labelledby="backlinks-heading">
            <Title2 as="h2" id="backlinks-heading">
              Referenced by
            </Title2>
            <div className="relationship-list">
              {backlinks.map(({ source, kind }) => (
                <div className="relationship" key={`${source.id}:${kind}`}>
                  <Badge appearance="outline">{kind}</Badge>
                  <EntityRenderer entity={source} context="relationship" />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <aside className="entity-page__aside" aria-label="Research status and sources">
        <section className="metadata-panel">
          <Title3 as="h2">Research state</Title3>
          <Freshness
            {...(entity.lastVerifiedAt === undefined
              ? {}
              : { lastVerifiedAt: entity.lastVerifiedAt })}
          />
          <Divider />
          <div className="tag-list">
            {entity.tags.map((tag) => (
              <Badge key={tag} appearance="tint">
                {tag}
              </Badge>
            ))}
          </div>
        </section>
        <section className="metadata-panel">
          <Title3 as="h2">Sources</Title3>
          {entity.citations.length > 0 ? (
            <ol className="citation-list">
              {entity.citations.map((citation) => (
                <li key={`${citation.title}:${citation.url}`}>
                  <FluentLink href={citation.url} target="_blank" rel="noopener noreferrer">
                    {citation.title}
                  </FluentLink>
                </li>
              ))}
            </ol>
          ) : (
            <Text>No audience-safe citations are available.</Text>
          )}
        </section>
      </aside>
    </div>
  );
}

function SearchPage({ manifest }: AppProps) {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const index = useMemo(() => createSearch(manifest.searchDocuments), [manifest.searchDocuments]);
  const hits = useMemo(() => searchDocuments(index, query), [index, query]);
  const entities = new Map(manifest.entities.map((entity) => [entity.id, entity]));

  return (
    <>
      <PageIntro
        eyebrow="Local search"
        title="Search the research graph"
        description="Results come only from the audience-filtered manifest in this browser."
      />
      <SearchPageForm
        key={query}
        initialQuery={query}
        onSubmit={(next) => setParams(next ? { q: next } : {})}
      />
      <div className="search-summary" aria-live="polite">
        {query
          ? `${hits.length} ${hits.length === 1 ? "result" : "results"} for “${query}”`
          : "Enter a query to begin."}
      </div>
      {query && hits.length === 0 ? (
        <div className="empty-state">
          <Title3 as="h2">No matching research</Title3>
          <Text>Try a topic, tag, source phrase, or a shorter query.</Text>
        </div>
      ) : (
        <div className="search-results">
          {hits.map((hit) => {
            const entity = entities.get(hit.id);
            return entity ? <EntityRenderer key={hit.id} entity={entity} context="search" /> : null;
          })}
        </div>
      )}
    </>
  );
}

function SearchPageForm({
  initialQuery,
  onSubmit,
}: {
  initialQuery: string;
  onSubmit: (query: string) => void;
}) {
  const [draft, setDraft] = useState(initialQuery);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(draft.trim());
  };
  return (
    <search className="search-page__form">
      <form onSubmit={submit}>
        <Input
          aria-label="Search all research"
          size="large"
          value={draft}
          onChange={(_, data) => setDraft(data.value)}
        />
        <Button type="submit" appearance="primary" size="large">
          Search
        </Button>
      </form>
    </search>
  );
}

function NotFound({ kind = "page" }: { kind?: "page" | "entity" | "topic" }) {
  return (
    <div className="not-found">
      <span className="not-found__code" aria-hidden="true">
        404
      </span>
      <h1>
        {kind[0]?.toUpperCase()}
        {kind.slice(1)} not found
      </h1>
      <Text size={500}>
        The address may be outdated, or this item may not be included in the current audience
        projection.
      </Text>
      <div className="not-found__actions">
        <Link className="button-link" to="/">
          Return to dashboard
        </Link>
        <Link to="/search">Search research</Link>
      </div>
    </div>
  );
}

function RoutedApp({ manifest }: AppProps) {
  const [mode, setMode] = useState<TrackerThemeMode>(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  return (
    <TrackerProvider mode={mode} className="tracker-provider">
      <Shell manifest={manifest} mode={mode} setMode={setMode}>
        <Routes>
          <Route path="/" element={<DashboardPage manifest={manifest} />} />
          <Route path="/topics/:topicId" element={<TopicPage manifest={manifest} />} />
          <Route path="/entities/:entityId" element={<EntityPage manifest={manifest} />} />
          <Route path="/search" element={<SearchPage manifest={manifest} />} />
          <Route path="/calendar" element={<CalendarPage manifest={manifest} />} />
          <Route
            path="/calendar/:calendarMode/:calendarDate"
            element={<CalendarPage manifest={manifest} />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Shell>
    </TrackerProvider>
  );
}

export function App({ manifest }: AppProps) {
  return (
    <HashRouter>
      <RoutedApp manifest={manifest} />
    </HashRouter>
  );
}
