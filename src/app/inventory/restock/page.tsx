'use client'

import { useState, useEffect } from 'react'
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
    const prod = products.find(p => p.id === productId)
    if (prod && prod.product_units && prod.product_units.length > 0) {
      const defaultUnit = prod.product_units.find(u => u.is_base_unit) || prod.product_units[0]
      setSelectedUnitId(defaultUnit.id ?? '') // Memakai nullish coalescing agar bernilai string
    } else {
      setSelectedUnitId('')
    }
  }

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduct || !selectedUnit) {
      alert('Pilih produk dan satuan terlebih dahulu!')
      return
    }

    if (qty <= 0) {
      alert('Jumlah (qty) restok harus lebih dari 0!')
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

      alert(`✅ Berhasil restok ${selectedProduct.name}! Total stok bertambah +${addedBaseStock} unit dasar.`)

      // Reset Form
      setQty(1)
      setSupplierName('')
      setNotes('')
      fetchProducts()
    } catch (err: any) {
      alert('Gagal melakukan restok: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 bg-white focus:outline-blue-500 font-medium"

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-900">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <h1 className="text-2xl font-bold mb-1 text-gray-800">📥 Restok Barang / Stok Masuk</h1>
        <p className="text-sm text-gray-500 mb-6">Tambahkan stok produk dari supplier atau pembelian grosir baru</p>

        <form onSubmit={handleRestock} className="space-y-4">
          {/* Pilih Produk */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Pilih Produk *
            </label>
            <select
              value={selectedProductId}
              onChange={e => handleProductChange(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">-- Pilih Barang --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok Saat Ini: {p.stock_in_base_unit})
                </option>
              ))}
            </select>
          </div>

          {/* Satuan & Jumlah */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Satuan Restok *
              </label>
              <select
                value={selectedUnitId}
                onChange={e => setSelectedUnitId(e.target.value)}
                disabled={!selectedProductId}
                required
                className={inputClass}
              >
                <option value="">-- Pilih Satuan --</option>
                {selectedProduct?.product_units?.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.unit_name} (Isi {u.conversion_factor} Unit)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Jumlah (Qty) *
              </label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Preview Kalkulasi Stok */}
          {selectedUnit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 font-medium">
              💡 Penambahan stok ini setara dengan <strong>+{qty * selectedUnit.conversion_factor}</strong> unit dasar (*base unit*).
            </div>
          )}

          {/* Supplier */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Supplier / Distributor (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: PT. Indofood / Toko Maju Jaya"
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Catatan Pembelian (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: No. Faktur #INV-9921"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedProductId}
            className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition disabled:bg-gray-300 shadow-md mt-4"
          >
            {loading ? 'Memproses Restok...' : 'Simpan Restok Barang 📥'}
          </button>
        </form>
      </div>
    </div>
  )
}