import type { TileViewModel } from "@tracker/entity-model";
import { Card, CardHeader, Text, Title3 } from "@fluentui/react-components";

export function TileView({ title, summary, href }: TileViewModel) {
  return (
    <article data-view-type="tile">
      <Card className="tracker-tile" appearance="filled-alternative">
        <CardHeader
          header={
            <Title3 as="h3">
              <a href={href}>{title}</a>
            </Title3>
          }
          description={<Text>{summary}</Text>}
        />
      </Card>
    </article>
  );
}
