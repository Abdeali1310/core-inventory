"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, ChevronRight, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

const routeTitles: Record<string, { title: string; parent?: string }> = {
  "/dashboard": { title: "Dashboard" },
  "/receipts": { title: "Receipts", parent: "Operations" },
  "/receipts/new": { title: "New Receipt", parent: "Receipts" },
  "/deliveries": { title: "Deliveries", parent: "Operations" },
  "/deliveries/new": { title: "New Delivery", parent: "Deliveries" },
  "/transfers": { title: "Transfers", parent: "Operations" },
  "/transfers/new": { title: "New Transfer", parent: "Transfers" },
  "/adjustments": { title: "Adjustments", parent: "Operations" },
  "/adjustments/new": { title: "New Adjustment", parent: "Adjustments" },
  "/products": { title: "Products", parent: "Inventory" },
  "/products/new": { title: "New Product", parent: "Products" },
  "/move-history": { title: "Move History", parent: "Inventory" },
  "/settings": { title: "Settings", parent: "Configuration" },
  "/profile": { title: "My Profile" },
};

function getRouteInfo(pathname: string) {
  if (routeTitles[pathname]) return routeTitles[pathname];
  // Dynamic routes like /receipts/[id]
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const parent = routeTitles[`/${segments[0]}`];
    return { title: "Details", parent: parent?.title };
  }
  return { title: "Dashboard" };
}

interface Notification {
  id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const routeInfo = getRouteInfo(pathname);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [initials, setInitials] = useState("U");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) {
        setFullName(profile.full_name);
        setInitials(profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2));
      }
      if (profile?.avatar_url) {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(profile.avatar_url);
        if (!cancelled) setAvatarUrl(urlData.publicUrl);
      }

      // Fetch notifications
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!cancelled) setNotifications(notifs || []);

      // Realtime subscription
      const channel = supabase
        .channel("notifications")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev.slice(0, 4)]);
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <style>{`
        .topbar-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer; transition: all 0.15s; color: rgba(255,255,255,0.5);
          position: relative;
        }
        .topbar-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85); }
        .dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: #111827; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 8px;
          min-width: 260px; z-index: 100;
          box-shadow: 0 16px 48px rgba(0,0,0,0.6);
          animation: dropIn 0.15s ease;
        }
        @keyframes dropIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .dropdown-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 8px;
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          transition: all 0.15s; cursor: pointer;
          background: none; border: none; width: 100%;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .dropdown-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9); }
        .dropdown-item.danger:hover { background: rgba(239,68,68,0.08); color: #f87171; }
      `}</style>

      <header style={{
        position: "fixed",
        top: 0, left: 260, right: 0,
        height: 64,
        background: "rgba(8,12,20,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center",
        padding: "0 24px",
        zIndex: 40,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        gap: 16,
      }}>

        {/* Left: Breadcrumb */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          {routeInfo.parent && (
            <>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                {routeInfo.parent}
              </span>
              <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
            </>
          )}
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "#f0f4ff", margin: 0 }}>
            {routeInfo.title}
          </h1>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* Search hint */}
          {/* <button className="topbar-btn" style={{ width: "auto", padding: "0 12px", gap: 8 }}
            onClick={() => toast.info("Search coming soon!")}>
            <Search size={15} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Search...</span>
            <span style={{
              fontSize: 10, color: "rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.06)",
              padding: "2px 5px", borderRadius: 4,
              fontFamily: "monospace",
            }}>⌘K</span>
          </button> */}

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button className="topbar-btn" onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}>
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 6, right: 6,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#ef4444",
                  border: "2px solid #080c14",
                }} />
              )}
            </button>

            {showNotifs && (
              <div className="dropdown" style={{ minWidth: 300 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f4ff" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ fontSize: 11, color: "#60a5fa", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: "16px 8px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                    No notifications
                  </div>
                ) : notifications.map((n) => (
                  <div key={n.id} style={{
                    padding: "9px 10px", borderRadius: 8,
                    background: n.is_read ? "none" : "rgba(37,99,235,0.08)",
                    marginBottom: 2,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: n.is_read ? "rgba(255,255,255,0.5)" : "#f0f4ff", marginBottom: 2 }}>
                      {n.title}
                    </div>
                    {n.message && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{n.message}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
              style={{
                width: 36, height: 36, borderRadius: 9,
                background: avatarUrl ? 'transparent' : "linear-gradient(135deg, #2563eb, #7c3aed)",
                border: avatarUrl ? "1px solid rgba(255,255,255,0.1)" : "none",
                cursor: "pointer",
                fontSize: 13, fontWeight: 700, color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", padding: 0,
              }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials}
            </button>

            {showUserMenu && (
              <div className="dropdown">
                <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f4ff" }}>{fullName}</div>
                </div>
                <Link href="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <User size={14} /> My Profile
                </Link>
                <button className="dropdown-item danger" onClick={handleSignOut}>
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Click outside to close */}
        {(showNotifs || showUserMenu) && (
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => { setShowNotifs(false); setShowUserMenu(false); }} />
        )}
      </header>
    </>
  );
}
