"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Package, ArrowLeft, ArrowRight, Lock, Eye, EyeOff, CheckCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ─── Schemas ───────────────────────────────────────────────
const emailSchema = z.object({
    email: z.string().email("Enter a valid email address"),
});

const passwordSchema = z
    .object({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[0-9]/, "Must contain at least one number"),
        confirm_password: z.string(),
    })
    .refine((d) => d.password === d.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ─── Password Strength ─────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
    const score = !password
        ? 0
        : password.length >= 12 && /[!@#$%^&*]/.test(password)
            ? 3
            : password.length >= 8 && /[0-9]/.test(password)
                ? 2
                : 1;
    const colors = ["", "#ef4444", "#f59e0b", "#22c55e"];
    const labels = ["", "Weak", "Medium", "Strong"];
    return password ? (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 4, flex: 1 }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} style={{
                        height: 3, flex: 1, borderRadius: 99,
                        background: i <= score ? colors[score] : "rgba(255,255,255,0.1)",
                        transition: "background 0.3s",
                    }} />
                ))}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: colors[score] }}>{labels[score]}</span>
        </div>
    ) : null;
}

// ─── OTP Input ─────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const OTP_LENGTH = 6;
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const digits = value.split("").concat(Array(OTP_LENGTH).fill("")).slice(0, OTP_LENGTH);

    const handleChange = (index: number, val: string) => {
        const clean = val.replace(/\D/g, "").slice(-1);
        const newDigits = [...digits];
        newDigits[index] = clean;
        const newValue = newDigits.join("");
        onChange(newValue);
        if (clean && index < OTP_LENGTH - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
        if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        onChange(pasted);
        const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        inputs.current[nextIndex]?.focus();
    };

    return (
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {digits.map((digit, i) => (
                <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    style={{
                        width: 52, height: 60,
                        textAlign: "center",
                        fontSize: 24, fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        background: digit ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                        border: digit ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        color: "#f0f4ff",
                        outline: "none",
                        transition: "all 0.2s",
                        caretColor: "#3b82f6",
                        boxShadow: digit ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
                    }}
                />
            ))}
        </div>
    );
}

