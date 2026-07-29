'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg('Email atau password salah! Silakan coba lagi.')
      setLoading(false)
    } else if (data.session) {
      // Login Berhasil -> Arahkan ke Halaman Utama / Dashboard
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
        {/* Header / Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl text-white text-3xl font-black mb-3 shadow-lg shadow-blue-500/30">
            🛒
          </div>
          <h1 className="text-2xl font-black text-slate-800">POS GROSIR SYSTEM</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Masuk dengan akun kasir / admin toko Anda
          </p>
        </div>

        {/* Alert Error */}
        {errorMsg && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Email Kasir / Admin
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kasir@tokogrosir.com"
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-blue-600 font-medium text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-blue-600 font-medium text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:bg-slate-300 mt-2"
          >
            {loading ? 'Verifikasi Akun...' : 'Masuk ke Aplikasi 🚀'}
          </button>
        </form>

        <div className="mt-8 text-center border-t pt-4">
          <p className="text-[11px] text-slate-400">
            Sistem Kasir Grosir Multi-Unit v1.0 • Supabase Auth
          </p>
        </div>
      </div>
    </div>
  )
}