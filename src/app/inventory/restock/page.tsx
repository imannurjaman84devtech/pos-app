'use client'

import { useState, useEffect } from 'react'
import { 
  PackagePlus, Layers, Boxes, Building2, 
  FileText, CheckCircle2, AlertCircle, RefreshCw, Zap 
} from 'lucide-react'
import { createClient } from '@/lib/supabaseClient'
import { Product } from '@/types/pos'

export default function RestockPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [qty, setQty] = useState<number>(1)
  const [supplierName, setSupplierName] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_units(*)')
      .order('name', { ascending: true })

    if (data) setProducts(data as Product[])
  }

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const selectedUnit = selectedProduct?.product_units?.find(u => u.id === selectedUnitId)

  // FIX 1: Memastikan ID unit tidak pernah 'undefined'
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId)
    setStatusMsg(null)
    const prod = products.find(p => p.id === productId)
    if (prod && prod.product_units && prod.product_units.length > 0) {
      const defaultUnit = prod.product_units.find(u => u.is_base_unit) || prod.product_units[0]
      setSelectedUnitId(defaultUnit.id ?? '')
    } else {
      setSelectedUnitId('')
    }
  }

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)

    if (!selectedProduct || !selectedUnit) {
      setStatusMsg({ type: 'error', text: 'Pilih produk dan satuan terlebih dahulu!' })
      return
    }

    if (qty <= 0) {
      setStatusMsg({ type: 'error', text: 'Jumlah (qty) restok harus lebih dari 0!' })
      return
    }

    setLoading(true)

    try {
      const addedBaseStock = qty * selectedUnit.conversion_factor
      const newTotalStock = selectedProduct.stock_in_base_unit + addedBaseStock

      // FIX 2: Menghapus .catch() dan menggantinya dengan async/await yang benar untuk Supabase
      try {
        await supabase.from('stock_mutations').insert([
          {
            product_id: selectedProduct.id,
            product_unit_id: selectedUnit.id,
            type: 'IN',
            quantity: qty,
            converted_quantity: addedBaseStock,
            supplier: supplierName,
            notes: notes,
          },
        ])
      } catch {
        // Abaikan jika tabel stock_mutations belum dibuat
      }

      // Update total stok di tabel products
      const { error: updateErr } = await supabase
        .from('products')
        .update({ stock_in_base_unit: newTotalStock })
        .eq('id', selectedProduct.id)

      if (updateErr) throw new Error(updateErr.message)

      setStatusMsg({
        type: 'success',
        text: `Berhasil restok ${selectedProduct.name}! Total stok bertambah +${addedBaseStock} unit dasar.`
      })

      // Reset Form
      setQty(1)
      setSupplierName('')
      setNotes('')
      fetchProducts()
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Gagal melakukan restok: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-10 font-sans relative flex items-center justify-center">
      {/* Background Neon Glow Accent */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Main Card Container */}
        <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl shadow-cyan-950/20">
          
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-slate-800/80 pb-5 mb-6">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <PackagePlus className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Restok Barang / Stok Masuk
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Tambahkan stok produk dari supplier atau pembelian grosir baru
              </p>
            </div>
          </div>

          {/* Status Alert Banner */}
          {statusMsg && (
            <div className={`mb-6 p-4 rounded-xl border text-xs flex items-center gap-3 transition-all ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span className="font-semibold">{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleRestock} className="space-y-5">
            
            {/* 1. Pilih Produk */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                Pilih Produk <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={e => handleProductChange(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-cyan-500/80 text-slate-100 transition-all cursor-pointer font-medium"
              >
                <option value="" className="bg-slate-900 text-slate-500">-- Pilih Barang --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.name} (Stok Saat Ini: {p.stock_in_base_unit})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Satuan & Jumlah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Satuan Restok <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedUnitId}
                  onChange={e => setSelectedUnitId(e.target.value)}
                  disabled={!selectedProductId}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-cyan-500/80 text-slate-100 transition-all cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="" className="bg-slate-900 text-slate-500">-- Pilih Satuan --</option>
                  {selectedProduct?.product_units?.map(u => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                      {u.unit_name} (Isi {u.conversion_factor} Unit)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Jumlah (Qty) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={e => setQty(Number(e.target.value))}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono font-bold text-cyan-400 focus:outline-none focus:border-cyan-500/80 transition-all"
                />
              </div>
            </div>

            {/* Preview Kalkulasi Stok */}
            {selectedUnit && (
              <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3.5 text-xs text-cyan-300 font-medium flex items-center gap-2.5 backdrop-blur-md">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Penambahan stok ini setara dengan <strong className="text-emerald-400 font-mono font-bold">+{qty * selectedUnit.conversion_factor}</strong> unit dasar (*base unit*).
                </span>
              </div>
            )}

            {/* 3. Supplier */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Supplier / Distributor <span className="text-slate-500 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: PT. Indofood / Toko Maju Jaya"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-cyan-500/80 text-slate-200 placeholder-slate-600 transition-all"
              />
            </div>

            {/* 4. Catatan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Catatan Pembelian <span className="text-slate-500 font-normal">(Opsional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: No. Faktur #INV-9921"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-cyan-500/80 text-slate-200 placeholder-slate-600 resize-none transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedProductId}
              className="w-full py-3.5 px-4 mt-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <PackagePlus className="w-4 h-4" />
                  Simpan Restok Barang
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}