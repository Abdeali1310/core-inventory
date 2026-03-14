import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProducts, getCategories } from "@/lib/actions/products";
import { ProductsClient } from "@/components/products/ProductsClient";

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const params = await searchParams;

  const filters = {
    ...(params.search && { search: params.search }),
    ...(params.category && { category_id: params.category }),
    ...(params.status === "low_stock" && { is_low_stock: true }),
    ...(params.status === "out_of_stock" && { is_out_of_stock: true }),
  };

  const [products, categories] = await Promise.all([
    getProducts(filters),
    getCategories(),
  ]);

  return (
    <ProductsClient
      initialProducts={products}
      categories={categories}
      userRole={profile?.role}
    />
  );
}
