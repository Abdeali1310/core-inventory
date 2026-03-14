"use client";

import * as React from "react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const rowHoverStyle = `
  .hover-row:hover { background: rgba(37,99,235,0.06) !important; }
`;
export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey: keyof T;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data found",
  rowKey,
  onRowClick,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortKey];
      const bValue = (b as Record<string, unknown>)[sortKey];
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const getValue = (item: T, key: string): unknown => {
    if (key.includes(".")) {
      const keys = key.split(".");
      let value: unknown = item;
      for (const k of keys) {
        value = (value as Record<string, unknown>)?.[k];
      }
      return value;
    }
    return (item as Record<string, unknown>)[key];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <style>{rowHoverStyle}</style>
      <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>        <Table>
        <TableHeader>
          <TableRow style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>              {columns.map((column) => (
            <TableHead
              key={String(column.key)}
              style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}
              className={cn(column.sortable && "cursor-pointer select-none")}
              onClick={() => column.sortable && handleSort(String(column.key))}
            >
              <div className="flex items-center gap-2">
                {column.header}
                {column.sortable && (
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                )}
              </div>
            </TableHead>
          ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: pageSize }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                style={{ textAlign: "center", padding: "48px", color: "#64748b" }}              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((item) => (
              <TableRow
                key={String(item[rowKey])}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: onRowClick ? "pointer" : "default" }}
                className="hover-row"
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell key={String(column.key)} className={column.className}>
                    {column.render
                      ? column.render(item)
                      : String(getValue(item, String(column.key)) ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>

      {sortedData.length > 0 && (
        <div className="flex items-center justify-between">
          <div style={{ fontSize: 13, color: "#64748b" }}>            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
            {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
