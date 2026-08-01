'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import { 
  ShoppingCart, 
  Package, 
  ArrowDownToLine, 
  BarChart3, 
  LogOut, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  UserPlus
} from 'lucide-react'

export default function HomePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email ?? 'Pengguna')
      }
    } catch (error) {
      console.error('Error checking user session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserEmail(null)
    router.push('/login')
  }

  // 1. STATE LOADING SESI
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050714] flex flex-col items-center justify-center text-slate-200 font-semibold gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 tracking-wider uppercase font-bold">Memuat Sistem...</span>
      </div>
    )
  }

  // 2. TAMPILAN LANDING PAGE (JIKA BELUM LOGIN)
  if (!userEmail) {
    return (
      <div className="min-h-screen w-full bg-[#050714] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
        
        {/* Background Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050714] to-[#050714] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

        {/* Card Utama Landing Page */}
        <div className="relative z-10 max-w-md w-full bg-[#0b0e26]/80 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(79,70,229,0.15)] flex flex-col items-center">
          
          {/* LOGO INTERAKTIF (Klik untuk menuju Login) */}
          <Link 
            href="/login" 
            className="group relative cursor-pointer mb-6 transform hover:scale-105 active:scale-95 transition-all duration-300"
          >
            {/* Glow Ring Effect di Belakang Logo */}
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-md opacity-60 group-hover:opacity-100 group-hover:blur-lg transition duration-500 animate-pulse" />
            
            {/* Box Logo */}
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-indigo-500/30 shadow-2xl bg-[#080a1d] flex items-center justify-center">
              <Image
                src="/logo-gg.png"
                alt="POS Grosir System Logo"
                width={144}
                height={144}
                priority
                className="object-cover group-hover:scale-110 transition duration-500"
              />
            </div>
          </Link>

          {/* Title & Description */}
          <h1 className="text-2xl font-black tracking-tight text-white mb-2">
            POS GROSIR SYSTEM
          </h1>
          <p className="text-xs text-slate-400 mb-8 max-w-xs leading-relaxed font-medium">
            Sistem Kasir & Manajemen Toko Grosir Modern. Klik logo di atas atau pilih tombol di bawah untuk masuk.
          </p>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <Link
              href="/login"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all duration-300 group"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Ke Aplikasi</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
            </Link>

            <Link
              href="/register"
              className="w-full py-3.5 px-4 rounded-xl bg-[#111638] hover:bg-[#181f4d] border border-indigo-500/30 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300"
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>Daftar Toko Baru</span>
            </Link>
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-4 border-t border-indigo-500/10 w-full text-center">
            <span className="text-[10px] text-slate-500 font-mono">
              v1.0.0 • Powered by Supabase & Next.js
            </span>
          </div>

        </div>
      </div>
    )
  }

  // 3. MENU UTAMA DASHBOARD (JIKA SUDAH LOGIN)
  const menuList = [
    {
      title: 'Mesin Kasir (POS)',
      desc: 'Transaksi penjualan cepat, scanner barcode & cetak struk thermal.',
      icon: ShoppingCart,
      href: '/pos',
      btnGradient: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/20',
      iconBg: 'from-blue-500/20 to-indigo-500/10 border-indigo-500/30 text-indigo-400',
    },
    {
      title: 'Katalog Produk',
      desc: 'Kelola master barang, harga eceran/grosir, dan multi-unit.',
      icon: Package,
      href: '/products',
      btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20',
      iconBg: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      title: 'Restok Barang',
      desc: 'Input barang masuk dari supplier & konversi otomatis ke eceran.',
      icon: ArrowDownToLine,
      href: '/inventory/restock',
      btnGradient: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/20',
      iconBg: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    },
    {
      title: 'Laporan Penjualan',
      desc: 'Lihat omzet harian, total transaksi, dan detail barang terjual.',
      icon: BarChart3,
      href: '/reports',
      btnGradient: 'from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/20',
      iconBg: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-purple-400',
    },
  ]

  return (
    <div className="min-h-screen w-full bg-[#050714] text-slate-200 p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Background Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/15 via-[#050714] to-[#050714] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Header Welcome Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0b0e26]/80 backdrop-blur-xl border border-indigo-500/30 p-6 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.12)] gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Selamat Datang 👋</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              Sistem Kasir Grosir
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <span>Login sebagai:</span>
              <span className="text-slate-200 bg-[#111638] px-2.5 py-0.5 rounded-lg border border-indigo-500/20 font-semibold">
                {userEmail}
              </span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-500/30 font-bold rounded-xl text-xs transition duration-200 flex items-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer active:scale-95"
          >
            <span>Keluar / Logout</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Grid Menu Utama */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuList.map((menu, idx) => {
            const IconComponent = menu.icon
            return (
              <Link
                key={idx}
                href={menu.href}
                className="group bg-[#0b0e26]/70 backdrop-blur-xl border border-indigo-500/20 hover:border-indigo-500/50 p-6 rounded-3xl transition duration-300 flex flex-col justify-between shadow-[0_0_30px_rgba(79,70,229,0.06)] hover:shadow-[0_0_40px_rgba(79,70,229,0.18)] hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Subtle Hover Glow Lines Inside Card */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />

                <div>
                  <div className="flex items-center justify-between mb-5">
                    {/* Glowing Icon Container */}
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${menu.iconBg} border shadow-inner group-hover:scale-110 transition duration-300`}>
                      <IconComponent className="w-7 h-7 stroke-[2.2]" />
                    </div>

                    <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-300 flex items-center gap-1 transition">
                      Buka Modul <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-2 tracking-wide group-hover:text-indigo-200 transition">
                    {menu.title}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {menu.desc}
                  </p>
                </div>

                <div className="mt-8">
                  <div className={`w-full py-3 rounded-xl text-center font-bold text-xs text-white bg-gradient-to-r ${menu.btnGradient} shadow-lg transition duration-200`}>
                    Akses {menu.title}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer Info Tambahan */}
        <div className="pt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-indigo-500/10">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Sistem Siap Digunakan
          </span>
          <span className="flex items-center gap-1">
            Sesi Terproteksi <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </span>
        </div>

      </div>
    </div>
  )
}