"use client";

import { Badge } from "@/components/ui/badge";
import { PackageX, PackageCheck, AlertTriangle } from "lucide-react";

interface StockBadgeProps {
  quantity: number;
  reorderPoint: number;
}

export function StockBadge({ quantity, reorderPoint }: StockBadgeProps) {
  if (quantity === 0) {
    return (
      <Badge
        variant="destructive"
        className="gap-1"
      >
        <PackageX className="h-3 w-3" />
        Out of Stock
      </Badge>
    );
  }

  if (quantity <= reorderPoint) {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
      >
        <AlertTriangle className="h-3 w-3" />
        Low Stock
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-green-500/10 text-green-500 hover:bg-green-500/20"
    >
      <PackageCheck className="h-3 w-3" />
      In Stock
    </Badge>
  );
}
