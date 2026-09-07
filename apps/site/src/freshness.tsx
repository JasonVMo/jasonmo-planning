import { Badge, Text } from "@fluentui/react-components";
import { useState } from "react";

const day = 24 * 60 * 60 * 1000;

export function Freshness({ lastVerifiedAt }: { lastVerifiedAt?: string }) {
  const [now] = useState(() => Date.now());
  if (lastVerifiedAt === undefined) {
    return (
      <div className="freshness freshness--unverified">
        <Badge appearance="filled" color="warning">
          Unverified
        </Badge>
        <Text>No successful verification is available in this browser projection.</Text>
      </div>
    );
  }
  const verified = Date.parse(lastVerifiedAt);
  if (!Number.isFinite(verified)) {
    return (
      <div className="freshness freshness--unverified">
        <Badge appearance="filled" color="warning">
          Verification unknown
        </Badge>
        <Text>The projected verification timestamp is invalid.</Text>
      </div>
    );
  }
  const days = Math.max(0, Math.floor((now - verified) / day));
  const needsReview = days > 30;
  return (
    <div className="freshness">
      <Badge appearance="tint" color={needsReview ? "warning" : "success"}>
        {needsReview ? "Review recommended" : "Recently verified"}
      </Badge>
      <Text>
        Last verified{" "}
        <time dateTime={lastVerifiedAt}>{days === 0 ? "today" : `${days} days ago`}</time>.
      </Text>
    </div>
  );
}
