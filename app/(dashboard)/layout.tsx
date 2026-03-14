import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ background: "#080c14", minHeight: "100vh" }}>
            <Sidebar />
            <Topbar />
            <main style={{
                marginLeft: 260,
                paddingTop: 64,
                minHeight: "100vh",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
                <div style={{ padding: "28px 32px" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
