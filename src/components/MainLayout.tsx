'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Sembunyikan Sidebar jika di halaman root (/), landing, login, atau register
  const isHideSidebar = 
    pathname === '/' || 
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

  // Tampilan untuk Halaman Utama POS
  // Catatan: Header mobile, tombol hamburger, dan animasi sidebar sudah dihandle seratus persen oleh <Sidebar />
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050714] text-slate-100 w-full overflow-x-hidden">
      <Sidebar />

      {/* Konten Utama */}
      <main className="flex-1 flex flex-col min-h-screen w-full min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}