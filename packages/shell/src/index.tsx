import { useMemo, useState } from "react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Dismiss24Regular, Navigation24Regular } from "@fluentui/react-icons";
import type { TopicDefinition } from "@jasonmo/common";
import { Header } from "@jasonmo/header";
import { buildNavigation, Sidebar } from "@jasonmo/sidebar";
import type { NavigationItem } from "@jasonmo/sidebar";

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
  },
  mobileNavigation: {
    display: "none",
    padding: tokens.spacingVerticalS,
    "@media (max-width: 700px)": {
      display: "block",
    },
  },
  body: {
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr)",
    "@media (max-width: 700px)": {
      display: "block",
    },
  },
  desktopSidebar: {
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    minHeight: "calc(100vh - 90px)",
    "@media (max-width: 700px)": {
      display: "none",
    },
  },
  content: {
    margin: "0 auto",
    maxWidth: "960px",
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXL}`,
  },
});

export interface ShellProps {
  readonly topics: readonly TopicDefinition[];
}

export function Shell({ topics }: ShellProps) {
  const styles = useStyles();
  const items = useMemo(() => buildNavigation(topics), [topics]);
  const [selected, setSelected] = useState<NavigationItem | undefined>(items[0]);
  const [navigationOpen, setNavigationOpen] = useState(false);

  if (!selected) {
    return <main className={styles.content}>No topics have been configured.</main>;
  }

  const Page = selected.page.component;
  const select = (item: NavigationItem) => {
    setSelected(item);
    setNavigationOpen(false);
  };

  return (
    <div className={styles.root}>
      <Header {...selected.topic.header} />
      <div className={styles.mobileNavigation}>
        <Button
          appearance="subtle"
          aria-label="Open navigation"
          icon={<Navigation24Regular />}
          onClick={() => setNavigationOpen(true)}
        />
      </div>
      <Drawer
        open={navigationOpen}
        onOpenChange={(_, data) => setNavigationOpen(data.open)}
        type="overlay"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close navigation"
                icon={<Dismiss24Regular />}
                onClick={() => setNavigationOpen(false)}
              />
            }
          >
            Topics
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <Sidebar items={items} onSelect={select} selectedKey={selected.key} />
        </DrawerBody>
      </Drawer>
      <div className={styles.body}>
        <aside className={styles.desktopSidebar}>
          <Sidebar items={items} onSelect={select} selectedKey={selected.key} />
        </aside>
        <main className={styles.content}>
          <Page />
        </main>
      </div>
    </div>
  );
}
