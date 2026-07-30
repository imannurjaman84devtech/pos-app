'use client'

import { Store, User, ShieldCheck } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Toko & Akun</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Konfigurasi profil toko grosir dan informasi akun pengguna</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Store className="w-5 h-5" />
              </span>
              <h2 className="font-bold text-slate-800">Informasi Toko</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nama Toko</label>
                <input type="text" readOnly value="Toko Berkah Grosir" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-700 font-semibold" />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Status Multi-Tenant</label>
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold">
                  <ShieldCheck className="w-4 h-4" /> Pro Edition Active
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <User className="w-5 h-5" />
              </span>
              <h2 className="font-bold text-slate-800">Sesi Aktif</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Pengguna</label>
                <input type="text" readOnly value="Kasir Utama (Shift Pagi)" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-700 font-semibold" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}