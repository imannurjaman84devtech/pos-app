'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Store {
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
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Form State
  const [ownerName, setOwnerName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('12345678') // Default password sementara
  const [packageType, setPackageType] = useState('Pro Gold')
  const [activeMonths, setActiveMonths] = useState(12)

  // Fetch daftar toko dari Supabase
  const fetchStores = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('client_stores')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching stores:', error.message)
    } else {
      setStores(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStores()
  }, [])

  // Tambah Toko Baru + Buat Akun Auth
  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)

    try {
      // 1. Buat Akun Auth Login untuk Pemilik Toko
      const { error: authError } = await supabase.auth.signUp({
        email: ownerEmail,
        password: ownerPassword,
      })

      // Jika error bukan karena email sudah terdaftar, lempar error
      if (authError && !authError.message.toLowerCase().includes('already registered')) {
        throw new Error('Gagal buat akun Auth: ' + authError.message)
      }

      // 2. Hitung tanggal kedaluwarsa
      const expDate = new Date()
      expDate.setMonth(expDate.getMonth() + Number(activeMonths))

      // 3. Simpan data lisensi toko ke database client_stores
      const { error: dbError } = await supabase.from('client_stores').insert([
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
        },
      ])

      if (dbError) throw dbError

      alert(`✅ Berhasil! Toko "${storeName}" berhasil diaktifkan.\n\nDetail Akun Login Klien:\nEmail: ${ownerEmail}\nPassword: ${ownerPassword}`)

      // Reset Form
      setOwnerName('')
      setStoreName('')
      setOwnerPhone('')
      setBankAccount('')
      setStoreAddress('')
      setOwnerEmail('')
      setOwnerPassword('12345678')
      fetchStores()
    } catch (err: any) {
      alert('⚠️ Gagal menambahkan toko: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Toggle Status Aktif / Blokir Lisensi
  const toggleStoreStatus = async (id: string, currentStatus: boolean) => {
    const actionText = currentStatus ? 'memblokir/mengunci' : 'mengaktifkan kembali'
    if (!confirm(`Apakah Anda yakin ingin ${actionText} toko ini?`)) return

    const { error } = await supabase
      .from('client_stores')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) {
      alert('Gagal mengubah status toko: ' + error.message)
    } else {
      fetchStores()
    }
  }

  // Tambah Masa Aktif Lisensi (Perpanjang Masa Lisensi)
  const addLicenseDuration = async (id: string, currentExpiredAt: string, monthsToAdd: number) => {
    const baseDate = currentExpiredAt && new Date(currentExpiredAt) > new Date()
      ? new Date(currentExpiredAt)
      : new Date()

    baseDate.setMonth(baseDate.getMonth() + monthsToAdd)

    const { error } = await supabase
      .from('client_stores')
      .update({
        expired_at: baseDate.toISOString(),
        is_active: true,
      })
      .eq('id', id)

    if (error) {
      alert('Gagal memperpanjang lisensi: ' + error.message)
    } else {
      alert(`Berhasil memperpanjang lisensi +${monthsToAdd} bulan!`)
      fetchStores()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl text-white text-xl">🛡️</span>
              OWNER SAAS CONTROL PANEL
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Pusat kendali lisensi toko, perpanjangan akses, dan manajemen klien
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Klien Toko</p>
              <p className="text-2xl font-black text-cyan-400">{stores.length}</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Toko Aktif</p>
              <p className="text-2xl font-black text-emerald-400">
                {stores.filter(s => s.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FORM INPUT TOKO MANUAL */}
          <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-cyan-400">+</span> Input Toko Manual
            </h2>

            <form onSubmit={handleAddStore} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">NAMA PEMILIK *</label>
                <input
                  type="text"
                  required
                  placeholder="Bpk. H. Ahmad"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-cyan-500 transition"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-cyan-500 transition"
                />
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-cyan-500 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">REKENING / BANK</label>
                  <input
                    type="text"
                    placeholder="BCA 12345 a.n Ahmad"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">ALAMAT TOKO *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jl. Raya Pasar Induk No. 88"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-cyan-500 transition"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">PASSWORD SEMENTARA (LOGIN) *</label>
                <input
                  type="text"
                  required
                  placeholder="12345678"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-400 font-mono outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">PAKET LISENSI</label>
                  <select
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-cyan-500 transition"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-cyan-500 transition"
                  >
                    <option value={1}>1 Bulan</option>
                    <option value={3}>3 Bulan</option>
                    <option value={6}>6 Bulan</option>
                    <option value={12}>12 Bulan (1 Thn)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition active:scale-[0.98] disabled:opacity-50"
              >
                {actionLoading ? 'Memproses...' : '🚀 AKTIFKAN TOKO BARU'}
              </button>
            </form>
          </div>

          {/* DAFTAR LISENSI TOKO CLIENT */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Daftar Klien SaaS & Status Akses</h2>
              <button
                onClick={fetchStores}
                className="text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-slate-300"
              >
                🔄 Refresh Data
              </button>
            </div>

            {loading ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center text-slate-500">
                Memuat data toko...
              </div>
            ) : stores.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center text-slate-500">
                Belum ada toko yang terdaftar.
              </div>
            ) : (
              <div className="space-y-3">
                {stores.map((store) => {
                  const isExpired = store.expired_at && new Date(store.expired_at) < new Date()
                  const statusActive = store.is_active && !isExpired

                  return (
                    <div
                      key={store.id}
                      className={`bg-slate-900/80 border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                        statusActive ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/50 bg-rose-950/10'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{store.store_name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            statusActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {statusActive ? 'AKTIF' : isExpired ? 'KEDALUWARSA' : 'DIBLOKIR'}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                            {store.package_type}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400">
                          Pemilik: <span className="text-slate-200 font-medium">{store.owner_name}</span> ({store.owner_phone})
                        </p>
                        <p className="text-xs text-slate-400">
                          Email: <span className="text-slate-200 font-mono">{store.owner_email}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Masa Aktif s/d:{' '}
                          <span className={isExpired ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {store.expired_at ? new Date(store.expired_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            }) : 'Selamanya'}
                          </span>
                        </p>
                      </div>

                      {/* AKSbrowser KENDALI */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                        <button
                          onClick={() => addLicenseDuration(store.id, store.expired_at, 1)}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition"
                          title="Tambah masa aktif 1 Bulan"
                        >
                          +1 Bln
                        </button>

                        <button
                          onClick={() => addLicenseDuration(store.id, store.expired_at, 12)}
                          className="text-xs bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/50 text-cyan-300 px-3 py-1.5 rounded-lg transition"
                          title="Tambah masa aktif 1 Tahun"
                        >
                          +1 Thn
                        </button>

                        <button
                          onClick={() => toggleStoreStatus(store.id, store.is_active)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                            store.is_active
                              ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50'
                              : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50'
                          }`}
                        >
                          {store.is_active ? '🔒 Kunci Toko' : '🔓 Buka Akses'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}