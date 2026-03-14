'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, Check, Building2, MapPin, Tag } from 'lucide-react';
import {
    createWarehouse, updateWarehouse, toggleWarehouseActive,
    createLocation, updateLocation, deleteLocation,
    createCategory, updateCategory, deleteCategory,
} from '@/lib/actions/settings';

interface Warehouse {
    id: string; name: string; code: string; address: string | null; is_active: boolean;
}
interface Location {
    id: string; name: string; code: string | null; warehouse_id: string; warehouse_name: string;
}
interface Category {
    id: string; name: string;
}

interface Props {
    warehouses: Warehouse[];
    locations: Location[];
    categories: Category[];
}

const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
};

const labelStyle = {
    fontSize: 11, fontWeight: 600 as const,
    color: '#94a3b8', textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', marginBottom: 6, display: 'block',
};

const thStyle = {
    padding: '10px 16px', textAlign: 'left' as const,
    fontSize: 11, fontWeight: 600, color: '#64748b',
    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
};

const tdStyle = {
    padding: '12px 16px', fontSize: 13,
    color: '#e2e8f0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
};

type Tab = 'warehouses' | 'locations' | 'categories';

export default function SettingsClient({ warehouses: initialWarehouses, locations: initialLocations, categories: initialCategories }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('warehouses');
    const [warehouses, setWarehouses] = useState(initialWarehouses);
    const [locations, setLocations] = useState(initialLocations);
    const [categories, setCategories] = useState(initialCategories);
    const [loading, setLoading] = useState(false);

    // Warehouse form state
    const [whSheet, setWhSheet] = useState(false);
    const [whEdit, setWhEdit] = useState<Warehouse | null>(null);
    const [whName, setWhName] = useState('');
    const [whCode, setWhCode] = useState('');
    const [whAddress, setWhAddress] = useState('');

    // Location form state
    const [locSheet, setLocSheet] = useState(false);
    const [locEdit, setLocEdit] = useState<Location | null>(null);
    const [locName, setLocName] = useState('');
    const [locCode, setLocCode] = useState('');
    const [locWarehouseId, setLocWarehouseId] = useState('');
    const [locFilter, setLocFilter] = useState('all');

    // Category state
    const [newCatName, setNewCatName] = useState('');
    const [catEdit, setCatEdit] = useState<string | null>(null);
    const [catEditName, setCatEditName] = useState('');

    const refresh = () => window.location.reload();

    // ---- WAREHOUSE ACTIONS ----
    const openWhSheet = (wh?: Warehouse) => {
        setWhEdit(wh || null);
        setWhName(wh?.name || '');
        setWhCode(wh?.code || '');
        setWhAddress(wh?.address || '');
        setWhSheet(true);
    };

    const handleWhSubmit = async () => {
        if (!whName || !whCode) { toast.error('Name and code are required'); return; }
        setLoading(true);
        try {
            if (whEdit) {
                await updateWarehouse(whEdit.id, { name: whName, code: whCode, address: whAddress });
                toast.success('Warehouse updated');
            } else {
                await createWarehouse({ name: whName, code: whCode, address: whAddress });
                toast.success('Warehouse created');
            }
            setWhSheet(false);
            refresh();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleWh = async (id: string) => {
        try {
            await toggleWarehouseActive(id);
            toast.success('Warehouse updated');
            refresh();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // ---- LOCATION ACTIONS ----
    const openLocSheet = (loc?: Location) => {
        setLocEdit(loc || null);
        setLocName(loc?.name || '');
        setLocCode(loc?.code || '');
        setLocWarehouseId(loc?.warehouse_id || (warehouses[0]?.id ?? ''));
        setLocSheet(true);
    };

    const handleLocSubmit = async () => {
        if (!locName || !locWarehouseId) { toast.error('Name and warehouse are required'); return; }
        setLoading(true);
        try {
            if (locEdit) {
                await updateLocation(locEdit.id, { warehouse_id: locWarehouseId, name: locName, code: locCode });
                toast.success('Location updated');
            } else {
                await createLocation({ warehouse_id: locWarehouseId, name: locName, code: locCode });
                toast.success('Location created');
            }
            setLocSheet(false);
            refresh();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLoc = async (id: string) => {
        if (!confirm('Delete this location? This cannot be undone.')) return;
        try {
            await deleteLocation(id);
            toast.success('Location deleted');
            refresh();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // ---- CATEGORY ACTIONS ----
    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        setLoading(true);
        try {
            await createCategory(newCatName.trim());
            toast.success('Category added');
            setNewCatName('');
            refresh();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCategory = async (id: string) => {
        if (!catEditName.trim()) return;
        setLoading(true);
        try {
            await updateCategory(id, catEditName.trim());
            toast.success('Category updated');
            setCatEdit(null);
            refresh();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            await deleteCategory(id);
            toast.success('Category deleted');
            refresh();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const filteredLocations = locFilter === 'all'
        ? locations
        : locations.filter(l => l.warehouse_id === locFilter);

    const tabs: { key: Tab; label: string; icon: any }[] = [
        { key: 'warehouses', label: 'Warehouses', icon: Building2 },
        { key: 'locations', label: 'Locations', icon: MapPin },
        { key: 'categories', label: 'Categories', icon: Tag },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>Settings</h1>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Manage warehouses, locations, and product categories
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 18px', fontSize: 13, background: 'none', border: 'none',
                        fontWeight: activeTab === key ? 600 : 400,
                        color: activeTab === key ? '#60a5fa' : '#64748b',
                        borderBottom: activeTab === key ? '2px solid #2563eb' : '2px solid transparent',
                        cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
                    }}>
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ======= WAREHOUSES TAB ======= */}
            {activeTab === 'warehouses' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                        <button onClick={() => openWhSheet()} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 8,
                            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                            border: 'none', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        }}>
                            <Plus size={14} /> Add Warehouse
                        </button>
                    </div>
                    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Name', 'Code', 'Address', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {warehouses.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No warehouses yet.</td></tr>
                                ) : warehouses.map(wh => (
                                    <tr key={wh.id}>
                                        <td style={{ ...tdStyle, fontWeight: 600 }}>{wh.name}</td>
                                        <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', color: '#60a5fa', fontSize: 12 }}>{wh.code}</td>
                                        <td style={{ ...tdStyle, color: '#94a3b8' }}>{wh.address || '—'}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                                                background: wh.is_active ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                                                color: wh.is_active ? '#34d399' : '#f87171',
                                            }}>
                                                {wh.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => openWhSheet(wh)} style={{
                                                    padding: '5px 8px', borderRadius: 6,
                                                    background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)',
                                                    color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                }}><Pencil size={12} /></button>
                                                <button onClick={() => handleToggleWh(wh.id)} style={{
                                                    padding: '5px 8px', borderRadius: 6,
                                                    background: wh.is_active ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                                                    border: wh.is_active ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(52,211,153,0.2)',
                                                    color: wh.is_active ? '#f87171' : '#34d399',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                }}>
                                                    {wh.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ======= LOCATIONS TAB ======= */}
            {activeTab === 'locations' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <select
                            value={locFilter}
                            onChange={e => setLocFilter(e.target.value)}
                            style={{ ...inputStyle, width: 220, height: 36, padding: '6px 12px' }}
                        >
                            <option value="all">All Warehouses</option>
                            {warehouses.map(wh => (
                                <option key={wh.id} value={wh.id}>{wh.name}</option>
                            ))}
                        </select>
                        <button onClick={() => openLocSheet()} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 8,
                            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                            border: 'none', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        }}>
                            <Plus size={14} /> Add Location
                        </button>
                    </div>
                    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Location Name', 'Code', 'Warehouse', 'Actions'].map(h => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLocations.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No locations found.</td></tr>
                                ) : filteredLocations.map(loc => (
                                    <tr key={loc.id}>
                                        <td style={{ ...tdStyle, fontWeight: 500 }}>{loc.name}</td>
                                        <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', color: '#60a5fa', fontSize: 12 }}>
                                            {loc.code || '—'}
                                        </td>
                                        <td style={{ ...tdStyle, color: '#94a3b8' }}>{loc.warehouse_name}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => openLocSheet(loc)} style={{
                                                    padding: '5px 8px', borderRadius: 6,
                                                    background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)',
                                                    color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                }}><Pencil size={12} /></button>
                                                <button onClick={() => handleDeleteLoc(loc.id)} style={{
                                                    padding: '5px 8px', borderRadius: 6,
                                                    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                                                    color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                }}><Trash2 size={12} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ======= CATEGORIES TAB ======= */}
            {activeTab === 'categories' && (
                <div>
                    {/* Add new category */}
                    <div style={{
                        display: 'flex', gap: 10, marginBottom: 20,
                        padding: 16, background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
                    }}>
                        <input
                            placeholder="New category name..."
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                            style={{ ...inputStyle, flex: 1, height: 36, padding: '7px 12px' }}
                        />
                        <button
                            onClick={handleAddCategory}
                            disabled={loading || !newCatName.trim()}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 16px', borderRadius: 8,
                                background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                                border: 'none', color: 'white', fontWeight: 600, fontSize: 13,
                                cursor: newCatName.trim() ? 'pointer' : 'not-allowed',
                                opacity: newCatName.trim() ? 1 : 0.5,
                            }}
                        >
                            {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                            Add
                        </button>
                    </div>

                    {/* Categories list */}
                    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Category Name', 'Actions'].map(h => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length === 0 ? (
                                    <tr><td colSpan={2} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No categories yet.</td></tr>
                                ) : categories.map(cat => (
                                    <tr key={cat.id}>
                                        <td style={tdStyle}>
                                            {catEdit === cat.id ? (
                                                <input
                                                    value={catEditName}
                                                    onChange={e => setCatEditName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleUpdateCategory(cat.id)}
                                                    autoFocus
                                                    style={{ ...inputStyle, width: 220, height: 32, padding: '4px 10px' }}
                                                />
                                            ) : (
                                                <span style={{ fontWeight: 500 }}>{cat.name}</span>
                                            )}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {catEdit === cat.id ? (
                                                    <>
                                                        <button onClick={() => handleUpdateCategory(cat.id)} style={{
                                                            padding: '5px 8px', borderRadius: 6,
                                                            background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)',
                                                            color: '#34d399', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        }}><Check size={12} /></button>
                                                        <button onClick={() => setCatEdit(null)} style={{
                                                            padding: '5px 8px', borderRadius: 6,
                                                            background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)',
                                                            color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        }}><X size={12} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setCatEdit(cat.id); setCatEditName(cat.name); }} style={{
                                                            padding: '5px 8px', borderRadius: 6,
                                                            background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)',
                                                            color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        }}><Pencil size={12} /></button>
                                                        <button onClick={() => handleDeleteCategory(cat.id)} style={{
                                                            padding: '5px 8px', borderRadius: 6,
                                                            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                                                            color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        }}><Trash2 size={12} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ======= WAREHOUSE SHEET ======= */}
            {whSheet && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'flex-end',
                }} onClick={() => setWhSheet(false)}>
                    <div style={{
                        width: 420, height: '100%', background: '#0d1220',
                        borderLeft: '1px solid rgba(255,255,255,0.08)',
                        padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                                {whEdit ? 'Edit Warehouse' : 'Add Warehouse'}
                            </h2>
                            <button onClick={() => setWhSheet(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div>
                            <label style={labelStyle}>Name *</label>
                            <input value={whName} onChange={e => setWhName(e.target.value)} placeholder="e.g. Main Warehouse" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Code *</label>
                            <input value={whCode} onChange={e => setWhCode(e.target.value.toUpperCase())} placeholder="e.g. WH-MAIN" style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Address</label>
                            <input value={whAddress} onChange={e => setWhAddress(e.target.value)} placeholder="e.g. 123 Industrial Zone" style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                            <button onClick={() => setWhSheet(false)} style={{
                                flex: 1, padding: '9px', borderRadius: 8,
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#94a3b8', cursor: 'pointer', fontSize: 13,
                            }}>Cancel</button>
                            <button onClick={handleWhSubmit} disabled={loading} style={{
                                flex: 1, padding: '9px', borderRadius: 8,
                                background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                                border: 'none', color: 'white', fontWeight: 600, fontSize: 13,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                                {loading && <Loader2 size={13} className="animate-spin" />}
                                {whEdit ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======= LOCATION SHEET ======= */}
            {locSheet && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'flex-end',
                }} onClick={() => setLocSheet(false)}>
                    <div style={{
                        width: 420, height: '100%', background: '#0d1220',
                        borderLeft: '1px solid rgba(255,255,255,0.08)',
                        padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                                {locEdit ? 'Edit Location' : 'Add Location'}
                            </h2>
                            <button onClick={() => setLocSheet(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div>
                            <label style={labelStyle}>Warehouse *</label>
                            <select value={locWarehouseId} onChange={e => setLocWarehouseId(e.target.value)}
                                style={{ ...inputStyle, height: 38 }}>
                                <option value="">Select warehouse...</option>
                                {warehouses.map(wh => (
                                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Location Name *</label>
                            <input value={locName} onChange={e => setLocName(e.target.value)} placeholder="e.g. Rack A" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Code</label>
                            <input value={locCode} onChange={e => setLocCode(e.target.value.toUpperCase())} placeholder="e.g. LOC-005"
                                style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                            <button onClick={() => setLocSheet(false)} style={{
                                flex: 1, padding: '9px', borderRadius: 8,
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#94a3b8', cursor: 'pointer', fontSize: 13,
                            }}>Cancel</button>
                            <button onClick={handleLocSubmit} disabled={loading} style={{
                                flex: 1, padding: '9px', borderRadius: 8,
                                background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                                border: 'none', color: 'white', fontWeight: 600, fontSize: 13,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                                {loading && <Loader2 size={13} className="animate-spin" />}
                                {locEdit ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}