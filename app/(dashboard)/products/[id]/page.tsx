import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/actions/products";
import { ArrowLeft, Package, Box, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Package size={48} style={{ color: "#64748b" }} />
        <h2 style={{ color: "#f0f4ff", fontSize: 20, fontWeight: 600, marginTop: 16 }}>
          Product Not Found
        </h2>
        <p style={{ color: "#64748b", marginTop: 8 }}>
          The product you're looking for doesn't exist.
        </p>
        <Link href="/products">
          <Button
            style={{
              marginTop: 16,
              background: "linear-gradient(135deg, #2563eb, #1e40af)",
              border: "none",
              color: "white",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} style={{ marginRight: 8 }} />
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  const statusColor = product.total_stock === 0 
    ? "#f87171" 
    : product.total_stock <= product.reorder_point 
      ? "#fb923c" 
      : "#34d399";

  const statusText = product.total_stock === 0 
    ? "Out of Stock" 
    : product.total_stock <= product.reorder_point 
      ? "Low Stock" 
      : "In Stock";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button
            variant="ghost"
            size="icon"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e2e8f0",
            }}
          >
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f0f4ff", margin: 0 }}>
              {product.name}
            </h1>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: statusColor,
              background: `${statusColor}15`,
              border: `1px solid ${statusColor}30`,
              padding: "2px 10px",
              borderRadius: 12,
            }}>
              {statusText}
            </span>
            {!product.is_active && (
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#f87171",
                background: "rgba(248,113,113,0.15)",
                border: "1px solid rgba(248,113,113,0.3)",
                padding: "2px 10px",
                borderRadius: 12,
              }}>
                Inactive
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 2, fontFamily: "monospace" }}>
            {product.sku}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {/* Total Stock Card */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Box size={18} style={{ color: "#60a5fa" }} />
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Total Stock</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: statusColor }}>
              {product.total_stock.toLocaleString()}
            </span>
            <span style={{ fontSize: 14, color: "#64748b" }}>{product.unit_of_measure}</span>
          </div>
        </div>

        {/* Category Card */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Package size={18} style={{ color: "#a78bfa" }} />
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Category</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>
            {product.category_name}
          </span>
        </div>

        {/* Reorder Point Card */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={18} style={{ color: "#fb923c" }} />
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Reorder Point</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#fb923c" }}>
              {product.reorder_point}
            </span>
            <span style={{ fontSize: 14, color: "#64748b" }}>{product.unit_of_measure}</span>
          </div>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Order {product.reorder_qty} {product.unit_of_measure} when reaching this level
          </span>
        </div>

        {/* Unit Card */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Box size={18} style={{ color: "#34d399" }} />
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Unit of Measure</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>
            {product.unit_of_measure}
          </span>
        </div>
      </div>

      {/* Stock by Location */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: 20,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f0f4ff", marginBottom: 16 }}>
          Stock by Location
        </h3>
        {product.stockByLocation.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 14 }}>No stock records found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {product.stockByLocation.map((sl) => (
              <div
                key={sl.location_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div>
                  <span style={{ fontWeight: 500, color: "#e2e8f0" }}>{sl.location_name}</span>
                  <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>
                    {sl.warehouse_name}
                  </span>
                </div>
                <span style={{ 
                  fontWeight: 600, 
                  color: sl.quantity === 0 ? "#f87171" : sl.quantity <= 10 ? "#fb923c" : "#34d399" 
                }}>
                  {sl.quantity.toLocaleString()} {product.unit_of_measure}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Movements */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: 20,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f0f4ff", marginBottom: 16 }}>
          Recent Stock Movements
        </h3>
        {product.recentMovements.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 14 }}>No stock movements recorded.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {product.recentMovements.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: m.type === "in" 
                      ? "rgba(52,211,153,0.15)" 
                      : m.type === "out" 
                        ? "rgba(248,113,113,0.15)" 
                        : "rgba(251, 146, 60, 0.15)",
                  }}>
                    {m.type === "in" ? (
                      <TrendingUp size={16} style={{ color: "#34d399" }} />
                    ) : m.type === "out" ? (
                      <TrendingDown size={16} style={{ color: "#f87171" }} />
                    ) : (
                      <Minus size={16} style={{ color: "#fb923c" }} />
                    )}
                  </div>
                  <div>
                    <span style={{ fontWeight: 500, color: "#e2e8f0" }}>
                      {m.type === "in" ? "Stock In" : m.type === "out" ? "Stock Out" : "Adjustment"}
                    </span>
                    <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>
                      {m.location_name}
                    </span>
                    {m.notes && (
                      <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        {m.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ 
                    fontWeight: 600, 
                    color: m.type === "in" ? "#34d399" : m.type === "out" ? "#f87171" : "#fb923c" 
                  }}>
                    {m.type === "in" ? "+" : m.type === "out" ? "-" : ""}{Math.abs(m.quantity)} {product.unit_of_measure}
                  </span>
                  <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    {new Date(m.created_at).toLocaleDateString()} by {m.created_by}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
