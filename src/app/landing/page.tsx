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
  Smartphone
} from 'lucide-react'

export default function LandingPage() {
  // Ganti nomor WA kamu di sini (Gunakan format 62...)
  const whatsappNumber = '6281234567890' 
  const waMessage = encodeURIComponent('Halo Admin, saya tertarik untuk coba Demo Aplikasi Kasir & Stok Grosir. Bisa minta info selengkapnya?')
  const waLink = `https://wa.me/${whatsappNumber}?text=${waMessage}`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Navbar Minimalis */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
              GrosirPOS Pro
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/pos" 
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg transition"
            >
              Coba POS
            </Link>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition active:scale-95"
            >
              Coba Demo Gratis
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Glow Effects background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-indigo-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Sistem POS khusus Toko Grosir & Distributor</span>
          </div>

          <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight leading-tight md:leading-tight">
            Atur Stok Multi-Satuan & Kasir Grosir <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">Tanpa Pusing</span>
          </h1>

          <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Kelola penjualan eceran (Pcs) hingga grosir (Dus/Karton), scan barcode langsung dari HP, dan pantau stok otomatis secara real-time.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
            >
              <span>Hubungi Kami via WhatsApp</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-sm px-6 py-4 rounded-2xl transition"
            >
              Lihat Simulasi Sistem
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="pt-8 flex flex-wrap justify-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Tanpa Alat Tambahan Mahal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-Device (Laptop/Tablet/HP)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Penyimpanan Cloud Aman</span>
            </div>
          </div>
        </div>

        {/* Visual Mockup Card */}
        <div className="max-w-5xl mx-auto px-4 mt-12 relative z-10">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur">
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800/60 overflow-hidden relative">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-mono text-[11px] bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-indigo-400">
                  Preview Aplikasi Kasir & Inventory
                </span>
              </div>

              {/* Grid Mini Mockup */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Minyak Goreng 2L</span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">ADA</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Satuan: Pcs | Dus (Isi 6)</div>
                  <div className="text-xs font-bold text-indigo-400">Rp 34.000 / Pcs</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Beras Premium 5kg</span>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">SEDIKIT</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Satuan: SAK | Karung</div>
                  <div className="text-xs font-bold text-indigo-400">Rp 72.000 / SAK</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Indomie Goreng</span>
                    <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">HABIS</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Satuan: Pcs | Dus (Isi 40)</div>
                  <div className="text-xs font-bold text-indigo-400">Rp 112.000 / Dus</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section (Cara Lama vs Cara Modern) */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Kenapa Harus Pindah ke GrosirPOS?</h2>
            <p className="text-xs md:text-sm text-slate-400">Bandingkan kendala metode manual dengan kemudahan sistem digital kami.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cara Lama */}
            <div className="bg-rose-950/20 border border-rose-900/40 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-rose-400 flex items-center gap-2 text-base">
                <XCircle className="w-5 h-5" />
                Cara Lama / Manual
              </h3>
              <ul className="space-y-3 text-xs md:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Bingung hitung stok saat barang dijual Pcs dan Dus bersamaan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Stok sering selisih tanpa ketahuan barang hilang/rusak.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Kasir lambat karena harus hapalan atau ketik nama barang manual.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Harus beli alat barcode scanner tambahan yang mahal.</span>
                </li>
              </ul>
            </div>

            {/* Solusi GrosirPOS */}
            <div className="bg-indigo-950/30 border border-indigo-500/40 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-indigo-400 flex items-center gap-2 text-base">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                Dengan GrosirPOS
              </h3>
              <ul className="space-y-3 text-xs md:text-sm text-slate-200">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>Konversi otomatis! Jual 2 Dus, stok Pcs otomatis terpotong presisi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>Badge status stok (ADA/SEDIKIT/HABIS) terpantau langsung.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>Scan Barcode super cepat langsung menggunakan Kamera HP/Tablet.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>Fitur Quick Adjust untuk mencatat barang masuk atau rusak instan.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white">Fitur Lengkap untuk Skala Usaha Grosir</h2>
          <p className="text-xs md:text-sm text-slate-400">Dirancang fungsional tanpa fitur rumit yang tidak diperlukan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl w-fit mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Multi-Satuan & Konversi</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atur harga berjenjang dari Eceran, Pack, hingga Dus dalam 1 produk. Sistem menghitung potongan stok secara presisi.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl w-fit mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Scan Barcode Kamera HP</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tidak perlu beli hardware scanner mahal. Cukup gunakan kamera HP/Tablet untuk memindai kode produk.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl w-fit mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Penyesuaian Stok Cepat</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ada stok masuk dari supplier atau barang pecah/rusak? Update persediaan stok hanya dalam 2 klik.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl w-fit mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Pembayaran QRIS & Transfer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dukungan pembayaran Cash, Transfer Bank, hingga integrasi tampilan QRIS otomatis untuk kemudahan pelanggan.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl w-fit mb-4">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Cetak Struk Thermal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Langsung cetak nota fisik dengan printer thermal Bluetooth/USB secara rapi dan profesional.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl w-fit mb-4">
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
      <footer className="border-t border-slate-800/80 bg-slate-950 py-16 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white">Siap Digitalisasi Toko Grosir Anda?</h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
            Dapatkan akses demonstrasi sistem dan konsultasi gratis untuk kebutuhan operasional toko Anda hari ini.
          </p>
          <div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition active:scale-95"
            >
              <span>Hubungi Kami Sekarang (WhatsApp)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <p className="text-[11px] text-slate-600 pt-8">
            © {new Date().getFullYear()} GrosirPOS Pro. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}