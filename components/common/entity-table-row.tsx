"use client";

import { useState } from "react";
import { TableRow } from "@/components/ui/table";
import type { EntityKey } from "@/lib/entity-theme";
import { getEntityTheme } from "@/lib/entity-theme";

type EntityTableRowProps = React.ComponentProps<typeof TableRow> & {
  entityKey: EntityKey;
};

// A TableRow that highlights with its entity's tint color on hover, instead
// of the generic neutral hover background.
export function EntityTableRow({
  entityKey,
  style,
  ...props
}: EntityTableRowProps) {
  const theme = getEntityTheme(entityKey);
  const [hovered, setHovered] = useState(false);

  return (
    <TableRow
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        backgroundColor: hovered ? theme.color.tint : undefined,
      }}
      {...props}
    />
  );
}