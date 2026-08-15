'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Product } from '@/types/pos'
import { Html5QrcodeScanner } from 'html5-qrcode'
import {
  Plus,
  Package,
  Barcode,
  Trash2,
  Camera,
  X,
  Loader2,
  Sparkles,
  Layers,
  Edit2,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Box,
  Tag
} from 'lucide-react'

interface UnitInput {
  unit_name: string
  conversion_factor: number
  price: number
  is_base_unit: boolean
}

export default function ProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // State untuk Quick Adjust Stock Modal
  const [stockModalProd, setStockModalProd] = useState<Product | null>(null)
  const [adjustAmount, setAdjustAmount] = useState<number>(0)
  const [adjustType, setAdjustType] = useState<'add' | 'reduce'>('add')

  // State untuk Camera Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [initialStock, setInitialStock] = useState<number>(0)

  const [units, setUnits] = useState<UnitInput[]>([
    { unit_name: 'Pcs', conversion_factor: 1, price: 5000, is_base_unit: true },
    { unit_name: 'Dus', conversion_factor: 24, price: 110000, is_base_unit: false }
  ])

  useEffect(() => {
    fetchProducts()
  }, [])

  // Ref & Effect untuk Scanner Kamera HP
  // Ref & Effect untuk Scanner Kamera HP (Versi Aman & Clean)
  useEffect(() => {
    let isMounted = true;
    let timerId: NodeJS.Timeout;

    if (isScannerOpen) {
      timerId = setTimeout(() => {
        // Cek apakah komponen/modal masih terbuka setelah 300ms
        if (!isMounted) return;

        const scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 150 } },
          false
        );

        scanner.render(
          (decodedText) => {
            try {
              const audio = new Audio('/sounds/beep.mp3');
              audio.play();
            } catch (e) {
              console.log('Audio error/not found');
            }

            setBarcode(decodedText);
            setIsScannerOpen(false);

            // Hentikan scanner setelah berhasil scan
            scanner.clear().catch(err => console.error("Error clearing scanner on success", err));
          },
          (errorMessage) => {
            // Abaikan error per-frame scan biasa
          }
        );

        // Jika komponen ditutup saat scanner sudah aktif, bersihkan scanner-nya
        return () => {
          scanner.clear().catch(err => console.error("Failed to clear scanner", err));
        };
      }, 300);
    }

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isScannerOpen]);

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, product_units(*)')
      .order('created_at', { ascending: false })

    if (data) setProducts(data as Product[])
    if (error) console.error(error)
    setLoading(false)
  }

  const handleAddUnitInput = () => {
    setUnits([...units, { unit_name: '', conversion_factor: 1, price: 0, is_base_unit: false }])
  }

  const handleRemoveUnitInput = (index: number) => {
    if (units[index].is_base_unit) {
      alert('Satuan dasar (Base Unit) tidak boleh dihapus!')
      return
    }
    setUnits(units.filter((_, i) => i !== index))
  }

  const handleUnitChange = (index: number, field: keyof UnitInput, value: any) => {
    const updated = [...units]
    updated[index] = { ...updated[index], [field]: value }
    setUnits(updated)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Validasi Input
    if (!name.trim()) return alert('Nama produk wajib diisi!')
    if (units.length === 0) return alert('Produk harus memiliki minimal 1 satuan!')

    const hasEmptyUnitName = units.some(u => !u.unit_name.trim())
    if (hasEmptyUnitName) return alert('Semua nama satuan wajib diisi!')

    setSubmitting(true)

    try {
      // 2. Insert Data Produk Utama
      const { data: newProd, error: prodErr } = await supabase
        .from('products')
        .insert([{
          name,
          barcode: barcode.trim() || null,
          stock_in_base_unit: initialStock
        }])
        .select()
        .single()

      if (prodErr) throw prodErr

      // 3. Prepare & Insert Data Units
      const unitPayloads = units.map(u => ({
        product_id: newProd.id,
        unit_name: u.unit_name.trim(),
        conversion_factor: Number(u.conversion_factor),
        price: Number(u.price),
        is_base_unit: u.is_base_unit
      }))

      const { error: unitErr } = await supabase
        .from('product_units')
        .insert(unitPayloads)

      if (unitErr) throw unitErr

      // 4. Reset Form & Close Modal
      setName('')
      setBarcode('')
      setInitialStock(0)
      setUnits([
        { unit_name: 'Pcs', conversion_factor: 1, price: 5000, is_base_unit: true },
        { unit_name: 'Dus', conversion_factor: 24, price: 110000, is_base_unit: false }
      ])
      setIsModalOpen(false)
      fetchProducts()
    } catch (err: any) {
      alert('Gagal menyimpan produk: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Update/Penyesuaian Stok Cepat
  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockModalProd || adjustAmount <= 0) return

    setSubmitting(true)
    const currentStock = stockModalProd.stock_in_base_unit
    const newStock = adjustType === 'add'
      ? currentStock + adjustAmount
      : Math.max(0, currentStock - adjustAmount)

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_in_base_unit: newStock })
        .eq('id', stockModalProd.id)

      if (error) throw error

      setStockModalProd(null)
      setAdjustAmount(0)
      fetchProducts()
    } catch (err: any) {
      alert('Gagal memperbarui stok: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Hapus Produk
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) return

    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      fetchProducts()
    } catch (err: any) {
      alert('Gagal menghapus produk: ' + err.message)
    }
  }

  const inputStyle = "w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/80 transition-all font-medium text-xs sm:text-sm placeholder:text-slate-600"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-10 font-sans relative">

      {/* Glow Backdrops */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/70 border border-slate-800/80 backdrop-blur-2xl p-6 rounded-3xl shadow-xl shadow-cyan-950/10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-wide bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Katalog Produk Grosir
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Kelola master data barang, barcode, stok, dan konversi multi-unit secara terpusat
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all active:scale-[0.98] text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Produk</span>
          </button>
        </div>

        {/* Tabel / Content Container */}
        <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-2xl rounded-3xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-xs font-medium tracking-wide text-slate-400">Memuat katalog produk...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-400">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="font-semibold text-slate-300 text-sm">Belum Ada Produk Tersedia</p>
              <p className="text-xs text-slate-500 max-w-sm">Mulai tambahkan produk grosir dan atur harga satuannya untuk kemudahan transaksi kasir.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Nama Produk / Barcode</th>
                    <th className="p-4">Status & Jumlah Stok</th>
                    <th className="p-4">Pengaturan Satuan & Harga</th>
                    <th className="p-4 pr-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
                  {products.map(p => {
                    const baseUnitName = p.product_units?.find(u => u.is_base_unit)?.unit_name || 'Unit'
                    const stock = p.stock_in_base_unit

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-100">{p.name}</div>
                          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-1">
                            <Barcode className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{p.barcode || 'Tanpa Barcode'}</span>
                          </div>
                        </td>

                        {/* Stok + Status Badge */}
                        <td className="p-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            {stock <= 0 ? (
                              <span className="text-[10px] font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2.5 py-0.5 rounded-full">
                                HABIS
                              </span>
                            ) : stock <= 10 ? (
                              <span className="text-[10px] font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded-full">
                                SEDIKIT
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full">
                                ADA
                              </span>
                            )}

                            <div className="inline-flex items-baseline gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-lg">
                              <span className="font-bold text-cyan-400 text-base font-mono">{stock}</span>
                              <span className="text-xs font-medium text-slate-400">{baseUnitName}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {p.product_units?.map(u => (
                              <div
                                key={u.id}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${u.is_base_unit
                                    ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300'
                                    : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                                  }`}
                              >
                                <span className="font-semibold">{u.unit_name}</span>
                                <span className="text-slate-600 mx-1.5">|</span>
                                <span className="text-slate-400">Isi {u.conversion_factor}</span>
                                <span className="text-slate-600 mx-1.5">|</span>
                                <strong className="font-bold text-slate-100">Rp {u.price.toLocaleString('id-ID')}</strong>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Tombol Aksi (Kelola Stok & Hapus) */}
                        <td className="p-4 pr-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setStockModalProd(p)
                                setAdjustType('add')
                                setAdjustAmount(0)
                              }}
                              className="p-2 text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 rounded-xl transition"
                              title="Tambah/Kurang Stok"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-2 text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Input Produk Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-100">Tambah Produk & Satuan Grosir</h2>
                  <p className="text-xs text-slate-400">Lengkapi rincian informasi item dan variasi harganya</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Indomie Goreng"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Barcode / SKU (Opsional)</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Scan/Ketik Barcode..."
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      className={`${inputStyle} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="absolute right-2 p-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition"
                      title="Scan lewat Kamera HP"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Stok Awal (Dalam Satuan Dasar/Eceran)</label>
                <input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={e => setInitialStock(Number(e.target.value))}
                  className={`${inputStyle} font-mono font-bold text-cyan-400`}
                />
              </div>

              {/* Dynamic Unit Form */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <label className="block text-xs font-semibold text-slate-200">Pengaturan Multi-Satuan & Harga *</label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddUnitInput}
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 font-semibold px-3 py-1.5 rounded-xl transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Satuan Grosir</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {units.map((unit, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                      <div className="w-1/3">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Satuan</label>
                        <input
                          type="text"
                          required
                          placeholder="Pcs/Dus"
                          value={unit.unit_name}
                          onChange={e => handleUnitChange(idx, 'unit_name', e.target.value)}
                          className={inputStyle}
                        />
                      </div>

                      <div className="w-1/4">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Isi (Pcs)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          disabled={unit.is_base_unit}
                          value={unit.conversion_factor}
                          onChange={e => handleUnitChange(idx, 'conversion_factor', Number(e.target.value))}
                          className={`${inputStyle} ${unit.is_base_unit ? 'opacity-40 cursor-not-allowed' : ''}`}
                        />
                      </div>

                      <div className="w-1/3">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Harga (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={unit.price}
                          onChange={e => handleUnitChange(idx, 'price', Number(e.target.value))}
                          className={inputStyle}
                        />
                      </div>

                      <div className="w-10 flex justify-center items-end h-full pt-4">
                        {!unit.is_base_unit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUnitInput(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                            title="Hapus Satuan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs sm:text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(6,182,212,0.25)] transition disabled:opacity-40"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Menyimpan...' : 'Simpan Produk'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quick Adjust Stock (Penyesuaian Stok Cepat) */}
      {stockModalProd && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-200 text-sm sm:text-base flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                Penyesuaian Stok
              </h3>
              <button
                onClick={() => setStockModalProd(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-1">Produk: <strong className="text-slate-200">{stockModalProd.name}</strong></p>
            <p className="text-xs text-slate-400 mb-4">Stok Saat Ini: <span className="font-bold font-mono text-cyan-400">{stockModalProd.stock_in_base_unit}</span></p>

            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition ${adjustType === 'add'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Stok Masuk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustType('reduce')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition ${adjustType === 'reduce'
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>Stok Keluar</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Jumlah (Satuan Dasar)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustAmount || ''}
                  onChange={e => setAdjustAmount(Number(e.target.value))}
                  placeholder="Masukkan Qty..."
                  className={`${inputStyle} font-mono font-bold text-cyan-400`}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || adjustAmount <= 0}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition disabled:opacity-40 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
              >
                {submitting ? 'Memproses...' : 'Simpan Penyesuaian'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kamera Barcode Scanner */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setIsScannerOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-200 text-base mb-1">Arahkan ke Barcode</h3>
            <p className="text-xs text-slate-400 mb-4">Posisikan kode batang di tengah kotak kamera</p>

            <div id="reader" className="overflow-hidden rounded-2xl border-2 border-cyan-500/80 bg-slate-950"></div>

            <p className="text-[11px] text-slate-500 mt-4">Pindaian akan memicu bunyi bip dan otomatis mengisi kolom barcode.</p>
          </div>
        </div>
      )}

    </div>
  )
}