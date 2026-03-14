'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    User, Mail, Shield, Camera, Loader2, Eye, EyeOff,
    LogOut, KeyRound, Save, AlertTriangle
} from 'lucide-react';

interface Profile {
    full_name: string | null;
    email: string | null;
    role: string | null;
    avatar_url: string | null;
}

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { label: 'At least 8 characters', ok: password.length >= 8 },
        { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
        { label: 'Number', ok: /[0-9]/.test(password) },
        { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
    ];
    const score = checks.filter(c => c.ok).length;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];

    if (!password) return null;

    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.2s',
                    }} />
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: score > 0 ? colors[score - 1] : '#64748b' }}>
                    {score > 0 ? labels[score - 1] : ''}
                </span>
                <div style={{ display: 'flex', gap: 10 }}>
                    {checks.map(c => (
                        <span key={c.label} style={{ fontSize: 10, color: c.ok ? '#34d399' : '#475569' }}>
                            {c.ok ? '✓' : '○'} {c.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Edit profile
    const [fullName, setFullName] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    // Change password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // Sign out all
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        const load = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);
            const { data } = await supabase
                .from('profiles')
                .select('full_name, email, role, avatar_url')
                .eq('id', user.id)
                .single();
            if (data) {
                setProfile(data);
                setFullName(data.full_name || '');
                if (data.avatar_url) {
                    const { data: urlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(data.avatar_url);
                    setAvatarUrl(urlData.publicUrl);
                }
            }
        };
        load();
    }, []);

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('Image must be under 2MB');
            return;
        }

        setUploading(true);
        try {
            const supabase = createClient();
            const ext = file.name.split('.').pop();
            const path = `${userId}/avatar.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(path, file, { upsert: true });

            if (uploadError) {
                // If bucket doesn't exist, show helpful message
                if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
                    toast.error('Avatar storage not set up. Create an "avatars" bucket in Supabase Storage.');
                    return;
                }
                throw uploadError;
            }

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
            setAvatarUrl(urlData.publicUrl + '?t=' + Date.now());

            await supabase.from('profiles').update({ avatar_url: path }).eq('id', userId);
            toast.success('Avatar updated');
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!userId || !fullName.trim()) {
            toast.error('Name cannot be empty');
            return;
        }
        setSavingProfile(true);
        try {
            const supabase = createClient();

            // Check session first
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Session expired, please sign in again');
                router.push('/login');
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName.trim() })
                .eq('id', session.user.id);  // use session.user.id instead of state

            if (error) {
                console.error('Profile update error:', error);
                toast.error(error.message);
                return;
            }

            setProfile(prev => prev ? { ...prev, full_name: fullName.trim() } : prev);
            toast.success('Profile updated');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            toast.error('Please fill in all password fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        setSavingPassword(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update password');
        } finally {
            setSavingPassword(false);
        }
    };

    const handleSignOutAll = async () => {
        setSigningOut(true);
        try {
            const supabase = createClient();
            await supabase.auth.signOut({ scope: 'global' });
            toast.success('Signed out from all devices');
            router.push('/login');
        } catch (err: any) {
            toast.error(err.message || 'Failed to sign out');
            setSigningOut(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        color: '#e2e8f0',
        fontSize: 14,
        outline: 'none',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        boxSizing: 'border-box' as const,
    };

    const labelStyle = {
        display: 'block',
        fontSize: 11,
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        marginBottom: 6,
    };

    const sectionStyle = {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
    };

    return (
        <div style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: '8px 0 40px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
            {/* Page Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>My Profile</h1>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Manage your account settings and preferences
                </p>
            </div>

            {/* ── Profile Card ── */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            border: '2px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                            fontSize: 24, fontWeight: 700, color: 'white',
                        }}>
                            {avatarUrl
                                ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : initials}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{
                                position: 'absolute', bottom: -2, right: -2,
                                width: 26, height: 26, borderRadius: '50%',
                                background: '#1e40af',
                                border: '2px solid #080c14',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                color: 'white',
                            }}
                        >
                            {uploading
                                ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                                : <Camera size={11} />}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>
                            {profile?.full_name || 'User'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Mail size={12} color="#64748b" />
                            <span style={{ fontSize: 13, color: '#64748b' }}>{profile?.email}</span>
                        </div>
                        <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: profile?.role === 'manager' ? '#60a5fa' : '#34d399',
                            background: profile?.role === 'manager' ? 'rgba(37,99,235,0.15)' : 'rgba(52,211,153,0.12)',
                            border: `1px solid ${profile?.role === 'manager' ? 'rgba(37,99,235,0.25)' : 'rgba(52,211,153,0.2)'}`,
                            padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize',
                        }}>
                            <Shield size={9} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                            {profile?.role || 'staff'}
                        </span>
                    </div>
                </div>

                {/* Role description */}
                <div style={{
                    marginTop: 16, padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8, fontSize: 12, color: '#64748b',
                }}>
                    {profile?.role === 'manager'
                        ? '🔑 As a Manager, you have full access including validating operations, managing products, warehouses, and settings.'
                        : '👤 As Staff, you can create drafts, perform transfers, and count stock. Contact a manager to validate operations.'}
                </div>
            </div>

            {/* ── Edit Profile ── */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(37,99,235,0.1)',
                        border: '1px solid rgba(37,99,235,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <User size={15} color="#3b82f6" />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff' }}>Edit Profile</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Update your display name</div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={labelStyle}>Full Name</label>
                        <input
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="Your full name"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Email Address</label>
                        <input
                            value={profile?.email || ''}
                            readOnly
                            style={{ ...inputStyle, color: '#64748b', cursor: 'not-allowed' }}
                        />
                        <p style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                            Email cannot be changed here. Contact support if needed.
                        </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleSaveProfile}
                            disabled={savingProfile || !fullName.trim()}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 7,
                                padding: '9px 20px', borderRadius: 8,
                                background: savingProfile ? 'rgba(37,99,235,0.5)' : 'linear-gradient(135deg, #2563eb, #1e40af)',
                                border: 'none', color: 'white',
                                fontSize: 13, fontWeight: 600,
                                cursor: savingProfile ? 'not-allowed' : 'pointer',
                                boxShadow: '0 0 20px rgba(37,99,235,0.2)',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                        >
                            {savingProfile ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Change Password ── */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(139,92,246,0.1)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <KeyRound size={15} color="#8b5cf6" />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff' }}>Change Password</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Keep your account secure</div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Current password */}
                    <div>
                        <label style={labelStyle}>Current Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                style={{ ...inputStyle, paddingRight: 40 }}
                            />
                            <button onClick={() => setShowCurrent(p => !p)} style={{
                                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0,
                            }}>
                                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* New password */}
                    <div>
                        <label style={labelStyle}>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                style={{ ...inputStyle, paddingRight: 40 }}
                            />
                            <button onClick={() => setShowNew(p => !p)} style={{
                                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0,
                            }}>
                                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        <PasswordStrength password={newPassword} />
                    </div>

                    {/* Confirm password */}
                    <div>
                        <label style={labelStyle}>Confirm New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                style={{
                                    ...inputStyle, paddingRight: 40,
                                    border: confirmPassword && confirmPassword !== newPassword
                                        ? '1px solid rgba(239,68,68,0.4)' : inputStyle.border,
                                }}
                            />
                            <button onClick={() => setShowConfirm(p => !p)} style={{
                                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0,
                            }}>
                                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        {confirmPassword && confirmPassword !== newPassword && (
                            <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Passwords do not match</p>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleChangePassword}
                            disabled={savingPassword}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 7,
                                padding: '9px 20px', borderRadius: 8,
                                background: savingPassword ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.15)',
                                border: '1px solid rgba(139,92,246,0.3)',
                                color: '#a78bfa', fontSize: 13, fontWeight: 600,
                                cursor: savingPassword ? 'not-allowed' : 'pointer',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                        >
                            {savingPassword ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <KeyRound size={13} />}
                            Update Password
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Danger Zone ── */}
            <div style={{
                ...sectionStyle,
                border: '1px solid rgba(239,68,68,0.15)',
                background: 'rgba(239,68,68,0.03)',
                marginBottom: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <AlertTriangle size={15} color="#ef4444" />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f87171' }}>Danger Zone</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Irreversible account actions</div>
                    </div>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8,
                }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Sign out from all devices</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            This will invalidate all active sessions on every device.
                        </div>
                    </div>
                    <button
                        onClick={handleSignOutAll}
                        disabled={signingOut}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '8px 16px', borderRadius: 8,
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171', fontSize: 13, fontWeight: 600,
                            cursor: signingOut ? 'not-allowed' : 'pointer',
                            opacity: signingOut ? 0.7 : 1,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            flexShrink: 0, marginLeft: 16,
                        }}
                    >
                        {signingOut ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <LogOut size={13} />}
                        Sign Out All
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #475569; }
        input:focus { border-color: rgba(37,99,235,0.4) !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
      `}</style>
        </div>
    );
}
