'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Form Data Toko & Akun Pemilik
  const [formData, setFormData] = useState({
    ownerName: '',
    storeName: '',
    address: '',
    phone: '',
    bankAccount: '',
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Buat User Admin di Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        throw new Error('Gagal membuat akun: ' + authError.message)
      }

      // 2. Pastikan user langsung ter-login (menciptakan sesi aktif)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        throw new Error('Gagal membuat sesi login: ' + signInError.message)
      }

      // 3. Simpan Profil Identitas Toko ke Table store_settings
      if (authData.user) {
        const { error: dbError } = await supabase.from('store_settings').upsert({
          id: 1,
          store_name: formData.storeName,
          owner_name: formData.ownerName,
          address: formData.address,
          phone: formData.phone,
          bank_account: formData.bankAccount,
          receipt_footer: `Terima kasih telah berbelanja di ${formData.storeName}!`,
        })

        if (dbError) {
          throw new Error('Gagal menyimpan profil toko: ' + dbError.message)
        }

        // 4. Berhasil! Arahkan ke Dashboard
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat pendaftaran.')
      setLoading(false)
    }
  }

  const inputClass =
    'w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-blue-600 font-medium text-sm transition'

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans my-8">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl text-white text-2xl font-black mb-2 shadow-lg shadow-blue-500/30">
            🏬
          </div>
          <h1 className="text-2xl font-black text-slate-800">Mulai Pakai POS Toko Anda</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Daftarkan bisnis Anda & sesuaikan sistem dalam 1 menit
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                Nama Pemilik *
              </label>
              <input
                type="text"
                name="ownerName"
                required
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="Contoh: Bpk. H. Ahmad"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                Nama Toko / Usaha *
              </label>
              <input
                type="text"
                name="storeName"
                required
                value={formData.storeName}
                onChange={handleChange}
                placeholder="Contoh: Toko Grosir Barokah"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                No. Telepon / WA *
              </label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="0812-3456-7890"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                No. Rekening / Bank
              </label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                placeholder="BCA 12345678 a.n Ahmad"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
              Alamat Toko *
            </label>
            <textarea
              name="address"
              rows={2}
              required
              value={formData.address}
              onChange={handleChange}
              placeholder="Jl. Raya Pasar Induk No. 88, Blok A"
              className={inputClass}
            />
          </div>

          <hr className="my-2 border-slate-200" />

          {/* Akses Login */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                Email Admin *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@tokobarokah.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                Password *
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:bg-slate-300 mt-4 text-sm"
          >
            {loading ? 'Menyiapkan Toko Anda...' : '🚀 Buat Aplikasi Toko Saya Sekarang'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}