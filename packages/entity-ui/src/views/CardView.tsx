import type { CardViewModel } from "@planning/entity-model";
import { Badge, Card, CardFooter, CardHeader, Text, Title3 } from "@fluentui/react-components";

export function CardView({ title, summary, href, badges }: CardViewModel) {
  return (
    <article data-view-type="card">
      <Card className="tracker-card" appearance="outline">
        <CardHeader
          header={
            <Title3 as="h3">
              <a href={href}>{title}</a>
            </Title3>
          }
          description={<Text>{summary}</Text>}
        />
        {badges.length > 0 ? (
          <CardFooter className="tracker-card__badges">
            {badges.map((badge) => (
              <Badge key={badge} appearance="tint" shape="rounded">
                {badge}
              </Badge>
            ))}
          </CardFooter>
        ) : null}
      </Card>
    </article>
  );
}
