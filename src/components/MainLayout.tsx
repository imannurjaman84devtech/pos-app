'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Menu, X } from 'lucide-react'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 1. Sembunyikan Sidebar jika di halaman landing, login, atau register
  const isHideSidebar = 
    pathname === '/landing' || 
    pathname === '/login' || 
    pathname === '/register'

  // Jika halaman landing / auth, tampilkan full tanpa sidebar
  if (isHideSidebar) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 w-full overflow-x-hidden">
        {children}
      </div>
    )
  }

  // 2. Tampilan untuk Halaman Aplikasi (POS, Stok, Laporan, dll)
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 text-slate-100 w-full overflow-x-hidden">
      
      {/* Header Mobile - Hanya muncul di HP */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-black text-indigo-400 tracking-wider">GROSIR POS</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Overlay Gelap saat menu mobile terbuka di HP */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Responsive */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transition-transform duration-200 ease-in-out
        md:static md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      {/* Konten Utama */}
      <main className="flex-1 flex flex-col min-h-screen w-full min-w-0 overflow-y-auto">
        {children}
      </main>

    </div>
  )
}