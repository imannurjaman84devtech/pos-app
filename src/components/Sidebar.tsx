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
  LogOut,
  Menu,
  X,
  Sparkles
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

  // 1. State Toggle Mobile Menu
  const [isOpen, setIsOpen] = useState(false)

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
          const displayName = 
            user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.email?.split('@')[0] || 
            'Kasir Utama'

          setUserName(displayName)

          const metaStore = user.user_metadata?.store_name || user.user_metadata?.nama_toko
          const metaRole = user.user_metadata?.role

          if (metaStore) {
            setStoreName(metaStore)
            setUserRole(metaRole || 'Admin Toko')
          } else {
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

  // 2. Otomatis tutup sidebar di HP saat navigasi/pindah halaman
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?')
    if (confirmLogout) {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    }
  }

  const avatarInitial = userName ? userName.charAt(0).toUpperCase() : 'K'

  return (
    <>
      {/* ========================================================= */}
      {/* A. HEADER TOPBAR MOBILE (Hanya Tampil di Layar HP/Kecil)  */}
      {/* ========================================================= */}
      <div className="md:hidden bg-[#080a1e]/90 backdrop-blur-xl border-b border-indigo-500/20 p-4 flex items-center justify-between sticky top-0 z-30 font-sans">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
            G
          </div>
          <div>
            <h2 className="font-black text-white text-xs tracking-wider uppercase">GROSIR POS</h2>
            <p className="text-[10px] text-indigo-300/80 truncate max-w-[150px] font-medium">{storeName || 'RUMAH BENTANG'}</p>
          </div>
        </div>

        {/* Tombol Hamburger (☰ / ✕) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-300 hover:text-white hover:bg-indigo-500/10 rounded-xl transition-all border border-transparent hover:border-indigo-500/20 cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {isOpen ? <X className="w-6 h-6 text-indigo-400" /> : <Menu className="w-6 h-6 text-indigo-400" />}
        </button>
      </div>

      {/* ========================================================= */}
      {/* B. BACKDROP / OVERLAY GELAP SAAT MENU MOBILE TERBUKA      */}
      {/* ========================================================= */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-[#050714]/80 backdrop-blur-md z-40 md:hidden transition-opacity"
        />
      )}

      {/* ========================================================= */}
      {/* C. CONTAINER SIDEBAR (Off-Canvas Mobile + Fixed Desktop)  */}
      {/* ========================================================= */}
      <aside className={`
        fixed md:static top-0 bottom-0 left-0 z-50
        w-64 bg-[#080a1e]/95 backdrop-blur-xl text-slate-300 min-h-screen flex flex-col justify-between border-r border-indigo-500/15 shrink-0 font-sans selection:bg-indigo-500 selection:text-white
        transition-transform duration-300 ease-in-out shadow-[10px_0_30px_rgba(0,0,0,0.3)] md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-indigo-500/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 blur-sm opacity-70 animate-pulse" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/40">
                  G
                </div>
              </div>
              <div>
                <h2 className="font-black text-white text-base leading-tight tracking-wider">GROSIR POS</h2>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 tracking-widest uppercase mt-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" /> PRO EDITION
                </span>
              </div>
            </div>

            {/* Tombol X Tutup (Mobile Only) */}
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 hover:bg-indigo-500/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Store Indicator */}
          <div className="mx-4 my-4 p-3 bg-[#111638]/70 rounded-2xl border border-indigo-500/20 flex items-center gap-3 shadow-inner">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-blue-500/10 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Toko Aktif</p>
              {loading ? (
                <div className="h-4 w-28 bg-indigo-950/50 animate-pulse rounded mt-1" />
              ) : (
                <p className="text-xs font-bold text-white truncate tracking-wide" title={storeName}>
                  {storeName}
                </p>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="px-3 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#111638]/50 border border-transparent'
                  }`}
                >
                  {/* Glowing Effect for Active Menu */}
                  {isActive && (
                    <div className="absolute top-0 left-0 w-full h-full bg-indigo-400/10 blur-sm pointer-events-none" />
                  )}

                  <div className="flex items-center gap-3 relative z-10">
                    <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-indigo-400/70 group-hover:text-indigo-300'
                    }`} />
                    <span className="tracking-wide">{item.name}</span>
                  </div>
                  
                  {isActive && <ChevronRight className="w-3.5 h-3.5 stroke-[3] text-indigo-200 relative z-10" />}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-indigo-500/15 bg-[#060818]/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 border border-indigo-400/40 flex items-center justify-center text-white font-black text-sm shrink-0 uppercase shadow-md shadow-indigo-600/20">
              {avatarInitial}
            </div>
            <div className="overflow-hidden">
              {loading ? (
                <div className="space-y-1">
                  <div className="h-3.5 w-20 bg-indigo-950/50 animate-pulse rounded" />
                  <div className="h-2.5 w-14 bg-indigo-950/40 animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-white truncate tracking-wide" title={userName}>{userName}</p>
                  <p className="text-[10px] text-indigo-300/70 truncate capitalize font-semibold">{userRole}</p>
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Keluar dari Aplikasi"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 rounded-xl transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  )
}