'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Package, 
  Barcode, 
  Layers, 
  QrCode, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Zap, 
  Store, 
  Sparkles,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Boxes
} from 'lucide-react'

export default function LandingPage() {
  // Ganti nomor WA kamu di sini (Gunakan format 62...)
  const whatsappNumber = '6283827740499' 
  const waMessage = encodeURIComponent('Halo Admin, saya tertarik untuk coba Demo Aplikasi Kasir & Stok Grosir. Bisa minta info selengkapnya?')
  const waLink = `https://wa.me/${whatsappNumber}?text=${waMessage}`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Dynamic Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/15 via-emerald-500/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-1/3 left-[-100px] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[160px]" />
        <div className="absolute top-2/3 right-[-100px] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[160px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Sticky Header / Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-2xl sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl text-slate-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Store className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                GrosirPOS <span className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Pro</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/pos" 
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-cyan-400 px-3.5 py-2 rounded-xl transition hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              Coba POS
            </Link>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-all active:scale-95"
            >
              <span>Demo Gratis</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-24 md:pb-32 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 px-4 py-2 rounded-full text-cyan-300 text-xs sm:text-sm font-semibold shadow-[0_0_15px_rgba(6,182,212,0.1)] backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Sistem POS khusus Toko Grosir & Distributor</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Atur Stok Multi-Satuan & Kasir Grosir{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Tanpa Pusing
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Kelola penjualan eceran (Pcs) hingga grosir (Dus/Karton), scan barcode langsung dari HP, dan pantau stok otomatis secara real-time.
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all active:scale-95"
            >
              <span>Hubungi Kami via WhatsApp</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </a>
            <Link
              href="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-200 font-bold text-sm px-7 py-4 rounded-2xl backdrop-blur-xl transition"
            >
              <Boxes className="w-4 h-4 text-cyan-400" />
              <span>Lihat Simulasi Sistem</span>
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="pt-6 flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800/80 px-3.5 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Tanpa Alat Tambahan Mahal</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800/80 px-3.5 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-Device (Laptop/Tablet/HP)</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800/80 px-3.5 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Penyimpanan Cloud Aman</span>
            </div>
          </div>
        </div>

        {/* Visual App Mockup Preview */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-14 relative z-10">
          <div className="p-2 sm:p-3 bg-slate-900/70 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-2xl">
            <div className="bg-slate-950 rounded-2xl p-5 sm:p-7 border border-slate-800/80 overflow-hidden relative">
              
              {/* Card Header Bar */}
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800/80 text-xs text-slate-400">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="inline-flex items-center gap-2 bg-slate-900 px-3.5 py-1 rounded-full border border-slate-800 text-cyan-400 font-mono text-[11px]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Preview Live Dashboard & Inventory</span>
                </div>
              </div>

              {/* Grid Mini Mockup Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                
                {/* Item 1 */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3 relative group hover:border-cyan-500/30 transition">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-bold text-slate-100">Minyak Goreng 2L</span>
                    <span className="text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full">
                      ADA
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">Satuan: Pcs | Dus (Isi 6)</div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs font-mono font-bold text-cyan-400">Rp 34.000 / Pcs</span>
                    <span className="text-[10px] font-mono text-slate-500">Stok: 120</span>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3 relative group hover:border-amber-500/30 transition">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-bold text-slate-100">Beras Premium 5kg</span>
                    <span className="text-[10px] font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded-full">
                      SEDIKIT
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">Satuan: SAK | Karung</div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs font-mono font-bold text-cyan-400">Rp 72.000 / SAK</span>
                    <span className="text-[10px] font-mono text-slate-500">Stok: 8</span>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3 relative group hover:border-rose-500/30 transition">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-bold text-slate-100">Indomie Goreng</span>
                    <span className="text-[10px] font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2.5 py-0.5 rounded-full">
                      HABIS
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">Satuan: Pcs | Dus (Isi 40)</div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs font-mono font-bold text-cyan-400">Rp 112.000 / Dus</span>
                    <span className="text-[10px] font-mono text-slate-500">Stok: 0</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section (Cara Lama vs GrosirPOS) */}
      <section className="py-20 bg-slate-900/40 border-y border-slate-800/80 relative z-10 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Kenapa Harus Pindah ke GrosirPOS?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Bandingkan kendala operasional metode manual dengan efisiensi sistem digital kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Cara Lama Card */}
            <div className="bg-gradient-to-b from-rose-950/30 to-slate-900/60 border border-rose-500/20 p-6 sm:p-8 rounded-3xl space-y-5 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-rose-300 text-lg">Cara Lama / Manual</h3>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                  <span>Bingung hitung stok saat barang dijual Pcs dan Dus bersamaan.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                  <span>Stok sering selisih tanpa ketahuan barang hilang/rusak.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                  <span>Kasir lambat karena harus hapalan atau ketik nama barang manual.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                  <span>Harus beli alat barcode scanner tambahan yang mahal.</span>
                </li>
              </ul>
            </div>

            {/* Solusi GrosirPOS Card */}
            <div className="bg-gradient-to-b from-cyan-950/40 via-slate-900/70 to-emerald-950/30 border border-cyan-500/40 p-6 sm:p-8 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="font-bold text-cyan-300 text-lg">Dengan GrosirPOS</h3>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                  <span>Konversi otomatis! Jual 2 Dus, stok Pcs otomatis terpotong presisi.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                  <span>Badge status stok (ADA/SEDIKIT/HABIS) terpantau langsung.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                  <span>Scan Barcode super cepat langsung menggunakan Kamera HP/Tablet.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                  <span>Fitur Quick Adjust untuk mencatat barang masuk atau rusak instan.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Showcase Grid Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 space-y-12 z-10 relative">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Fitur Lengkap Skala Usaha Grosir
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Dirancang fungsional tanpa fitur rumit yang tidak diperlukan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-xl group hover:-translate-y-1">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Multi-Satuan & Konversi</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atur harga berjenjang dari Eceran, Pack, hingga Dus dalam 1 produk. Sistem menghitung potongan stok secara presisi.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-xl group hover:-translate-y-1">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Scan Barcode Kamera HP</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tidak perlu beli hardware scanner mahal. Cukup gunakan kamera HP/Tablet untuk memindai kode produk.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-xl group hover:-translate-y-1">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Penyesuaian Stok Cepat</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ada stok masuk dari supplier atau barang pecah/rusak? Update persediaan stok hanya dalam 2 klik.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-xl group hover:-translate-y-1">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Pembayaran QRIS & Transfer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dukungan pembayaran Cash, Transfer Bank, hingga integrasi tampilan QRIS otomatis untuk kemudahan pelanggan.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-xl group hover:-translate-y-1">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Cetak Struk Thermal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Langsung cetak nota fisik dengan printer thermal Bluetooth/USB secara rapi dan profesional.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-xl group hover:-translate-y-1">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Status Stok Real-Time</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Indikator visual pintar (ADA, SEDIKIT, HABIS) membantu kasir mengetahui barang yang perlu di-restock secara instan.
            </p>
          </div>

        </div>
      </section>

      {/* Footer / CTA Section */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl py-16 text-center relative z-10">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Siap Digitalisasi Toko Grosir Anda?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Dapatkan akses demonstrasi sistem dan konsultasi gratis untuk kebutuhan operasional toko Anda hari ini.
          </p>
          <div className="pt-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition active:scale-95"
            >
              <span>Hubungi Kami Sekarang (WhatsApp)</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </a>
          </div>
          <p className="text-[11px] text-slate-600 pt-8 font-medium">
            © {new Date().getFullYear()} GrosirPOS Pro. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}