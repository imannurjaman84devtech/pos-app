'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { 
  ShoppingCart, 
  Package, 
  Warehouse, 
  Receipt, 
  Users, 
  Settings, 
  Store,
  ChevronRight,
  LogOut
} from 'lucide-react'

const menuItems = [
  { name: 'POS Kasir', href: '/pos', icon: ShoppingCart },
  { name: 'Katalog Produk', href: '/products', icon: Package },
  { name: 'Stok / Inventory', href: '/inventory', icon: Warehouse },
  { name: 'Laporan Transaksi', href: '/reports', icon: Receipt },
  { name: 'Pelanggan & Hutang', href: '/customers', icon: Users },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // State internal untuk dynamic profile
  const [storeName, setStoreName] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // 1. Ekstrak nama user dari metadata atau email
          const displayName = 
            user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.email?.split('@')[0] || 
            'Kasir Utama'

          setUserName(displayName)

          // 2. Ekstrak nama toko & role (Cek metadata dulu, baru fallback ke DB profiles)
          const metaStore = user.user_metadata?.store_name || user.user_metadata?.nama_toko
          const metaRole = user.user_metadata?.role

          if (metaStore) {
            setStoreName(metaStore)
            setUserRole(metaRole || 'Admin Toko')
          } else {
            // Ambil dari tabel profiles / stores di Supabase jika metadata kosong
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, stores(name)')
              .eq('id', user.id)
              .maybeSingle()

            if (profile) {
              setUserRole(profile.role || 'Kasir')
              const storeData = profile.stores as any
              setStoreName(storeData?.name || 'RUMAH BENTANG')
            } else {
              setStoreName('RUMAH BENTANG')
              setUserRole('Kasir Utama')
            }
          }
        }
      } catch (err) {
        console.error('Gagal memuat profil sidebar:', err)
        setStoreName('RUMAH BENTANG')
        setUserName('Kasir Utama')
        setUserRole('Shift Pagi')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?')
    if (confirmLogout) {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    }
  }

  // Ambil inisial huruf pertama untuk avatar
  const avatarInitial = userName ? userName.charAt(0).toUpperCase() : 'K'

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between border-r border-slate-800 shrink-0 hidden md:flex">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">
            G
          </div>
          <div>
            <h2 className="font-bold text-white text-base leading-tight tracking-wide">GROSIR POS</h2>
            <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
              PRO EDITION
            </span>
          </div>
        </div>

        {/* Store Indicator */}
        <div className="mx-4 my-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Toko Aktif</p>
            {loading ? (
              <div className="h-4 w-28 bg-slate-700/50 animate-pulse rounded mt-0.5" />
            ) : (
              <p className="text-xs font-bold text-white truncate" title={storeName}>
                {storeName}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-white font-bold text-sm shrink-0 uppercase">
            {avatarInitial}
          </div>
          <div className="overflow-hidden">
            {loading ? (
              <div className="space-y-1">
                <div className="h-3.5 w-20 bg-slate-700/50 animate-pulse rounded" />
                <div className="h-2.5 w-14 bg-slate-700/40 animate-pulse rounded" />
              </div>
            ) : (
              <>
                <p className="text-xs font-bold text-white truncate" title={userName}>{userName}</p>
                <p className="text-[10px] text-slate-400 truncate capitalize">{userRole}</p>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Keluar dari Aplikasi"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}