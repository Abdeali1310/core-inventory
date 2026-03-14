"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function DashboardPage() {
    const router = useRouter();

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.success("Signed out!");
        router.push("/login");
        router.refresh();
    };

    return (
        <div style={{ padding: 40, background: "#080c14", minHeight: "100vh", fontFamily: "sans-serif" }}>
            <h1 style={{ color: "white", marginBottom: 20 }}>Dashboard (coming soon)</h1>
            <button onClick={handleSignOut} style={{
                padding: "10px 20px", background: "#ef4444", color: "white",
                border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600
            }}>
                Sign Out
            </button>
        </div>
    );
}