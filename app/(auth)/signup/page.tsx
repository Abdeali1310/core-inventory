"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User, Package, ArrowRight, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const signupSchema = z
    .object({
        full_name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Enter a valid email address"),
        role: z.enum(["manager", "staff"] as const, { message: "Please select a role" }), password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[0-9]/, "Password must contain at least one number"),
        confirm_password: z.string(),
    })
    .refine((d) => d.password === d.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

type SignupForm = z.infer<typeof signupSchema>;

function PasswordStrength({ password }: { password: string }) {
    const score = !password ? 0 : password.length >= 12 && /[!@#$%^&*]/.test(password) ? 3 : password.length >= 8 && /[0-9]/.test(password) ? 2 : 1;
    const labels = ["", "Weak", "Medium", "Strong"];
    const colors = ["", "#ef4444", "#f59e0b", "#22c55e"];
    return password ? (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 4, flex: 1 }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} style={{
                        height: 3, flex: 1, borderRadius: 99,
                        background: i <= score ? colors[score] : "rgba(255,255,255,0.1)",
                        transition: "background 0.3s ease"
                    }} />
                ))}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: colors[score] }}>{labels[score]}</span>
        </div>
    ) : null;
}

export default function SignupPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

    const password = watch("password", "");

    const onSubmit = async (data: SignupForm) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: { full_name: data.full_name, role: data.role },
                },
            });
            if (error) { toast.error(error.message); return; }
            toast.success("Account created!");
            router.push("/login");
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#080c14", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .su1 { animation: slideUp 0.5s ease 0.1s forwards; opacity:0; }
        .su2 { animation: slideUp 0.5s ease 0.2s forwards; opacity:0; }
        .su3 { animation: slideUp 0.5s ease 0.3s forwards; opacity:0; }
        .su4 { animation: slideUp 0.5s ease 0.4s forwards; opacity:0; }
        .su5 { animation: slideUp 0.5s ease 0.5s forwards; opacity:0; }
        .su6 { animation: slideUp 0.5s ease 0.6s forwards; opacity:0; }
        .input-field {
          width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
          border-radius:10px; padding:12px 44px; color:#f0f4ff; font-size:14px;
          font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:all 0.2s;
        }
        .input-field:focus { border-color:rgba(59,130,246,0.6); background:rgba(59,130,246,0.05); box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
        .input-field::placeholder { color:rgba(255,255,255,0.25); }
        .input-field.error { border-color:rgba(239,68,68,0.6); }
        .role-card {
          flex:1; padding:14px 12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
          border-radius:10px; cursor:pointer; transition:all 0.2s; text-align:center;
        }
        .role-card:hover { background:rgba(59,130,246,0.08); border-color:rgba(59,130,246,0.3); }
        .role-card.selected { background:rgba(59,130,246,0.12); border-color:rgba(59,130,246,0.5); box-shadow:0 0 0 2px rgba(59,130,246,0.15); }
        .submit-btn {
          width:100%; padding:13px; background:linear-gradient(135deg,#2563eb,#1d4ed8);
          border:none; border-radius:10px; color:white; font-size:15px; font-weight:600;
          font-family:'Plus Jakarta Sans',sans-serif; cursor:pointer; transition:all 0.2s;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 4px 24px rgba(37,99,235,0.35);
        }
        .submit-btn:hover:not(:disabled) { background:linear-gradient(135deg,#3b82f6,#2563eb); transform:translateY(-1px); box-shadow:0 6px 32px rgba(37,99,235,0.5); }
        .submit-btn:disabled { opacity:0.7; cursor:not-allowed; }
      `}</style>

            <div className="w-full max-w-[440px]">
                {/* Logo */}
                <div className="su1" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, justifyContent: "center" }}>
                    <div style={{
                        width: 38, height: 38, background: "linear-gradient(135deg,#2563eb,#1e40af)",
                        borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 20px rgba(37,99,235,0.4)"
                    }}>
                        <Package size={20} color="white" />
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#f0f4ff" }}>CoreInventory</span>
                </div>

                {/* Card */}
                <div style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 20, padding: "36px 32px",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)"
                }}>
                    <div className="su2" style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f0f4ff", letterSpacing: "-0.5px", marginBottom: 6 }}>
                            Create your account
                        </h2>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                            Join CoreInventory and take control of your stock
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Full Name */}
                        <div className="su3" style={{ marginBottom: 14 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 7 }}>Full Name</label>
                            <div style={{ position: "relative" }}>
                                <User size={16} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                <input {...register("full_name")} placeholder="John Smith" className={`input-field ${errors.full_name ? "error" : ""}`} />
                            </div>
                            {errors.full_name && <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>{errors.full_name.message}</p>}
                        </div>

                        {/* Email */}
                        <div className="su3" style={{ marginBottom: 14 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 7 }}>Email Address</label>
                            <div style={{ position: "relative" }}>
                                <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                <input {...register("email")} type="email" placeholder="you@company.com" className={`input-field ${errors.email ? "error" : ""}`} />
                            </div>
                            {errors.email && <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>{errors.email.message}</p>}
                        </div>

                        {/* Role */}
                        <div className="su4" style={{ marginBottom: 14 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 7 }}>Your Role</label>
                            <div style={{ display: "flex", gap: 10 }}>
                                {[
                                    { value: "manager", label: "Inventory Manager", icon: <ShieldCheck size={18} color="#60a5fa" /> },
                                    { value: "staff", label: "Warehouse Staff", icon: <Users size={18} color="#34d399" /> },
                                ].map((r) => (
                                    <label key={r.value} className={`role-card ${watch("role") === r.value ? "selected" : ""}`}>
                                        <input {...register("role")} type="radio" value={r.value} style={{ display: "none" }} />
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                            {r.icon}
                                            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{r.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {errors.role && <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>{errors.role.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="su4" style={{ marginBottom: 14 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 7 }}>Password</label>
                            <div style={{ position: "relative" }}>
                                <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                <input {...register("password")} type={showPassword ? "text" : "password"} placeholder="Min 8 chars + number"
                                    className={`input-field ${errors.password ? "error" : ""}`} style={{ paddingRight: 44 }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <PasswordStrength password={password} />
                            {errors.password && <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>{errors.password.message}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="su5" style={{ marginBottom: 24 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 7 }}>Confirm Password</label>
                            <div style={{ position: "relative" }}>
                                <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                <input {...register("confirm_password")} type={showConfirm ? "text" : "password"} placeholder="Repeat your password"
                                    className={`input-field ${errors.confirm_password ? "error" : ""}`} style={{ paddingRight: 44 }} />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.confirm_password && <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>{errors.confirm_password.message}</p>}
                        </div>

                        {/* Submit */}
                        <div className="su6" style={{ marginBottom: 20 }}>
                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? (
                                    <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Creating account...</>
                                ) : (
                                    <>Create Account <ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>

                        <div className="su6" style={{ textAlign: "center" }}>
                            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Already have an account? </span>
                            <Link href="/login" style={{ fontSize: 14, color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
