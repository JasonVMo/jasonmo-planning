import { Button, makeStyles, tokens } from "@fluentui/react-components";
import type { NavigationItem } from "./navigation.ts";

export { buildNavigation } from "./navigation.ts";
export type { NavigationItem } from "./navigation.ts";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    minWidth: "240px",
    padding: tokens.spacingVerticalM,
  },
  item: {
    justifyContent: "flex-start",
  },
});

export interface SidebarProps {
  readonly items: readonly NavigationItem[];
  readonly selectedKey: string;
  readonly onSelect: (item: NavigationItem) => void;
}

export function Sidebar({ items, selectedKey, onSelect }: SidebarProps) {
  const styles = useStyles();

  return (
    <nav className={styles.root} aria-label="Topics">
      {items.map((item) => (
        <Button
          appearance={item.key === selectedKey ? "primary" : "subtle"}
          className={styles.item}
          key={item.key}
          onClick={() => onSelect(item)}
          style={{ paddingInlineStart: `${12 + item.depth * 20}px` }}
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
