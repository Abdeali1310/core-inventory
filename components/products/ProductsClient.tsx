"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StockBadge } from "@/components/products/StockBadge";
import { ProductForm } from "./ProductForm";
import { ProductWithStock, ProductFilters, getProducts, getLocations, toggleProductActive } from "@/lib/actions/products";
import { Search, Plus, Pencil, Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";


interface ProductsClientProps {
  initialProducts: ProductWithStock[];
  categories: { id: string; name: string }[];
  userRole?: string;
}

type StatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

export function ProductsClient({
  initialProducts,
  categories,
  userRole,
}: ProductsClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
  const [locations, setLocations] = useState<{ id: string; name: string; warehouse_name?: string }[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ProductFilters = {
        is_in_stock: false
      };
      if (search) filters.search = search;
      if (selectedCategory !== "all") filters.category_id = selectedCategory;
      if (statusFilter === "low_stock") filters.is_low_stock = true;
      else if (statusFilter === "out_of_stock") filters.is_out_of_stock = true;
      else if (statusFilter === "in_stock") filters.is_in_stock = true;

      const data = await getProducts(filters);
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(debounce);
  }, [search, selectedCategory, statusFilter]);

  useEffect(() => {
    async function loadLocations() {
      const locs = await getLocations();
      setLocations(locs);
    }
    loadLocations();
  }, []);

  const handleCopySku = (e: React.MouseEvent, sku: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    toast.success("SKU copied!");
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const handleToggleActive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await toggleProductActive(id);
    toast.success("Product updated");
    fetchProducts();
  };

  const isManager = userRole === "manager";

  const columns: Column<ProductWithStock>[] = [
    {
      key: "sku",
      header: "SKU",
      sortable: true,
      render: (item) => (
        <button
          onClick={(e) => handleCopySku(e, item.sku)}
          className="flex items-center gap-1.5 font-mono text-[13px] text-blue-400 hover:text-blue-300 transition-colors group"
        >
          {item.sku}
          {copiedSku === item.sku
            ? <Check size={11} className="text-green-400" />
            : <Copy size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          }
        </button>
      ),
    },
    {
      key: "name",
      header: "Product Name",
      sortable: true,
      render: (item) => (
        <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{item.name}</span>
      ),
    },
    {
      key: "category_name",
      header: "Category",
      sortable: true,
      render: (item) => (
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#94a3b8",
          background: "rgba(148,163,184,0.1)",
          padding: "2px 8px",
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,0.15)"
        }}>
          {item.category_name || "Uncategorized"}
        </span>
      ),
    },
    {
      key: "unit_of_measure",
      header: "Unit",
      sortable: true,
      render: (item) => (
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{item.unit_of_measure}</span>
      ),
    },
    {
      key: "total_stock",
      header: "Total Stock",
      sortable: true,
      render: (item) => (
        <span style={{
          color: item.total_stock === 0 ? "#f87171" : item.total_stock <= item.reorder_point ? "#fb923c" : "#34d399",
          fontWeight: 600,
          fontSize: 14,
        }}>
          {item.total_stock.toLocaleString()}
          <span style={{ color: "#64748b", fontWeight: 400, fontSize: 11, marginLeft: 4 }}>
            {item.unit_of_measure}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <StockBadge quantity={item.total_stock} reorderPoint={item.reorder_point} />
      ),
    },
    {
      key: "reorder_point",
      header: "Reorder Pt.",
      sortable: true,
      render: (item) => (
        <span style={{ color: "#64748b", fontSize: 13 }}>
          {item.reorder_point}
        </span>
      ),
    },
    ...(isManager ? [{
      key: "actions",
      header: "Actions",
      render: (item: ProductWithStock) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              setEditingProduct(item);
              setOpenSheet(true);
            }}
            style={{
              padding: "5px 8px",
              borderRadius: 6,
              background: "rgba(37,99,235,0.12)",
              border: "1px solid rgba(37,99,235,0.2)",
              color: "#60a5fa",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            title="Edit product"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => handleToggleActive(e, item.id)}
            style={{
              padding: "5px 8px",
              borderRadius: 6,
              background: item.is_active ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
              border: item.is_active ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(248,113,113,0.2)",
              color: item.is_active ? "#34d399" : "#f87171",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            title={item.is_active ? "Deactivate" : "Activate"}
          >
            {item.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        </div>
      ),
    }] as Column<ProductWithStock>[] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f0f4ff", margin: 0 }}>
              Products
            </h1>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#60a5fa",
              background: "rgba(37,99,235,0.15)",
              border: "1px solid rgba(37,99,235,0.25)",
              padding: "2px 10px",
              borderRadius: 20,
            }}>
              {products.length}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
            Manage your product catalog and inventory
          </p>
        </div>
        {isManager && (
          <Button
            onClick={() => {
              setEditingProduct(null);
              setOpenSheet(true);
            }}
            style={{
              background: "linear-gradient(135deg, #2563eb, #1e40af)",
              border: "none",
              color: "white",
              fontWeight: 600,
              padding: "8px 18px",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(37,99,235,0.25)",
            }}
          >
            <Plus size={15} />
            New Product
          </Button>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        padding: "16px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
      }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{
            position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: "#64748b"
          }} />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: 32,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e2e8f0",
              height: 36,
            }}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger style={{
            width: 180,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#e2e8f0",
            height: 36,
          }}>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger style={{
            width: 160,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#e2e8f0",
            height: 36,
          }}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products found. Try adjusting your filters."
        rowKey="id"
        onRowClick={(item) => router.push(`/products/${item.id}`)}
      />

      {/* Product Form Sheet */}
      <ProductForm
        open={openSheet}
        onOpenChange={(open) => {
          setOpenSheet(open);
          if (!open) setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        locations={locations}
        defaultLocationId={locations[0]?.id}
        onSuccess={() => fetchProducts()}
      />
    </div>
  );
}