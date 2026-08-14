'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { 
  ShieldAlert, 
  Store, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Phone, 
  Mail, 
  Lock, 
  Unlock,
  RefreshCw,
  LogOut,
  Sparkles,
  User,
  CreditCard,
  MapPin
} from 'lucide-react'

interface ClientStore {
  id: string
  owner_name: string
  store_name: string
  owner_phone: string
  bank_account: string
  store_address: string
  owner_email: string
  package_type: string
  is_active: boolean
  expired_at: string
  created_at: string
}

export default function OwnerAdminPanel() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [stores, setStores] = useState<ClientStore[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Form State Tambah Manual
  const [ownerName, setOwnerName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [packageType, setPackageType] = useState('Pro Gold')
  const [activeMonths, setActiveMonths] = useState(12)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkOwnerAccess()
  }, [])

  const checkOwnerAccess = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== 'imannurjamanreborn@gmail.com') {
      setIsAuthorized(false)
      setLoading(false)
      return
    }

    setIsAuthorized(true)
    fetchStores()
  }

  const fetchStores = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('client_stores')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setStores(data)
    }
    setLoading(false)
  }

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)

    const expDate = new Date()
    expDate.setMonth(expDate.getMonth() + Number(activeMonths))

    const { error } = await supabase.from('client_stores').insert([
      {
        owner_name: ownerName,
        store_name: storeName,
        owner_phone: ownerPhone,
        bank_account: bankAccount,
        store_address: storeAddress,
        owner_email: ownerEmail,
        package_type: packageType,
        is_active: true,
        expired_at: expDate.toISOString(),
      }
    ])

    if (error) {
      alert('Gagal menambah toko: ' + error.message)
    } else {
      alert('Berhasil! Toko ' + storeName + ' resmi terdaftar.')
      setOwnerName('')
      setStoreName('')
      setOwnerPhone('')
      setBankAccount('')
      setStoreAddress('')
      setOwnerEmail('')
      fetchStores()
    }
    setActionLoading(false)
  }

  const toggleStoreStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('client_stores')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (!error) {
      fetchStores()
    } else {
      alert('Gagal mengubah status toko: ' + error.message)
    }
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-red-400">403 - RESTRICTED AREA</h1>
          <p className="text-xs text-slate-400">
            Halaman ini khusus Founder IMANDEVTECH. Akses Anda ditolak.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition"
          >
            Kembali ke Aplikasi Utama
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050714] text-slate-100 p-4 sm:p-8 font-sans selection:bg-cyan-500 selection:text-black">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER PANEL */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-indigo-500/30 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-2xl text-slate-950 font-black shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                IMANDEVTECH <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">OWNER PANEL</span>
              </h1>
              <p className="text-xs text-slate-400">Kontrol Lisensi SaaS & Manajemen Toko Klien</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={fetchStores}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>

        {/* GRID CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FORM REGISTRASI TOKO MANUAL */}
          <div className="lg:col-span-1 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-base font-extrabold flex items-center gap-2 text-white">
              <Plus className="w-5 h-5 text-cyan-400" /> Input Toko Manual
            </h2>
            <form onSubmit={handleAddStore} className="space-y-3 text-xs">
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">NAMA PEMILIK *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Bpk. H. Ahmad"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">NAMA TOKO *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Grosir Barokah"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">NO. TELP / WA *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="08123456789"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">REKENING / BANK</label>
                  <input 
                    type="text" 
                    placeholder="BCA 12345 a.n Ahmad"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">ALAMAT TOKO *</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Jl. Raya Pasar Induk No. 88"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">EMAIL ADMIN *</label>
                <input 
                  type="email" 
                  required
                  placeholder="owner@tokojaya.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">PAKET LISENSI</label>
                  <select 
                    value={packageType} 
                    onChange={(e) => setPackageType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Pro Gold">Pro Gold</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">DURASI</label>
                  <select 
                    value={activeMonths} 
                    onChange={(e) => setActiveMonths(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value={1}>1 Bulan</option>
                    <option value={6}>6 Bulan</option>
                    <option value={12}>12 Bulan (1 Thn)</option>
                    <option value={24}>24 Bulan (2 Thn)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90 text-slate-950 font-black rounded-xl transition shadow-lg mt-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Memproses...' : '🚀 AKTIFKAN TOKO BARU'}
              </button>
            </form>
          </div>

          {/* DAFTAR TOKO TERDAFTAR */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold flex items-center gap-2 text-white">
                <Store className="w-5 h-5 text-indigo-400" /> Daftar Toko Aktif ({stores.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs">Memuat data toko...</div>
            ) : stores.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/30 rounded-3xl border border-slate-800 text-slate-500 text-xs">
                Belum ada toko terdaftar.
              </div>
            ) : (
              <div className="space-y-3">
                {stores.map((st) => (
                  <div 
                    key={st.id} 
                    className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                      st.is_active 
                        ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' 
                        : 'bg-red-950/20 border-red-900/40 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-white">{st.store_name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {st.package_type}
                          </span>
                          {st.is_active ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> AKTIF
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> TERKUNCI
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3.5 h-3.5 text-cyan-400" /> Pemilik: <strong className="text-slate-200">{st.owner_name || '-'}</strong>
                        </span>
                      </div>

                      <button
                        onClick={() => toggleStoreStatus(st.id, st.is_active)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 self-start sm:self-center ${
                          st.is_active 
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {st.is_active ? (
                          <><Lock className="w-3.5 h-3.5" /> Kunci Toko</>
                        ) : (
                          <><Unlock className="w-3.5 h-3.5" /> Buka Kunci</>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {st.owner_email}</span>
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {st.owner_phone || '-'}</span>
                      <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-slate-500" /> {st.bank_account || '-'}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {st.store_address || '-'}</span>
                      <span className="flex items-center gap-1.5 text-amber-400/90 sm:col-span-2"><Calendar className="w-3.5 h-3.5" /> Masa Aktif Hingga: {new Date(st.expired_at).toLocaleDateString('id-ID')}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}