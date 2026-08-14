'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import {
  Store,
  User,
  ShieldCheck,
  UserPlus,
  Trash2,
  Save,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  CreditCard,
  UserCheck,
  UserX,
  Sparkles,
  Loader2,
  RefreshCw,
  Plus,
  QrCode,
  Building2,
  Upload
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'cashier'
  status: 'active' | 'pending'
}

interface StoreAccount {
  id: string
  account_name: string
  account_number: string
  holder_name: string
  qris_image_url?: string | null
}

export default function SettingsPage() {
  const supabase = createClient()

  // State Informasi Toko Lengkap
  const [storeName, setStoreName] = useState<string>('')
  const [storeAddress, setStoreAddress] = useState<string>('')
  const [storePhone, setStorePhone] = useState<string>('')

  // State Rekening & QRIS (Tabel store_accounts)
  const [storeAccounts, setStoreAccounts] = useState<StoreAccount[]>([])
  const [bankName, setBankName] = useState('')
  const [accNumber, setAccNumber] = useState('')
  const [holderName, setHolderName] = useState('')
  const [qrisFile, setQrisFile] = useState<File | null>(null)
  const [uploadingQris, setUploadingQris] = useState(false)

  // State User Aktif
  const [currentUserName, setCurrentUserName] = useState<string>('')
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')

  // State Manajemen Karyawan
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'cashier'>('cashier')

  // Status & Feedback UI
  const [loading, setLoading] = useState<boolean>(true)
  const [savingStore, setSavingStore] = useState<boolean>(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setCurrentUserEmail(user.email || '')

          const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
          const store = user.user_metadata?.store_name || user.user_metadata?.nama_toko || 'RUMAH BENTANG'

          setCurrentUserName(name)
          setStoreName(store)
          setStoreAddress(user.user_metadata?.store_address || 'Jl. Bentang Utama No. 123')
          setStorePhone(user.user_metadata?.store_phone || '081234567890')

          fetchStaffData(user.email || '', name)
        }

        // Fetch Data Rekening dari Tabel store_accounts
        fetchStoreAccounts()

      } catch (err) {
        console.error('Error loading settings:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Fetch Rekening Toko
  const fetchStoreAccounts = async () => {
    const { data, error } = await supabase.from('store_accounts').select('*').order('created_at', { ascending: true })
    if (!error && data) {
      setStoreAccounts(data)
    }
  }

  const fetchStaffData = (ownerEmail: string, ownerName: string) => {
    setStaffList([
      { id: '1', name: ownerName || 'Pemilik Usaha', email: ownerEmail, role: 'owner', status: 'active' },
      { id: '2', name: 'Kasir Shift Pagi', email: 'kasir1@rumahbentang.com', role: 'cashier', status: 'active' },
      { id: '3', name: 'Budi Santoso', email: 'budi@gmail.com', role: 'cashier', status: 'pending' }
    ])
  }

  // 1. Simpan Profil Toko
  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingStore(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          store_name: storeName,
          nama_toko: storeName,
          store_address: storeAddress,
          store_phone: storePhone,
        }
      })

      if (error) throw error
      setMessage({ type: 'success', text: 'Informasi Profil Toko berhasil diperbarui!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal memperbarui toko.' })
    } finally {
      setSavingStore(false)
    }
  }

  // 2. Tambah Rekening / QRIS Baru
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankName || !accNumber || !holderName) return

    setUploadingQris(true)
    setMessage(null)

    try {
      let qrisUrl = null

      // Upload QRIS jika ada file yang dipilih
      if (qrisFile) {
        const fileExt = qrisFile.name.split('.').pop()
        const fileName = `qris_${Date.now()}.${fileExt}`
        const filePath = `qris/${fileName}`

        const { error: uploadErr } = await supabase.storage
          .from('store-assets')
          .upload(filePath, qrisFile)

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('store-assets')
            .getPublicUrl(filePath)
          qrisUrl = publicUrlData.publicUrl
        }
      }

      // Insert ke database store_accounts
      const { data, error } = await supabase.from('store_accounts').insert([
        {
          account_name: bankName,
          account_number: accNumber,
          holder_name: holderName,
          qris_image_url: qrisUrl
        }
      ]).select()

      if (error) throw error

      setBankName('')
      setAccNumber('')
      setHolderName('')
      setQrisFile(null)
      fetchStoreAccounts()
      setMessage({ type: 'success', text: 'Rekening / QRIS berhasil ditambahkan!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menambahkan rekening.' })
    } finally {
      setUploadingQris(false)
    }
  }

  // 3. Hapus Rekening
  const handleDeleteAccount = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus rekening ${name}?`)) {
      const { error } = await supabase.from('store_accounts').delete().eq('id', id)
      if (!error) {
        fetchStoreAccounts()
        setMessage({ type: 'success', text: `Rekening ${name} berhasil dihapus.` })
      }
    }
  }

  // Staff Handlers
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaffName || !newStaffEmail) return

    const newStaff: StaffMember = {
      id: Date.now().toString(),
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole,
      status: 'pending'
    }

    setStaffList([...staffList, newStaff])
    setNewStaffName('')
    setNewStaffEmail('')
    setMessage({ type: 'success', text: `Karyawan (${newStaffName}) berhasil didaftarkan (Status: Pending Approval).` })
  }

  const handleToggleStatus = (id: string) => {
    setStaffList(staffList.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'active' ? 'pending' : 'active'
        return { ...s, status: nextStatus }
      }
      return s
    }))
    setMessage({ type: 'success', text: 'Status persetujuan karyawan berhasil diubah!' })
  }

  const handleDeleteStaff = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus hak akses untuk ${name}?`)) {
      setStaffList(staffList.filter(s => s.id !== id))
      setMessage({ type: 'success', text: `Akses karyawan ${name} berhasil dicabut.` })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center text-slate-400 space-y-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Memuat Pengaturan Sistem...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">

      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-10 left-[-100px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">

        {/* Header Section */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl text-slate-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                <Store className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Pengaturan Toko & Rekening Pembayaran
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Kelola identitas toko, opsi rekening transfer / QRIS kasir, dan persetujuan staf.
            </p>
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-2 rounded-2xl text-xs font-extrabold shadow-inner">
            <ShieldCheck className="w-4 h-4" /> Multi-Tenant Active
          </div>
        </div>

        {/* Notifikasi Message */}
        {message && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 backdrop-blur-xl border ${message.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* CARD 1: Form Profil Toko (2 COLS) */}
          <div className="md:col-span-2 bg-slate-900/80 p-6 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
              <span className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl">
                <Store className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-extrabold text-white text-base">Profil Toko & Informasi Struk</h2>
                <p className="text-[11px] text-slate-400">Data ini akan dicetak otomatis pada Header Struk Penjualan</p>
              </div>
            </div>

            <form onSubmit={handleUpdateStore} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">Nama Toko / Usaha</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/80 p-3 rounded-xl text-white font-semibold focus:outline-none focus:border-cyan-500/50 transition placeholder:text-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">No. Telepon / WhatsApp Toko</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full bg-slate-950 border border-slate-800/80 p-3 pl-10 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500/50 transition placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5">Alamat Lengkap Toko</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Alamat fisik toko..."
                    className="w-full bg-slate-950 border border-slate-800/80 p-3 pl-10 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500/50 transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingStore}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50"
              >
                {savingStore ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 stroke-[2.5]" />
                    <span>Simpan Informasi Toko</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* CARD 2: Sesi Pengguna (1 COL) */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
              <span className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
                <User className="w-5 h-5" />
              </span>
              <h2 className="font-extrabold text-white text-base">Sesi Akun Anda</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  readOnly
                  value={currentUserName}
                  className="w-full bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-slate-300 font-semibold focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">Email Terdaftar</label>
                <input
                  type="text"
                  readOnly
                  value={currentUserEmail}
                  className="w-full bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-slate-400 font-mono focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">Level Hak Akses</label>
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-xl font-extrabold text-[11px] capitalize">
                  <Sparkles className="w-3.5 h-3.5" /> Pemilik Toko (Owner / Admin)
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* CARD BARU: KELOLA REKENING PEMBAYARAN & QRIS (YANG TERKONEKSI KE POS) */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-extrabold text-white text-base">Kelola Rekening & QRIS Kasir POS</h2>
                <p className="text-xs text-slate-400">Rekening dan QRIS di sini akan otomatis muncul sebagai opsi pembayaran transfer di POS.</p>
              </div>
            </div>
          </div>

          {/* Form Tambah Rekening / QRIS */}
          <form onSubmit={handleAddAccount} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3 text-xs">
            <p className="font-extrabold text-indigo-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Tambah Rekening / QRIS Baru
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nama Bank / E-Wallet (BCA, Mandiri, QRIS)"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                required
              />
              <input
                type="text"
                placeholder="Nomor Rekening / No. HP"
                value={accNumber}
                onChange={(e) => setAccNumber(e.target.value)}
                className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                required
              />
              <input
                type="text"
                placeholder="Atas Nama (Pemilik Rekening)"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <label className="text-slate-400 font-bold flex items-center gap-1 cursor-pointer bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl hover:text-white transition">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>{qrisFile ? qrisFile.name : 'Upload Gambar QRIS (Opsional)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setQrisFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={uploadingQris}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-extrabold px-5 py-2.5 rounded-xl transition active:scale-95 shrink-0 shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingQris ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Simpan Rekening</span>
              </button>
            </div>
          </form>

          {/* Daftar Rekening Terdaftar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {storeAccounts.length === 0 ? (
              <p className="text-xs text-slate-500 italic col-span-full">Belum ada akun rekening/QRIS yang ditambahkan.</p>
            ) : (
              storeAccounts.map((acc) => (
                <div key={acc.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-3 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        {acc.account_name}
                      </span>
                      <h3 className="text-sm font-bold text-white font-mono mt-1.5">{acc.account_number}</h3>
                      <p className="text-xs text-slate-400">a.n {acc.holder_name}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteAccount(acc.id, `${acc.account_name} (${acc.account_number})`)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Hapus Rekening"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {acc.qris_image_url && (
                    <div className="bg-white p-2 rounded-xl flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <QrCode className="w-3 h-3 text-indigo-600" /> QRIS Toko
                      </span>
                      <img src={acc.qris_image_url} alt="QRIS" className="w-24 h-24 object-contain rounded border border-slate-200" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* CARD 3: MANAJEMEN STAF & APPROVAL KARYAWAN */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl">
                <KeyRound className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-extrabold text-white text-base">Hak Akses & Persetujuan Karyawan</h2>
                <p className="text-xs text-slate-400">Atur staf yang diizinkan mengakses POS kasir toko <span className="text-slate-200 font-bold">{storeName}</span></p>
              </div>
            </div>
          </div>

          {/* Form Registrasi Staf Baru */}
          <form onSubmit={handleAddStaff} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3 text-xs">
            <p className="font-extrabold text-cyan-400 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Registrasi Staf / Kasir Baru
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nama Karyawan"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500/50 transition placeholder:text-slate-600"
                required
              />
              <input
                type="email"
                placeholder="Email Karyawan"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500/50 transition placeholder:text-slate-600"
                required
              />
              <div className="flex gap-2">
                <select
                  value={newStaffRole}
                  onChange={(e: any) => setNewStaffRole(e.target.value)}
                  className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500/50 flex-1 cursor-pointer"
                >
                  <option value="cashier">Kasir</option>
                  <option value="admin">Admin Toko</option>
                </select>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl transition active:scale-95 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                >
                  Registrasi
                </button>
              </div>
            </div>
          </form>

          {/* Tabel Karyawan & Tombol Approval */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="p-3.5">Nama Staf</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Jabatan / Role</th>
                  <th className="p-3.5">Status Approval</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-3.5 font-bold text-white">{staff.name}</td>
                    <td className="p-3.5 text-slate-400 font-mono">{staff.email}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${staff.role === 'owner'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : staff.role === 'admin'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {staff.role === 'owner' ? (
                        <span className="text-emerald-400 font-extrabold flex items-center gap-1 text-[11px]">
                          <UserCheck className="w-3.5 h-3.5" /> Verified Owner
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(staff.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1.5 transition-all active:scale-95 border ${staff.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                          title="Klik untuk menyetujui / membatalkan akses"
                        >
                          {staff.status === 'active' ? (
                            <><UserCheck className="w-3 h-3" /> Disetujui (Aktif)</>
                          ) : (
                            <><UserX className="w-3 h-3" /> Pending (Klik Setujui)</>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {staff.role !== 'owner' ? (
                        <button
                          onClick={() => handleDeleteStaff(staff.id, staff.name)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition active:scale-95"
                          title="Hapus Akses"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic font-mono">Utama</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  )
}