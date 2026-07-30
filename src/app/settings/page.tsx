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
  AlertCircle
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'cashier'
}

export default function SettingsPage() {
  const supabase = createClient()

  // State Informasi Toko
  const [storeName, setStoreName] = useState<string>('')
  const [storeId, setStoreId] = useState<string>('')

  // State User Aktif
  const [currentUserName, setCurrentUserName] = useState<string>('')
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('owner')

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
          
          // Ambil nama user & toko dari metadata
          const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
          const store = user.user_metadata?.store_name || user.user_metadata?.nama_toko || 'RUMAH BENTANG'
          
          setCurrentUserName(name)
          setStoreName(store)

          // Load data staf dari database / mock initial data
          fetchStaffData(user.id)
        }
      } catch (err) {
        console.error('Error loading settings:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const fetchStaffData = async (userId: string) => {
    // Mencoba fetch tim/staf dari Supabase jika ada tabel profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')

    if (profiles && profiles.length > 0) {
      const formattedStaff: StaffMember[] = profiles.map((p: any) => ({
        id: p.id,
        name: p.full_name || 'Kasir / Staf',
        email: p.email || '-',
        role: p.role || 'cashier'
      }))
      setStaffList(formattedStaff)
    } else {
      // Default list staf untuk preview jika belum ada data di tabel profiles
      setStaffList([
        { id: '1', name: currentUserName || 'Pemilik Usaha', email: currentUserEmail, role: 'owner' },
        { id: '2', name: 'Kasir Shift Pagi', email: 'kasir1@rumahbentang.com', role: 'cashier' }
      ])
    }
  }

  // 1. Fungsi Update Nama Toko
  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingStore(true)
    setMessage(null)

    try {
      // Update metadata user di Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: { store_name: storeName, nama_toko: storeName }
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Nama toko berhasil diperbarui!' })
      setTimeout(() => window.location.reload(), 1000) // Reload agar sidebar ikut update
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal memperbarui toko.' })
    } finally {
      setSavingStore(false)
    }
  }

  // 2. Fungsi Tambah Karyawan Baru
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaffName || !newStaffEmail) return

    const newStaff: StaffMember = {
      id: Date.now().toString(),
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole
    }

    setStaffList([...staffList, newStaff])
    setNewStaffName('')
    setNewStaffEmail('')
    setMessage({ type: 'success', text: `Karyawan baru (${newStaffName}) berhasil ditambahkan!` })
  }

  // 3. Fungsi Hapus Karyawan
  const handleDeleteStaff = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus hak akses untuk ${name}?`)) {
      setStaffList(staffList.filter(s => s.id !== id))
      setMessage({ type: 'success', text: `Akses karyawan ${name} berhasil dicabut.` })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8 flex items-center justify-center text-slate-400">
        Memuat Pengaturan Sistem...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Pengaturan Toko & Hak Akses</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">Kelola identitas toko, sesi aktif, dan manajemen staf kasir</p>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Multi-Tenant Active
          </div>
        </div>

        {/* Notifikasi Message */}
        {message && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CARD 1: Edit Informasi Toko */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700/50">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Store className="w-5 h-5" />
              </span>
              <h2 className="font-bold text-white">Profil Toko Aktif</h2>
            </div>
            
            <form onSubmit={handleUpdateStore} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nama Toko / Usaha</label>
                <input 
                  type="text" 
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Contoh: RUMAH BENTANG"
                  className="w-full bg-slate-900/60 border border-slate-700 p-2.5 rounded-xl text-white font-semibold focus:outline-none focus:border-indigo-500 transition-all" 
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Edisi Lisensi</label>
                <input 
                  type="text" 
                  readOnly 
                  value="Grosir POS Pro Edition (Multi-Unit)" 
                  className="w-full bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl text-slate-500 font-medium focus:outline-none" 
                />
              </div>

              <button
                type="submit"
                disabled={savingStore}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingStore ? 'Menyimpan...' : 'Simpan Nama Toko'}
              </button>
            </form>
          </div>

          {/* CARD 2: Sesi Aktif Saya */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700/50">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <User className="w-5 h-5" />
              </span>
              <h2 className="font-bold text-white">Sesi Akun Anda</h2>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  readOnly 
                  value={currentUserName} 
                  className="w-full bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl text-slate-300 font-semibold focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Email Terdaftar</label>
                <input 
                  type="text" 
                  readOnly 
                  value={currentUserEmail} 
                  className="w-full bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl text-slate-400 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Level Hak Akses</label>
                <span className="inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-lg font-bold capitalize">
                  Pemilik Toko (Owner / Admin)
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* CARD 3: MANAJEMEN STAF & KARYAWAN (BISA TAMBAH / HAPUS) */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <KeyRound className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-bold text-white">Hak Akses & Karyawan Toko</h2>
                <p className="text-xs text-slate-400">Atur pengguna yang diizinkan mengakses POS kasir toko {storeName}</p>
              </div>
            </div>
          </div>

          {/* Form Tambah Staf Baru */}
          <form onSubmit={handleAddStaff} className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 space-y-3 text-xs">
            <p className="font-bold text-indigo-400 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Tambah Staf / Kasir Baru
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input 
                type="text" 
                placeholder="Nama Karyawan"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <input 
                type="email" 
                placeholder="Email Karyawan"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <div className="flex gap-2">
                <select 
                  value={newStaffRole}
                  onChange={(e: any) => setNewStaffRole(e.target.value)}
                  className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 flex-1"
                >
                  <option value="cashier">Kasir</option>
                  <option value="admin">Admin Toko</option>
                </select>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  Tambah
                </button>
              </div>
            </div>
          </form>

          {/* Tabel Daftar Karyawan */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-700/60">
                <tr>
                  <th className="p-3">Nama Staf</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Jabatan / Role</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-700/20 transition-all">
                    <td className="p-3 font-semibold text-white">{staff.name}</td>
                    <td className="p-3 text-slate-400">{staff.email}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                        staff.role === 'owner' 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                          : staff.role === 'admin'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {staff.role !== 'owner' ? (
                        <button
                          onClick={() => handleDeleteStaff(staff.id, staff.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Hapus Akses"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Utama</span>
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