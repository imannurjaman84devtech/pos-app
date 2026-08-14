'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import { 
  Store, 
  User, 
  Phone, 
  CreditCard, 
  MapPin, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Zap, 
  Headphones, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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

      if (authData.user) {
        // 3. Simpan Profil Identitas Toko ke Table store_settings
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

        // 4. OTOMATIS DAFTARKAN LISENSI SAAS KE client_stores (Bisa dibaca Owner Admin Panel)
        const expiredDate = new Date()
        expiredDate.setDate(expiredDate.getDate() + 30) // Default Trial 30 Hari

        await supabase.from('client_stores').upsert([
          {
            owner_name: formData.ownerName,
            store_name: formData.storeName,
            owner_phone: formData.phone,
            bank_account: formData.bankAccount,
            store_address: formData.address,
            owner_email: formData.email,
            package_type: 'Pro Gold',
            is_active: true,
            expired_at: expiredDate.toISOString(),
          }
        ], { onConflict: 'owner_email' })

        // 5. Berhasil! Arahkan ke Dashboard
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat pendaftaran.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#050714] text-slate-200 flex items-center justify-center p-4 py-12 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Background Decorative Glow Lines & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050714] to-[#050714] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      
      {/* Decorative Side Glow Lines */}
      <div className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        <div className="w-48 h-48 border-l-2 border-t-2 border-indigo-500 transform -rotate-45" />
      </div>
      <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        <div className="w-48 h-48 border-r-2 border-t-2 border-indigo-500 transform rotate-45" />
      </div>

      <div className="w-full max-w-xl relative z-10 flex flex-col items-center">
        
        {/* MAIN CARD WITH GLASSMORPHISM */}
        <div className="w-full bg-[#0b0e26]/80 backdrop-blur-xl border border-indigo-500/30 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.15)] overflow-hidden">
          
          <div className="p-8 sm:p-10 space-y-6">
            
            {/* Header Branding */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 blur opacity-75 animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center border border-indigo-400/40 shadow-inner">
                  <Store className="w-8 h-8 text-white stroke-[2.2]" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-wider text-white uppercase">
                  Mulai Pakai POS Toko Anda
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Daftarkan bisnis Anda & sesuaikan sistem dalam 1 menit
                </p>
              </div>
            </div>

            {/* Alert Error */}
            {errorMsg && (
              <div className="p-3.5 bg-red-950/50 border border-red-500/50 text-red-300 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Register */}
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Row 1: Nama Pemilik & Nama Toko */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Nama Pemilik *
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-indigo-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      name="ownerName"
                      required
                      value={formData.ownerName}
                      onChange={handleChange}
                      placeholder="Contoh: Bpk. H. Ahmad"
                      className="w-full bg-[#111638]/70 border border-indigo-500/20 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition duration-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Nama Toko / Usaha *
                  </label>
                  <div className="relative flex items-center">
                    <Store className="w-4 h-4 text-indigo-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      name="storeName"
                      required
                      value={formData.storeName}
                      onChange={handleChange}
                      placeholder="Contoh: Toko Grosir Barokah"
                      className="w-full bg-[#111638]/70 border border-indigo-500/20 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition duration-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: No. Telepon & Bank */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    No. Telepon / WA *
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-indigo-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0812-3456-7890"
                      className="w-full bg-[#111638]/70 border border-indigo-500/20 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition duration-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    No. Rekening / Bank
                  </label>
                  <div className="relative flex items-center">
                    <CreditCard className="w-4 h-4 text-indigo-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleChange}
                      placeholder="BCA 12345678 a.n Ahmad"
                      className="w-full bg-[#111638]/70 border border-indigo-500/20 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition duration-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Alamat Toko */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Alamat Toko *
                </label>
                <div className="relative flex items-start">
                  <MapPin className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3 pointer-events-none" />
                  <textarea
                    name="address"
                    rows={2}
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Jl. Raya Pasar Induk No. 88, Blok A"
                    className="w-full bg-[#111638]/70 border border-indigo-500/20 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition duration-200 focus:ring-2 focus:ring-indigo-500/20 font-medium resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-indigo-500/10 my-2" />

              {/* Row 3: Email Admin & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Email Admin *
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-indigo-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="admin@tokobarokah.com"
                      className="w-full bg-[#111638]/70 border border-indigo-500/20 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition duration-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Password *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-indigo-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-[#111638]/70 border border-indigo-500/20 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 text-sm rounded-xl pl-10 pr-10 py-2.5 outline-none transition duration-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition duration-300 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{loading ? 'Menyiapkan Toko Anda...' : 'Buat Aplikasi Toko Saya Sekarang'}</span>
                {!loading && <span>🚀</span>}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center pt-1">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#0b0e26] px-3 text-[10px] text-slate-500 font-semibold tracking-wider uppercase absolute">
                SUDAH PUNYA AKUN?
              </span>
            </div>

            {/* Link Login */}
            <div className="text-center text-xs text-slate-400">
              Sudah pernah mendaftar?{' '}
              <Link 
                href="/login" 
                className="text-blue-400 font-semibold hover:text-blue-300 hover:underline inline-flex items-center gap-0.5 transition"
              >
                Masuk di sini &rsaquo;
              </Link>
            </div>
          </div>

          {/* Footer Card Features */}
          <div className="bg-[#080a1e]/90 border-t border-indigo-500/10 px-6 py-4 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-slate-300">Aman & Terisolasi</span>
              <span className="text-slate-500 scale-90">Data toko tidak tertukar</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-slate-300">Setup Otomatis</span>
              <span className="text-slate-500 scale-90">Sistem siap pakai</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Headphones className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-slate-300">Bantuan Gratis</span>
              <span className="text-slate-500 scale-90">Pendampingan awal</span>
            </div>
          </div>
        </div>

        {/* Footer Text Bawah */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <span>Sistem Kasir Grosir Multi-Unit v1.0</span>
          <span>•</span>
          <span className="text-slate-400 flex items-center gap-1">
            Supabase Auth <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
          </span>
        </div>

      </div>
    </div>
  )
}