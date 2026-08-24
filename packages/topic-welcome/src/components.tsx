import { Card, CardHeader, Image, Text } from "@fluentui/react-components";
import diagram from "./assets/research.svg";

export function ResearchDiagram() {
  return (
    <Card>
      <CardHeader header={<Text weight="semibold">Research workflow</Text>} />
      <Image alt="Research flowing into a published topic" src={diagram} />
    </Card>
  );
}
