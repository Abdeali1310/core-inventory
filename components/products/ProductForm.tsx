"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category_id: z.string().optional().nullable(),
  unit_of_measure: z.string().min(1, "Unit of measure is required"),
  reorder_point: z.number().min(0, "Reorder point must be 0 or greater"),
  reorder_qty: z.number().min(1, "Reorder quantity must be at least 1"),
  initial_stock: z.number().min(0, "Initial stock must be 0 or greater").optional().nullable(),
  location_id: z.string().optional().nullable(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  unit_of_measure: string;
  reorder_point: number;
  reorder_qty: number;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  categories: { id: string; name: string }[];
  locations: { id: string; name: string; warehouse_name?: string }[];
  defaultLocationId?: string;
  onSuccess?: () => void;
}

const UNIT_OPTIONS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "lb", label: "Pounds (lb)" },
  { value: "oz", label: "Ounces (oz)" },
  { value: "L", label: "Liters (L)" },
  { value: "mL", label: "Milliliters (mL)" },
  { value: "m", label: "Meters (m)" },
  { value: "cm", label: "Centimeters (cm)" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "set", label: "Set" },
];

export function ProductForm({
  open,
  onOpenChange,
  product,
  categories,
  locations,
  defaultLocationId,
  onSuccess,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!product;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      category_id: product?.category_id || null,
      unit_of_measure: product?.unit_of_measure || "pcs",
        reorder_point: product?.reorder_point ?? 10,
        reorder_qty: product?.reorder_qty ?? 50,
        initial_stock: 0,
        location_id: defaultLocationId || locations[0]?.id || null,
    },
  });

  const selectedCategory = watch("category_id");
  const selectedUnit = watch("unit_of_measure");
  const selectedLocation = watch("location_id");

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    setLoading(true);
    try {
      if (isEditMode) {
        await updateProduct(product.id, {
          name: data.name,
          sku: data.sku,
          category_id: data.category_id || undefined,
          unit_of_measure: data.unit_of_measure,
          reorder_point: data.reorder_point,
          reorder_qty: data.reorder_qty,
        });
        toast.success("Product updated successfully");
      } else {
        await createProduct({
          name: data.name,
          sku: data.sku,
          category_id: data.category_id || undefined,
          unit_of_measure: data.unit_of_measure,
          reorder_point: data.reorder_point,
          reorder_qty: data.reorder_qty,
          initial_stock: data.initial_stock ?? undefined,
          location_id: data.location_id || undefined,
        });
        toast.success("Product created successfully");
      }
      onOpenChange(false);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        style={{
          background: "#0f172a",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          width: 450,
        }}
        className="sm:max-w-[450px]"
      >
        <SheetHeader>
          <SheetTitle style={{ color: "#f0f4ff" }}>
            {isEditMode ? "Edit Product" : "Add New Product"}
          </SheetTitle>
          <SheetDescription style={{ color: "#64748b" }}>
            {isEditMode
              ? "Update the product details below."
              : "Fill in the details to create a new product."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label style={{ color: "#e2e8f0" }}>Product Name *</Label>
            <Input
              placeholder="Enter product name"
              {...register("name")}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0",
              }}
            />
            {errors.name && (
              <p style={{ color: "#f87171", fontSize: 12 }}>{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label style={{ color: "#e2e8f0" }}>SKU *</Label>
            <Input
              placeholder="e.g., PROD-001"
              {...register("sku")}
              onChange={(e) => setValue("sku", e.target.value.toUpperCase())}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0",
                fontFamily: "monospace",
              }}
            />
            {errors.sku && (
              <p style={{ color: "#f87171", fontSize: 12 }}>{errors.sku.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label style={{ color: "#e2e8f0" }}>Category</Label>
            <Select
              value={selectedCategory || ""}
              onValueChange={(v) => setValue("category_id", v || null)}
            >
              <SelectTrigger
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0",
                }}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" }}>
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id}
                    style={{ color: "#e2e8f0" }}
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label style={{ color: "#e2e8f0" }}>Unit of Measure *</Label>
            <Select
              value={selectedUnit}
              onValueChange={(v) => setValue("unit_of_measure", v)}
            >
              <SelectTrigger
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0",
                }}
              >
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" }}>
                {UNIT_OPTIONS.map((unit) => (
                  <SelectItem
                    key={unit.value}
                    value={unit.value}
                    style={{ color: "#e2e8f0" }}
                  >
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unit_of_measure && (
              <p style={{ color: "#f87171", fontSize: 12 }}>{errors.unit_of_measure.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label style={{ color: "#e2e8f0" }}>Reorder Point</Label>
              <Input
                type="number"
                min={0}
                {...register("reorder_point", { valueAsNumber: true })}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0",
                }}
              />
              {errors.reorder_point && (
                <p style={{ color: "#f87171", fontSize: 12 }}>{errors.reorder_point.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label style={{ color: "#e2e8f0" }}>Reorder Qty</Label>
              <Input
                type="number"
                min={1}
                {...register("reorder_qty", { valueAsNumber: true })}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0",
                }}
              />
              {errors.reorder_qty && (
                <p style={{ color: "#f87171", fontSize: 12 }}>{errors.reorder_qty.message}</p>
              )}
            </div>
          </div>

          {!isEditMode && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: "#e2e8f0" }}>Initial Stock</Label>
                <Input
                  type="number"
                  min={0}
                  {...register("initial_stock", { valueAsNumber: true })}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#e2e8f0",
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: "#e2e8f0" }}>Location</Label>
                <Select
                  value={selectedLocation || ""}
                  onValueChange={(v) => setValue("location_id", v || null)}
                >
                  <SelectTrigger
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#e2e8f0",
                    }}
                  >
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {locations.map((loc) => (
                      <SelectItem
                        key={loc.id}
                        value={loc.id}
                        style={{ color: "#e2e8f0" }}
                      >
                        {loc.name}
                        {loc.warehouse_name && ` (${loc.warehouse_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0",
                flex: 1,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #2563eb, #1e40af)",
                border: "none",
                color: "white",
                fontWeight: 600,
                flex: 1,
              }}
            >
              {loading ? "Saving..." : isEditMode ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
