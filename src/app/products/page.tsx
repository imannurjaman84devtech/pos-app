'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Product } from '@/types/pos'

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

  // Form State untuk Produk Baru
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [initialStock, setInitialStock] = useState<number>(0)
  
  // State untuk Dynamic Product Units (Default 1 Base Unit + 1 Grosir Unit)
  const [units, setUnits] = useState<UnitInput[]>([
    { unit_name: 'Pcs', conversion_factor: 1, price: 5000, is_base_unit: true },
    { unit_name: 'Dus', conversion_factor: 24, price: 110000, is_base_unit: false }
  ])

  useEffect(() => {
    fetchProducts()
  }, [])

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

  // Handle Tambah/Hapus Form Satuan secara Dinamis
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

  // Handle Simpan Produk + Satuan ke Database Supabase
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('Nama produk wajib diisi!')
    if (units.length === 0) return alert('Produk harus memiliki minimal 1 satuan!')

    setSubmitting(true)

    try {
      // 1. Insert ke tabel products
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

      // 2. Insert ke tabel product_units berelasi ke produk baru
      const unitPayloads = units.map(u => ({
        product_id: newProd.id,
        unit_name: u.unit_name,
        conversion_factor: Number(u.conversion_factor),
        price: Number(u.price),
        is_base_unit: u.is_base_unit
      }))

      const { error: unitErr } = await supabase
        .from('product_units')
        .insert(unitPayloads)

      if (unitErr) throw unitErr

      alert('✅ Produk dan Satuan berhasil ditambahkan!')
      
      // Reset Form & Close Modal
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

  const inputStyle = "w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 bg-white focus:outline-blue-500 font-medium text-sm"

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📦 Katalog Produk Grosir</h1>
            <p className="text-sm text-gray-500">Kelola master data barang, barcode, dan konversi multi-unit</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition"
          >
            ➕ Tambah Produk Baru
          </button>
        </div>

        {/* Tabel Daftar Produk */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 font-semibold">Memuat data produk...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Belum ada produk. Klik tombol diatas untuk menambah produk.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Nama Produk / Barcode</th>
                  <th className="p-4">Total Stok (Base Unit)</th>
                  <th className="p-4">Harga & Satuan Penjualan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-400 font-mono">Barcode: {p.barcode || '-'}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-blue-600 text-base">{p.stock_in_base_unit}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({p.product_units?.find(u => u.is_base_unit)?.unit_name || 'Unit'})
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {p.product_units?.map(u => (
                          <div 
                            key={u.id} 
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                              u.is_base_unit 
                                ? 'bg-blue-50 border-blue-200 text-blue-800' 
                                : 'bg-green-50 border-green-200 text-green-800'
                            }`}
                          >
                            {u.unit_name} (x{u.conversion_factor}): <strong>Rp {u.price.toLocaleString('id-ID')}</strong>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Form Tambah Produk */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Tambah Produk & Multi-Unit Baru</h2>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Produk *</label>
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">Barcode / SKU (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 899886620011"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Stok Awal (Dalam Satuan Dasar/Eceran)</label>
                <input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={e => setInitialStock(Number(e.target.value))}
                  className={inputStyle}
                />
              </div>

              {/* Dynamic Unit Form */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-800">Pengaturan Satuan & Harga Jual *</label>
                  <button
                    type="button"
                    onClick={handleAddUnitInput}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-blue-600 font-bold px-2.5 py-1 rounded-lg border transition"
                  >
                    + Tambah Satuan (Grosir/Pak/Dus)
                  </button>
                </div>

                <div className="space-y-3">
                  {units.map((unit, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <div className="w-1/4">
                        <label className="block text-[10px] text-gray-500 font-bold">Nama Satuan</label>
                        <input
                          type="text"
                          required
                          placeholder="Pcs/Dus/Pak"
                          value={unit.unit_name}
                          onChange={e => handleUnitChange(idx, 'unit_name', e.target.value)}
                          className={inputStyle}
                        />
                      </div>

                      <div className="w-1/4">
                        <label className="block text-[10px] text-gray-500 font-bold">Isi (Konversi Base)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          disabled={unit.is_base_unit}
                          value={unit.conversion_factor}
                          onChange={e => handleUnitChange(idx, 'conversion_factor', Number(e.target.value))}
                          className={`${inputStyle} ${unit.is_base_unit ? 'bg-gray-100 text-gray-500' : ''}`}
                        />
                      </div>

                      <div className="w-1/3">
                        <label className="block text-[10px] text-gray-500 font-bold">Harga Jual (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={unit.price}
                          onChange={e => handleUnitChange(idx, 'price', Number(e.target.value))}
                          className={inputStyle}
                        />
                      </div>

                      <div className="w-1/6 flex justify-end items-end h-full pt-4">
                        {!unit.is_base_unit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUnitInput(idx)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg font-bold text-sm"
                            title="Hapus Satuan"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border font-bold text-gray-600 hover:bg-gray-100 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition disabled:bg-gray-300"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}