// ─── Step Indicator ────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
    const steps = ["Email", "Verify OTP", "New Password"];
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
            {steps.map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "unset" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: i < current ? "#22c55e" : i === current ? "#2563eb" : "rgba(255,255,255,0.08)",
                            border: i === current ? "2px solid rgba(59,130,246,0.5)" : "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.3s",
                            boxShadow: i === current ? "0 0 16px rgba(37,99,235,0.4)" : "none",
                        }}>
                            {i < current
                                ? <CheckCircle size={16} color="white" />
                                : <span style={{ fontSize: 13, fontWeight: 700, color: i === current ? "white" : "rgba(255,255,255,0.3)" }}>{i + 1}</span>
                            }
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: i === current ? "#60a5fa" : i < current ? "#22c55e" : "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
                            {label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div style={{
                            flex: 1, height: 2, marginBottom: 18, marginLeft: 8, marginRight: 8,
                            background: i < current ? "#22c55e" : "rgba(255,255,255,0.08)",
                            transition: "background 0.3s",
                        }} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────
export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(0); // 0: email, 1: otp, 2: password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
    const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
    const password = passwordForm.watch("password", "");

    // Step 1: Send OTP
    const onSendOtp = async (data: EmailForm) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.resetPasswordForEmail(data.email);
            if (error) { toast.error(error.message); return; }
            setEmail(data.email);
            setStep(1);
            toast.success("OTP sent to your email!");
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 1.5: Resend OTP
    const onResendOtp = async () => {
        setIsResending(true);
        try {
            const supabase = createClient();
            await supabase.auth.resetPasswordForEmail(email);
            toast.success("New OTP sent!");
            setOtp("");
            setOtpError("");
        } catch {
            toast.error("Failed to resend. Try again.");
        } finally {
            setIsResending(false);
        }
    };

    // Step 2: Verify OTP
    const onVerifyOtp = async () => {
        if (otp.length < 6) { setOtpError("Please enter the complete 6-digit code"); return; }
        setIsLoading(true);
        setOtpError("");
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: "recovery",
            });
            if (error) { setOtpError("Invalid or expired code. Please try again."); return; }
            setStep(2);
            toast.success("OTP verified!");
        } catch {
            setOtpError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Update Password
    const onUpdatePassword = async (data: PasswordForm) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ password: data.password });
            if (error) { toast.error(error.message); return; }
            toast.success("Password updated successfully!");
            router.push("/login");
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6"
            style={{ background: "#080c14", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .su { animation: slideUp 0.5s ease forwards; }
        .si { animation: slideIn 0.4s ease forwards; }
        .input-field {
          width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
          border-radius:10px; padding:12px 44px; color:#f0f4ff; font-size:14px;
          font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:all 0.2s;
        }
        .input-field:focus { border-color:rgba(59,130,246,0.6); background:rgba(59,130,246,0.05); box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
        .input-field::placeholder { color:rgba(255,255,255,0.25); }
        .input-field.error { border-color:rgba(239,68,68,0.6); }
        .otp-input:focus { border-color:rgba(59,130,246,0.6) !important; box-shadow:0 0 0 3px rgba(59,130,246,0.15) !important; background:rgba(59,130,246,0.1) !important; }
        .primary-btn {
          width:100%; padding:13px; background:linear-gradient(135deg,#2563eb,#1d4ed8);
          border:none; border-radius:10px; color:white; font-size:15px; font-weight:600;
          font-family:'Plus Jakarta Sans',sans-serif; cursor:pointer; transition:all 0.2s;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 4px 24px rgba(37,99,235,0.35);
        }
        .primary-btn:hover:not(:disabled) { background:linear-gradient(135deg,#3b82f6,#2563eb); transform:translateY(-1px); box-shadow:0 6px 32px rgba(37,99,235,0.5); }
        .primary-btn:disabled { opacity:0.7; cursor:not-allowed; transform:none; }
        .ghost-btn {
          background:none; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif;
          transition:all 0.2s;
        }
        .ghost-btn:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>

            <div className="w-full max-w-[440px]">
                {/* Logo */}
                <div className="su" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, justifyContent: "center" }}>
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
                    {/* Step Indicator */}
                    <StepIndicator current={step} />

                    {/* ── STEP 0: Email ── */}
                    {step === 0 && (
                        <div className="si">
                            <div style={{ marginBottom: 28 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12,
                                    background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
                                }}>
                                    <Mail size={22} color="#60a5fa" />
                                </div>
                                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f0f4ff", letterSpacing: "-0.5px", marginBottom: 8 }}>
                                    Forgot your password?
                                </h2>
                                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                                    Enter your email and we&apos;ll send a 6-digit OTP to reset your password.
                                </p>
                            </div>

                            <form onSubmit={emailForm.handleSubmit(onSendOtp)}>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 7 }}>
                                        Email address
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <Mail size={16} color="rgba(255,255,255,0.3)"
                                            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                        <input {...emailForm.register("email")} type="email" placeholder="you@company.com"
                                            className={`input-field ${emailForm.formState.errors.email ? "error" : ""}`} />
                                    </div>
                                    {emailForm.formState.errors.email && (
                                        <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>{emailForm.formState.errors.email.message}</p>
                                    )}
                                </div>

                                <button type="submit" className="primary-btn" disabled={isLoading} style={{ marginBottom: 16 }}>
                                    {isLoading
                                        ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Sending OTP...</>
                                        : <>Send OTP <ArrowRight size={16} /></>
                                    }
                                </button>

                                <div style={{ textAlign: "center" }}>
                                    <Link href="/login" style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                                        <ArrowLeft size={14} /> Back to sign in
                                    </Link>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ── STEP 1: OTP Verify ── */}
                    {step === 1 && (
                        <div className="si">
                            <div style={{ marginBottom: 28 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12,
                                    background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
                                }}>
                                    <ShieldCheck size={22} color="#60a5fa" />
                                </div>
                                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f0f4ff", letterSpacing: "-0.5px", marginBottom: 8 }}>
                                    Enter OTP code
                                </h2>
                                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                                    We sent a 6-digit code to{" "}
                                    <span style={{ color: "#60a5fa", fontWeight: 600 }}>{email}</span>
                                </p>
                            </div>

                            {/* OTP Boxes */}
                            <div style={{ marginBottom: 8 }}>
                                <OtpInput value={otp} onChange={(v) => { setOtp(v); setOtpError(""); }} />
                                {otpError && (
                                    <p style={{ fontSize: 12, color: "#f87171", marginTop: 10, textAlign: "center" }}>{otpError}</p>
                                )}
                            </div>

                            {/* Resend */}
                            <div style={{ textAlign: "center", marginBottom: 24, marginTop: 12 }}>
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Didn&apos;t receive the code? </span>
                                <button className="ghost-btn" onClick={onResendOtp} disabled={isResending}
                                    style={{ fontSize: 13, color: "#60a5fa", fontWeight: 600 }}>
                                    {isResending ? "Sending..." : "Resend OTP"}
                                </button>
                            </div>

                            <button className="primary-btn" onClick={onVerifyOtp} disabled={isLoading || otp.length < 6} style={{ marginBottom: 16 }}>
                                {isLoading
                                    ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Verifying...</>
                                    : <>Verify OTP <ArrowRight size={16} /></>
                                }
                            </button>

                            <div style={{ textAlign: "center" }}>
                                <button className="ghost-btn" onClick={() => { setStep(0); setOtp(""); setOtpError(""); }}
                                    style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                                    <ArrowLeft size={14} /> Change email
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: New Password ── */}
                    {step === 2 && (
                        <div className="si">
                            <div style={{ marginBottom: 28 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12,
                                    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
                                }}>
                                    <Lock size={22} color="#22c55e" />
                                </div>
                                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f0f4ff", letterSpacing: "-0.5px", marginBottom: 8 }}>
                                    Set new password
                                </h2>
                                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                                    OTP verified! Choose a strong new password.
                                </p>
                            </div>

                            <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)}>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 7 }}>
                                        New Password
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <Lock size={16} color="rgba(255,255,255,0.3)"
                                            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                        <input {...passwordForm.register("password")} type={showPassword ? "text" : "password"}
                                            placeholder="Min 8 chars + number"
                                            className={`input-field ${passwordForm.formState.errors.password ? "error" : ""}`}
                                            style={{ paddingRight: 44 }} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <PasswordStrength password={password} />
                                    {passwordForm.formState.errors.password && (
                                        <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>{passwordForm.formState.errors.password.message}</p>
                                    )}
                                </div>

                                <div style={{ marginBottom: 28 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 7 }}>
                                        Confirm Password
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <Lock size={16} color="rgba(255,255,255,0.3)"
                                            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                        <input {...passwordForm.register("confirm_password")} type={showConfirm ? "text" : "password"}
                                            placeholder="Repeat your password"
                                            className={`input-field ${passwordForm.formState.errors.confirm_password ? "error" : ""}`}
                                            style={{ paddingRight: 44 }} />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
                                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {passwordForm.formState.errors.confirm_password && (
                                        <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>{passwordForm.formState.errors.confirm_password.message}</p>
                                    )}
                                </div>

                                <button type="submit" className="primary-btn" disabled={isLoading}>
                                    {isLoading
                                        ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Updating...</>
                                        : <>Update Password <ArrowRight size={16} /></>
                                    }
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ textAlign: "center", marginTop: 24 }}>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                        CoreInventory IMS · Secure · Real-time · Reliable
                    </p>
                </div>
            </div>
        </div>
    );
}
