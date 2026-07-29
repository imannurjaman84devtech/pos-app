'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'

export default function HomePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setUserEmail(user.email ?? 'Pengguna')
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-semibold">
        Memeriksa Sesi Login...
      </div>
    )
  }

  const menuList = [
    {
      title: 'Mesin Kasir (POS)',
      desc: 'Transaksi penjualan cepat, scanner barcode & cetak struk thermal.',
      icon: '🛒',
      href: '/pos',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Katalog Produk',
      desc: 'Kelola master barang, harga eceran/grosir, dan multi-unit.',
      icon: '📦',
      href: '/products',
      color: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      title: 'Restok Barang',
      desc: 'Input barang masuk dari supplier & konversi otomatis ke eceran.',
      icon: '📥',
      href: '/inventory/restock',
      color: 'bg-amber-600 hover:bg-amber-700',
    },
    {
      title: 'Laporan Penjualan',
      desc: 'Lihat omzet harian, total transaksi, dan detail barang terjual.',
      icon: '📊',
      href: '/reports',
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Welcome Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/80 backdrop-blur border border-slate-700/60 p-6 rounded-3xl gap-4">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Selamat Datang 👋</span>
            <h1 className="text-2xl font-black text-white mt-1">Sistem Kasir Grosir</h1>
            <p className="text-xs text-slate-400 mt-1">
              Login sebagai: <strong className="text-slate-200">{userEmail}</strong>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-xl text-xs transition"
          >
            Keluar / Logout 🚪
          </button>
        </div>

        {/* Grid Menu Utama */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuList.map((menu, idx) => (
            <Link
              key={idx}
              href={menu.href}
              className="group bg-slate-800 border border-slate-700/70 hover:border-slate-500 p-6 rounded-3xl transition duration-200 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl p-3 bg-slate-700/50 rounded-2xl w-fit group-hover:scale-110 transition">
                    {menu.icon}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-300">
                    Buka Modul →
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{menu.title}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">{menu.desc}</p>
              </div>

              <div className="mt-6">
                <div className={`w-full py-2.5 rounded-xl text-center font-bold text-xs text-white transition ${menu.color}`}>
                  Akses {menu.title}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}