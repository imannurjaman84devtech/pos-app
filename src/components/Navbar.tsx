'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  // Sembunyikan Navbar jika berada di halaman Login atau Register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  const navItems = [
    { label: '🛒 POS Kasir', href: '/pos' },
    { label: '📦 Produk', href: '/products' },
    { label: '📥 Restok', href: '/inventory/restock' },
    { label: '📊 Laporan', href: '/reports' },
  ]

  return (
    <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700/80 sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Tombol Kembali ke Dashboard & Brand */}
        <div className="flex items-center gap-3">
          {pathname !== '/' && (
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/70 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition border border-slate-600/50"
            >
              <span>←</span>
              <span>Dashboard</span>
            </Link>
          )}

          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🏬</span>
            <span className="font-black text-white tracking-wide text-sm hidden sm:inline">
              POS GROSIR
            </span>
          </Link>
        </div>

        {/* Navigasi Modul Cepat */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}