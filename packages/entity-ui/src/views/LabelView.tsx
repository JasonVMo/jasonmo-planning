import type { LabelViewModel } from "@planning/entity-model";
import { Link } from "@fluentui/react-components";

export function LabelView({ title, href }: LabelViewModel) {
  return (
    <Link className="tracker-label" href={href} data-view-type="label">
      {title}
    </Link>
  );
}
