import type { ActivityKind } from "@planning/entity-model";
import {
  Caption1,
  Card,
  CardFooter,
  CardHeader,
  makeStyles,
  mergeClasses,
  Subtitle1,
  tokens,
} from "@fluentui/react-components";
import type { CSSProperties, ReactNode } from "react";
import { getHeaderBgStyle, getHeaderIcon } from "./activityStyles.ts";

const useStyles = makeStyles({
  container: {
    position: "relative",
    height: "100%",
    minWidth: 0,
    gap: 0,
    overflow: "hidden",
    padding: 0,
    transition: "transform 120ms ease, box-shadow 120ms ease",
  },
  cardLink: {
    position: "absolute",
    zIndex: 1,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    ":focus-visible": {
      outlineColor: tokens.colorBrandStroke1,
      outlineOffset: "-3px",
      outlineStyle: "solid",
      outlineWidth: "2px",
    },
  },
  header: {
    boxSizing: "border-box",
    minHeight: "5.25rem",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    color: tokens.colorNeutralForegroundStaticInverted,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
  },
  headerText: {
    minWidth: 0,
    margin: 0,
    color: tokens.colorNeutralForegroundStaticInverted,
    overflowWrap: "anywhere",
  },
  body: {
    display: "grid",
    minWidth: 0,
    gap: tokens.spacingVerticalM,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
  },
  footer: {
    padding: `0 ${tokens.spacingHorizontalL} ${tokens.spacingVerticalL}`,
  },
});

export interface ActivityCardHeaderProps {
  kind: ActivityKind;
  title: string;
  subtitle: string;
  href?: string;
  backgroundImage?: CSSProperties["backgroundImage"];
}

export interface ActivityCardProps extends ActivityCardHeaderProps {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ActivityCard({
  children,
  footer,
  kind,
  title,
  subtitle,
  href,
  backgroundImage,
  className,
}: ActivityCardProps) {
  const styles = useStyles();

  return (
    <Card
      className={mergeClasses(styles.container, "tracker-activity-card", className)}
      appearance="filled"
    >
      {href ? (
        <a
          aria-label={title}
          className={mergeClasses(styles.cardLink, "tracker-activity-card__link")}
          href={href}
        />
      ) : null}
      <CardHeader
        className={mergeClasses(styles.header, "tracker-activity-header")}
        data-activity-kind={kind}
        data-has-background-image={backgroundImage ? "true" : undefined}
        style={getHeaderBgStyle(kind, backgroundImage)}
        image={getHeaderIcon(kind)}
        header={
          <Subtitle1 as="h3" className={styles.headerText}>
            {title}
          </Subtitle1>
        }
        description={<Caption1 className={styles.headerText}>{subtitle}</Caption1>}
      />
      <div className={styles.body}>{children}</div>
      {footer ? <CardFooter className={styles.footer}>{footer}</CardFooter> : null}
    </Card>
  );
}
