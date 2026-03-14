"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, Package, ArrowRight, Zap, Globe, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const loginSchema = z.object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const floatingIcons = [
    { icon: "📦", x: "10%", y: "15%", delay: "0s", duration: "6s" },
    { icon: "🏭", x: "75%", y: "10%", delay: "1s", duration: "8s" },
    { icon: "📊", x: "20%", y: "70%", delay: "2s", duration: "7s" },
    { icon: "🔄", x: "80%", y: "65%", delay: "0.5s", duration: "9s" },
    { icon: "📋", x: "50%", y: "20%", delay: "1.5s", duration: "6.5s" },
    { icon: "⚡", x: "60%", y: "75%", delay: "3s", duration: "7.5s" },
    { icon: "📦", x: "35%", y: "45%", delay: "2.5s", duration: "8.5s" },
];

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });
            if (error) {
                toast.error(error.message);
                return;
            }
            toast.success("Welcome back!");
            router.push("/dashboard");
            router.refresh();
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: "#080c14", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.15; }
          50% { transform: translateY(-20px) rotate(5deg); opacity: 0.3; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.07; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .float-icon { animation: float var(--duration) ease-in-out infinite; animation-delay: var(--delay); }
        .slide-up { animation: slideUp 0.6s ease forwards; }
        .slide-up-1 { animation: slideUp 0.6s ease 0.1s forwards; opacity: 0; }
        .slide-up-2 { animation: slideUp 0.6s ease 0.2s forwards; opacity: 0; }
        .slide-up-3 { animation: slideUp 0.6s ease 0.3s forwards; opacity: 0; }
        .slide-up-4 { animation: slideUp 0.6s ease 0.4s forwards; opacity: 0; }
        .slide-up-5 { animation: slideUp 0.6s ease 0.5s forwards; opacity: 0; }
        .slide-right { animation: slideRight 0.8s ease 0.2s forwards; opacity: 0; }
        .slide-right-2 { animation: slideRight 0.8s ease 0.4s forwards; opacity: 0; }
        .slide-right-3 { animation: slideRight 0.8s ease 0.6s forwards; opacity: 0; }
        .grid-bg { animation: gridPulse 4s ease-in-out infinite; }
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 12px 44px 12px 44px;
          color: #f0f4ff;
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }
        .input-field:focus {
          border-color: rgba(59, 130, 246, 0.6);
          background: rgba(59, 130, 246, 0.05);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .input-field::placeholder { color: rgba(255,255,255,0.25); }
        .input-field.error { border-color: rgba(239, 68, 68, 0.6); }
        .sign-in-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 24px rgba(37, 99, 235, 0.35);
        }
        .sign-in-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          box-shadow: 0 6px 32px rgba(37, 99, 235, 0.5);
          transform: translateY(-1px);
        }
        .sign-in-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .feature-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          backdrop-filter: blur(8px);
        }
        .scanline {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(59,130,246,0.15), transparent);
          animation: scanline 8s linear infinite;
          pointer-events: none;
        }
      `}</style>

            {/* LEFT PANEL */}
            <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-12"
                style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>

                {/* Grid background */}
                <div className="grid-bg absolute inset-0" style={{
                    backgroundImage: `linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                }} />

                {/* Scanline effect */}
                <div className="scanline" />

                {/* Radial glow */}
                <div className="absolute inset-0" style={{
                    background: "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(37,99,235,0.08) 0%, transparent 70%)"
                }} />

                {/* Floating icons */}
                {floatingIcons.map((item, i) => (
                    <div key={i} className="float-icon absolute text-4xl select-none pointer-events-none"
                        style={{
                            left: item.x, top: item.y,
                            "--duration": item.duration,
                            "--delay": item.delay,
                        } as React.CSSProperties}>
                        {item.icon}
                    </div>
                ))}

                {/* Logo */}
                <div className="slide-right relative z-10">
                    <div className="flex items-center gap-3">
                        <div style={{
                            width: 42, height: 42,
                            background: "linear-gradient(135deg, #2563eb, #1e40af)",
                            borderRadius: 10,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 0 24px rgba(37,99,235,0.4)"
                        }}>
                            <Package size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: "#f0f4ff", letterSpacing: "-0.5px" }}>
                                CoreInventory
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "2px", textTransform: "uppercase" }}>
                                Management System
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center content */}
                <div className="relative z-10 flex flex-col gap-8">
                    <div className="slide-right-2">
                        <div style={{
                            fontSize: 11, fontWeight: 600, letterSpacing: "3px",
                            textTransform: "uppercase", color: "#3b82f6", marginBottom: 16
                        }}>
                            ◆ Inventory Intelligence
                        </div>
                        <h1 style={{
                            fontSize: 48, fontWeight: 800, lineHeight: 1.1,
                            color: "#f0f4ff", letterSpacing: "-1.5px", marginBottom: 16
                        }}>
                            Streamline your stock.<br />
                            <span style={{
                                background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                            }}>
                                Simplify your ops.
                            </span>
                        </h1>
                        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 420 }}>
                            Replace manual registers and scattered Excel sheets with a centralized, real-time inventory platform built for modern warehouses.
                        </p>
                    </div>

                    {/* Feature pills */}
                    <div className="slide-right-3 flex flex-col gap-3">
                        {[
                            { icon: <Zap size={16} color="#facc15" />, label: "Real-time stock tracking", desc: "Live updates across all locations" },
                            { icon: <Globe size={16} color="#34d399" />, label: "Multi-warehouse support", desc: "Manage unlimited warehouses" },
                            { icon: <Bell size={16} color="#f87171" />, label: "Smart low-stock alerts", desc: "Never run out of critical items" },
                        ].map((f, i) => (
                            <div key={i} className="feature-pill">
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: "rgba(255,255,255,0.06)",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                                }}>
                                    {f.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f4ff" }}>{f.label}</div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{f.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom stats */}
                <div className="slide-right relative z-10 flex gap-8">
                    {[
                        { value: "99.9%", label: "Uptime" },
                        { value: "< 1s", label: "Sync speed" },
                        { value: "∞", label: "Products" },
                    ].map((stat, i) => (
                        <div key={i}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "#3b82f6" }}>{stat.value}</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL — Login Form */}
            <div className="w-full lg:w-[42%] flex items-center justify-center p-6 lg:p-12 relative">

                {/* Mobile logo */}
                <div className="lg:hidden absolute top-8 left-6 flex items-center gap-2">
                    <div style={{
                        width: 34, height: 34,
                        background: "linear-gradient(135deg, #2563eb, #1e40af)",
                        borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Package size={18} color="white" />
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#f0f4ff" }}>CoreInventory</span>
                </div>

                <div className="w-full max-w-[400px]">
                    {/* Form card */}
                    <div style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 20,
                        padding: "40px 36px",
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)"
                    }}>

                        {/* Header */}
                        <div className="slide-up-1" style={{ marginBottom: 32 }}>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "5px 12px",
                                background: "rgba(37,99,235,0.15)",
                                border: "1px solid rgba(37,99,235,0.3)",
                                borderRadius: 20, marginBottom: 16
                            }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#60a5fa", letterSpacing: "1px", textTransform: "uppercase" }}>
                                    Secure Access
                                </span>
                            </div>
                            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f0f4ff", letterSpacing: "-0.5px", marginBottom: 6 }}>
                                Welcome back
                            </h2>
                            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                                Sign in to your CoreInventory account
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            {/* Email */}
                            <div className="slide-up-2" style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
                                    Email address
                                </label>
                                <div style={{ position: "relative" }}>
                                    <Mail size={16} color="rgba(255,255,255,0.3)"
                                        style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                    <input
                                        {...register("email")}
                                        type="email"
                                        placeholder="you@company.com"
                                        className={`input-field ${errors.email ? "error" : ""}`}
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && (
                                    <p style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="slide-up-3" style={{ marginBottom: 8 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
                                    Password
                                </label>
                                <div style={{ position: "relative" }}>
                                    <Lock size={16} color="rgba(255,255,255,0.3)"
                                        style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                    <input
                                        {...register("password")}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={`input-field ${errors.password ? "error" : ""}`}
                                        autoComplete="current-password"
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                                            background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.3)"
                                        }}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>{errors.password.message}</p>
                                )}
                            </div>

                            {/* Forgot password */}
                            <div className="slide-up-3" style={{ textAlign: "right", marginBottom: 24 }}>
                                <Link href="/forgot-password" style={{ fontSize: 13, color: "#60a5fa", textDecoration: "none", fontWeight: 500 }}>
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <div className="slide-up-4" style={{ marginBottom: 24 }}>
                                <button type="submit" className="sign-in-btn" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <div style={{
                                                width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                                                borderTopColor: "white", borderRadius: "50%",
                                                animation: "spin 0.7s linear infinite"
                                            }} />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>Sign In <ArrowRight size={16} /></>
                                    )}
                                </button>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>

                            {/* Sign up link */}
                            <div className="slide-up-5" style={{ textAlign: "center" }}>
                                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
                                    Don&apos;t have an account?{" "}
                                </span>
                                <Link href="/signup" style={{ fontSize: 14, color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>
                                    Sign up
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="slide-up-5" style={{ textAlign: "center", marginTop: 24 }}>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                            CoreInventory IMS · Secure · Real-time · Reliable
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
