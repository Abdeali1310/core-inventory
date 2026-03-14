"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, PackagePlus, PackageMinus, ArrowLeftRight,
  SlidersHorizontal, Boxes, History, Settings, LogOut,
  Package, ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const navGroups = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Receipts", href: "/receipts", icon: PackagePlus },
      { label: "Deliveries", href: "/deliveries", icon: PackageMinus },
      { label: "Transfers", href: "/transfers", icon: ArrowLeftRight },
      { label: "Adjustments", href: "/adjustments", icon: SlidersHorizontal },
    ],
  },
  {
    label: "INVENTORY",
    items: [
      { label: "Products", href: "/products", icon: Boxes },
      { label: "Move History", href: "/move-history", icon: History },
    ],
  },
  {
    label: "CONFIGURATION",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

interface Profile {
  full_name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, role, avatar_url")
        .eq("id", user.id)
        .single();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <>
      <style>{`
        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          transition: all 0.15s ease;
          position: relative;
          margin-bottom: 1px;
          border: 1px solid transparent;
        }
        .sidebar-nav-item:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.05);
        }
        .sidebar-nav-item.active {
          color: #f0f4ff;
          background: rgba(37,99,235,0.15);
          border-color: rgba(37,99,235,0.25);
          font-weight: 600;
        }
        .sidebar-nav-item.active::before {
          content: '';
          position: absolute;
          left: -1px;
          top: 20%;
          height: 60%;
          width: 3px;
          background: #3b82f6;
          border-radius: 0 3px 3px 0;
        }
        .signout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          transition: all 0.15s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .signout-btn:hover {
          color: #f87171;
          background: rgba(239,68,68,0.08);
        }
      `}</style>

      <aside style={{
        position: "fixed",
        left: 0, top: 0, bottom: 0,
        width: 260,
        background: "#0d1220",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* Logo */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: "linear-gradient(135deg, #2563eb, #1e40af)",
              borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(37,99,235,0.3)",
              flexShrink: 0,
            }}>
              <Package size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#f0f4ff", letterSpacing: "-0.3px" }}>
                  CoreInventory
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "#3b82f6",
                  background: "rgba(37,99,235,0.15)",
                  border: "1px solid rgba(37,99,235,0.3)",
                  padding: "1px 5px", borderRadius: 4,
                  letterSpacing: "0.5px",
                }}>IMS</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "1px", textTransform: "uppercase" }}>
                Management System
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: "rgba(255,255,255,0.2)",
                letterSpacing: "1.5px",
                padding: "0 12px",
                marginBottom: 6,
              }}>
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className={`sidebar-nav-item ${active ? "active" : ""}`}>
                    <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {active && <ChevronRight size={13} style={{ opacity: 0.5 }} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Profile + Signout */}
        <div style={{
          padding: "12px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Profile card */}
          <Link href="/profile" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            textDecoration: "none",
            marginBottom: 4,
            transition: "all 0.15s",
          }}>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "white",
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "#f0f4ff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {profile?.full_name || "User"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: profile?.role === "manager" ? "#60a5fa" : "#34d399",
                  background: profile?.role === "manager" ? "rgba(37,99,235,0.15)" : "rgba(52,211,153,0.12)",
                  padding: "1px 6px", borderRadius: 4,
                  textTransform: "capitalize",
                }}>
                  {profile?.role || "staff"}
                </span>
              </div>
            </div>
          </Link>

          {/* Sign out */}
          <button onClick={handleSignOut} className="signout-btn">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
