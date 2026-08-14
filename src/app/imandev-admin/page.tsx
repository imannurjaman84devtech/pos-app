'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import {
    ShieldAlert,
    Store,
    UserPlus,
    Lock,
    Unlock,
    Calendar,
    Sparkles,
    Search,
    RefreshCw,
    Clock,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    ChevronRight,
    Loader2,
    Building2,
    Phone,
    Mail,
    Sliders,
    DollarSign
} from 'lucide-react'

// Email Khusus Founder / Super Admin IMANDEVTECH
const SUPER_ADMIN_EMAIL = 'imannurjamanreborn@gmail.com'

interface ClientStore {
    id: string
    owner_email: string
    store_name: string
    owner_name: string
    store_phone?: string
    plan_type: 'lifetime' | 'monthly' // Lifetime = Paket A, Monthly = Paket B
    status: 'active' | 'locked'
    expired_at?: string // Tanggal Jatuh Tempo untuk Paket B
    created_at?: string
}

export default function IMANDEVAdminPage() {
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    const [currentEmail, setCurrentEmail] = useState('')

    // State Daftar Klien
    const [clients, setClients] = useState<ClientStore[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filterPlan, setFilterPlan] = useState<'all' | 'lifetime' | 'monthly'>('all')

    // State Form Klien Baru
    const [newStoreName, setNewStoreName] = useState('')
    const [newOwnerName, setNewOwnerName] = useState('')
    const [newOwnerEmail, setNewOwnerEmail] = useState('')
    const [newStorePhone, setNewStorePhone] = useState('')
    const [newPlanType, setNewPlanType] = useState<'monthly' | 'lifetime'>('monthly')
    const [submitting, setSubmitting] = useState(false)

    // Status UI Feedback
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        async function checkAuth() {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    setCurrentEmail(user.email || '')
                    // Cek Apakah User yang Login Adalah Founder IMANDEVTECH
                    if (user.email === SUPER_ADMIN_EMAIL) {
                        setIsSuperAdmin(true)
                        await fetchAllClients()
                    } else {
                        setIsSuperAdmin(false)
                    }
                }
            } catch (err) {
                console.error('Error Admin Check:', err)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    // Fetch Semua Klien (Simulasi & Fetch dari database Supabase)
    const fetchAllClients = async () => {
        // Mencoba fetch dari tabel 'client_stores' jika ada, atau mengambil dari user metadata
        const { data, error } = await supabase
            .from('client_stores')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setClients(data)
        } else {
            // Data Dummy Awal jika tabel baru dibuat
            setClients([
                {
                    id: '1',
                    store_name: 'WARUNG IWAN',
                    owner_name: 'Iwan Setiawan',
                    owner_email: 'iwan@gmail.com',
                    store_phone: '081234567890',
                    plan_type: 'monthly',
                    status: 'active',
                    expired_at: '2026-09-14',
                    created_at: '2026-08-14'
                },
                {
                    id: '2',
                    store_name: 'GROSIR BERKAH JAYA',
                    owner_name: 'Hj. Budi',
                    owner_email: 'grosirberkah@gmail.com',
                    store_phone: '085223114455',
                    plan_type: 'lifetime',
                    status: 'active',
                    created_at: '2026-08-01'
                }
            ])
        }
    }

    // 1. Tambah Klien / Toko Baru dari HP
    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setMessage(null)

        try {
            // Hitung tanggal expired jika sewa bulanan (+30 Hari dari sekarang)
            const now = new Date()
            const nextMonth = new Date(now.setDate(now.getDate() + 30)).toISOString().split('T')[0]

            // Kumpulkan data tanpa memasukkan 'id' di awal
            const newClientPayload = {
                store_name: newStoreName.toUpperCase(),
                owner_name: newOwnerName,
                owner_email: newOwnerEmail.toLowerCase(),
                store_phone: newStorePhone,
                plan_type: newPlanType,
                status: 'active' as const,
                expired_at: newPlanType === 'monthly' ? nextMonth : undefined,
                created_at: new Date().toISOString()
            }

            // Simpan ke Supabase
            const { data, error } = await supabase
                .from('client_stores')
                .insert([newClientPayload])
                .select()

            if (error) {
                // Fallback simpan lokal jika tabel supabase belum ada
                const localNew: ClientStore = {
                    id: Date.now().toString(), // 'id' cuma didefinisikan sekali di sini!
                    ...newClientPayload
                }
                setClients([localNew, ...clients])
            } else if (data) {
                setClients([data[0], ...clients])
            }

            setMessage({
                type: 'success',
                text: `Toko "${newStoreName}" BERHASIL Diaktifkan! Akun siap dipakai.`
            })

            // Reset Form
            setNewStoreName('')
            setNewOwnerName('')
            setNewOwnerEmail('')
            setNewStorePhone('')
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Gagal mendaftarkan toko baru.' })
        } finally {
            setSubmitting(false)
        }
    }

    // 2. Toggle Remote Lock / Unlock Toko
    const handleToggleLock = async (client: ClientStore) => {
        const nextStatus = client.status === 'active' ? 'locked' : 'active'
        const confirmMsg = nextStatus === 'locked'
            ? `KUNCI AKSES toko ${client.store_name}? Kasir tidak akan bisa bertransaksi.`
            : `BUKA KUNCI toko ${client.store_name}? Akses kasir akan normal kembali.`

        if (confirm(confirmMsg)) {
            // Update di Supabase
            await supabase.from('client_stores').update({ status: nextStatus }).eq('id', client.id)

            // Update State Lokal
            setClients(clients.map(c => c.id === client.id ? { ...c, status: nextStatus } : c))
            setMessage({
                type: 'success',
                text: `Status ${client.store_name} berhasil diubah jadi ${nextStatus.toUpperCase()}!`
            })
        }
    }

    // 3. Perpanjang Masa Sewa Bulanan (+30 Hari)
    const handleExtendSubscription = async (client: ClientStore) => {
        const currentExp = client.expired_at ? new Date(client.expired_at) : new Date()
        // Tambah 30 hari
        const newExp = new Date(currentExp.setDate(currentExp.getDate() + 30)).toISOString().split('T')[0]

        if (confirm(`Perpanjang sewa ${client.store_name} selama 30 Hari (Jatuh tempo baru: ${newExp})?`)) {
            await supabase
                .from('client_stores')
                .update({ expired_at: newExp, status: 'active' })
                .eq('id', client.id)

            setClients(clients.map(c => c.id === client.id ? { ...c, expired_at: newExp, status: 'active' } : c))
            setMessage({
                type: 'success',
                text: `Sewa ${client.store_name} BERHASIL Diperpanjang s/d ${newExp}!`
            })
        }
    }

    // Filter Klien
    const filteredClients = clients.filter(c => {
        const matchesSearch = c.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPlan = filterPlan === 'all' || c.plan_type === filterPlan
        return matchesSearch && matchesPlan
    })

    // Loading Screen
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-slate-400 space-y-3 font-sans">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Memuat IMANDEVTECH Control Panel...</span>
            </div>
        )
    }

    // Tampilan Jika Bukan Super Admin
    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center font-sans text-slate-100">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md text-center space-y-4 shadow-2xl">
                    <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-rose-500/20">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h1 className="text-xl font-black text-white">Akses Terlarang (Restricted Area)</h1>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Halaman ini khusus untuk Founder & Super Admin <strong className="text-cyan-400">IMANDEVTECH</strong>. Akun Anda (<code className="text-slate-300 font-mono">{currentEmail}</code>) tidak memiliki izin akses.
                    </p>
                    <a
                        href="/settings"
                        className="inline-block px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
                    >
                        Kembali ke Pengaturan Toko
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 p-3 sm:p-6 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-gradient-to-b from-cyan-500/15 via-indigo-500/5 to-transparent blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-emerald-500/10 blur-[140px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto space-y-5 relative z-10">

                {/* HEADER OWNER MOBILE FRIENDLY */}
                <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-2xl text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
                            <Sparkles className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">IMANDEVTECH</h1>
                                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                                    Owner Panel
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">Kelola semua toko klien POS langsung dari HP kamu.</p>
                        </div>
                    </div>

                    <div className="w-full sm:w-auto bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-2xl flex items-center justify-between sm:justify-end gap-3 text-xs">
                        <span className="text-slate-400 text-[11px]">Total Klien:</span>
                        <span className="font-extrabold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                            {clients.length} Toko
                        </span>
                    </div>
                </div>

                {/* FEEDBACK NOTIFIKASI */}
                {message && (
                    <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border backdrop-blur-xl ${message.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* FORM TAMBAH KLIEN BARU (OPTIMIZED FOR HP) */}
                <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
                        <span className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
                            <UserPlus className="w-4 h-4" />
                        </span>
                        <h2 className="font-extrabold text-white text-sm">Aktifkan Klien / Toko Baru</h2>
                    </div>

                    <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-slate-400 font-bold mb-1">Nama Toko / Usaha Klien</label>
                                <div className="relative">
                                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Contoh: WARUNG IWAN"
                                        value={newStoreName}
                                        onChange={(e) => setNewStoreName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 p-2.5 pl-9 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500 transition placeholder:text-slate-600"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-bold mb-1">Nama Pemilik Toko</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Iwan Setiawan"
                                    value={newOwnerName}
                                    onChange={(e) => setNewOwnerName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500 transition placeholder:text-slate-600"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-bold mb-1">Email Pemilik (Untuk Login)</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        placeholder="iwan@gmail.com"
                                        value={newOwnerEmail}
                                        onChange={(e) => setNewOwnerEmail(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 p-2.5 pl-9 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 transition placeholder:text-slate-600"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-bold mb-1">No. WhatsApp Klien</label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="081234567890"
                                        value={newStorePhone}
                                        onChange={(e) => setNewStorePhone(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 p-2.5 pl-9 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500 transition placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PILIHAN PAKET A / B */}
                        <div className="pt-1">
                            <label className="block text-slate-400 font-bold mb-1.5">Pilih Paket Lisensi IMANDEVTECH</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNewPlanType('monthly')}
                                    className={`p-3 rounded-xl border text-left transition relative ${newPlanType === 'monthly'
                                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 font-bold'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <p className="text-xs font-black">PAKET B (Sewa)</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Rp 3.700.000 + Rp 150rb/bln</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setNewPlanType('lifetime')}
                                    className={`p-3 rounded-xl border text-left transition relative ${newPlanType === 'lifetime'
                                            ? 'bg-purple-500/10 border-purple-500 text-purple-300 font-bold'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <p className="text-xs font-black">PAKET A (Beli Putus)</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Rp 6.500.000 (Lifetime)</p>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.25)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            <span>GENERATE & AKTIFKAN TOKO KLIEN</span>
                        </button>
                    </form>
                </div>

                {/* DAFTAR KLIEN & KONTROL REMOTE */}
                <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                        <h2 className="font-extrabold text-white text-sm flex items-center gap-2">
                            <Store className="w-4 h-4 text-cyan-400" /> Daftar Toko Terdaftar
                        </h2>

                        {/* BAR PENCARIAN MOBILE */}
                        <div className="w-full sm:w-auto flex items-center gap-2">
                            <div className="relative flex-1 sm:w-48">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Cari toko / nama..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 p-2 pl-8 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* LIST KLIEN TAMPILAN CARD (NYAMAN DI HP) */}
                    <div className="space-y-3">
                        {filteredClients.length === 0 ? (
                            <p className="text-center py-6 text-xs text-slate-500 italic">Belum ada data toko klien.</p>
                        ) : (
                            filteredClients.map((client) => (
                                <div
                                    key={client.id}
                                    className={`p-4 rounded-2xl border transition-all space-y-3 relative ${client.status === 'locked'
                                            ? 'bg-rose-950/20 border-rose-500/30'
                                            : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                                        }`}
                                >
                                    {/* Header Card Toko */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-black text-white tracking-wide">{client.store_name}</h3>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${client.plan_type === 'lifetime'
                                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                                    }`}>
                                                    {client.plan_type === 'lifetime' ? 'Paket A (Lifetime)' : 'Paket B (Sewa)'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">{client.owner_name} • <span className="font-mono text-slate-500">{client.owner_email}</span></p>
                                        </div>

                                        {/* Badge Status Lock/Active */}
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 border shrink-0 ${client.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                                            }`}>
                                            {client.status === 'active' ? (
                                                <><Unlock className="w-3 h-3" /> AKTIF</>
                                            ) : (
                                                <><Lock className="w-3 h-3" /> TERKUNCI</>
                                            )}
                                        </span>
                                    </div>

                                    {/* Detail Masa Sewa untuk Paket B */}
                                    {client.plan_type === 'monthly' && (
                                        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/60 flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                                <span>Jatuh Tempo Sewa:</span>
                                                <strong className="text-white font-mono">{client.expired_at || '-'}</strong>
                                            </div>

                                            <button
                                                onClick={() => handleExtendSubscription(client)}
                                                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold text-[10px] transition active:scale-95"
                                            >
                                                +30 Hari Sewa
                                            </button>
                                        </div>
                                    )}

                                    {/* ACTION BUTTONS UNTUK REMOTE DARI HP */}
                                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                                        {client.store_phone && (
                                            <a
                                                href={`https://wa.me/${client.store_phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(client.owner_name)},%20salam%20dari%20IMANDEVTECH!`}
                                                target="_blank"
                                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-extrabold rounded-xl text-[11px] border border-slate-800 flex items-center gap-1.5 transition"
                                            >
                                                <Phone className="w-3 h-3 text-emerald-400" /> WA Klien
                                            </a>
                                        )}

                                        <button
                                            onClick={() => handleToggleLock(client)}
                                            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition active:scale-95 border ${client.status === 'active'
                                                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                }`}
                                        >
                                            {client.status === 'active' ? (
                                                <><Lock className="w-3 h-3" /> Kunci Akses</>
                                            ) : (
                                                <><Unlock className="w-3 h-3" /> Buka Kunci</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}