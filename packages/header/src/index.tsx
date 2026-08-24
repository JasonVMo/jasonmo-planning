import { Subtitle2, Title2, makeStyles, tokens } from "@fluentui/react-components";
import type { HeaderConfiguration } from "@jasonmo/common";

const useStyles = makeStyles({
  root: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
  },
});

export function Header({ title, description }: HeaderConfiguration) {
  const styles = useStyles();

  return (
    <header className={styles.root}>
      <Title2>{title}</Title2>
      {description ? <Subtitle2 className={styles.subtitle}>{description}</Subtitle2> : null}
    </header>
  );
}
