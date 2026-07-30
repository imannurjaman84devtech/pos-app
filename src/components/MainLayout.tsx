'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Sembunyikan Sidebar jika URL berada di halaman login atau register
  const isAuthPage = pathname === '/login' || pathname === '/register'

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 w-full">
      {/* Sidebar hanya dirender jika BUKAN halaman login/register */}
      {!isAuthPage && <Sidebar />}

      {/* Konten Utama */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto w-full">
        {children}
      </main>
    </div>
  )
}