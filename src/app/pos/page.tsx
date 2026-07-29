'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Product, ProductUnit } from '@/types/pos'

interface CartItem {
  product: Product
  selectedUnit: ProductUnit
  qty: number
  subtotal: number
}

interface CompletedSale {
  id: string
  invoiceNumber: string
  total: number
  paid: number
  change: number
  items: CartItem[]
  date: string
}

interface StoreSettings {
  store_name?: string
  address?: string
  phone?: string
}

export default function POSPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null)

  // State Pembayaran & Modal Sukses
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null)

  // Load Data Produk & Profil Toko
  useEffect(() => {
    fetchProducts()
    fetchStoreSettings()
  }, [])

  // Auto-focus input barcode dengan tombol ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('barcode-input')
        searchInput?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_units(*)')
      .order('name', { ascending: true })
    if (data) setProducts(data as Product[])
  }

  const fetchStoreSettings = async () => {
    const { data } = await supabase.from('store_settings').select('*').single()
    if (data) setStoreSettings(data)
  }

  // Tambahkan Produk ke Keranjang
  const addToCart = (product: Product) => {
    if (!product.product_units || product.product_units.length === 0) {
      alert('Produk ini belum memiliki satuan harga!')
      return
    }

    const defaultUnit = product.product_units.find(u => u.is_base_unit) || product.product_units[0]

    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && item.selectedUnit.id === defaultUnit.id
    )

    if (existingIndex > -1) {
      const updatedCart = [...cart]
      updatedCart[existingIndex].qty += 1
      updatedCart[existingIndex].subtotal = updatedCart[existingIndex].qty * updatedCart[existingIndex].selectedUnit.price
      setCart(updatedCart)
    } else {
      setCart([
        ...cart,
        {
          product,
          selectedUnit: defaultUnit,
          qty: 1,
          subtotal: defaultUnit.price
        }
      ])
    }
  }

  // Auto-add barang saat scanner/kasir menekan Enter pada input search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim() !== '') {
      const query = search.trim().toLowerCase()
      const matchedProduct = products.find(
        p => (p.barcode && p.barcode.toLowerCase() === query) || p.name.toLowerCase() === query
      )

      if (matchedProduct) {
        addToCart(matchedProduct)
        setSearch('')
      }
    }
  }

  // Ubah Satuan Jual (Pcs / Dus / Dll)
  const handleUnitChange = (index: number, unitId: string) => {
    const updatedCart = [...cart]
    const newUnit = updatedCart[index].product.product_units?.find(u => u.id === unitId)
    if (newUnit) {
      updatedCart[index].selectedUnit = newUnit
      updatedCart[index].subtotal = updatedCart[index].qty * newUnit.price
      setCart(updatedCart)
    }
  }

  // Ubah Jumlah Pembelian (Qty)
  const handleQtyChange = (index: number, newQty: number) => {
    if (newQty <= 0) return
    const updatedCart = [...cart]
    updatedCart[index].qty = newQty
    updatedCart[index].subtotal = newQty * updatedCart[index].selectedUnit.price
    setCart(updatedCart)
  }

  // Hapus Item dari Keranjang
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  // Hitung Total Bayar & Kembalian
  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const changeAmount = paymentAmount - grandTotal

  // Auto-fill nominal pas saat klik grand total
  const handlePayExact = () => {
    setPaymentAmount(grandTotal)
  }

  // Proses Checkout Transaksi
  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Keranjang belanja masih kosong!')
    if (paymentAmount < grandTotal) {
      return alert('Uang pembayaran kurang!')
    }

    setLoading(true)

    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const randomNum = Math.floor(1000 + Math.random() * 9000)
      const invoiceNumber = `INV-${dateStr}-${randomNum}`
      const transactionDate = new Date().toLocaleString('id-ID')

      // 1. Simpan ke Tabel Sales
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert([
          { 
            invoice_number: invoiceNumber, 
            total_amount: grandTotal,
            paid_amount: paymentAmount,
            change_amount: changeAmount
          }
        ])
        .select()
        .single()

      if (saleErr || !sale) throw new Error(saleErr?.message || 'Gagal membuat transaksi')

      // 2. Simpan Detail Item Ke Tabel Sale_Items
      const saleItemsPayload = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        product_unit_id: item.selectedUnit.id,
        quantity: item.qty,
        price_per_unit: item.selectedUnit.price,
        subtotal: item.subtotal
      }))

      const { error: itemsErr } = await supabase.from('sale_items').insert(saleItemsPayload)
      if (itemsErr) throw new Error(itemsErr.message)

      // 3. Simpan data untuk Tampilan Modal & Struk Thermal
      setCompletedSale({
        id: sale.id,
        invoiceNumber,
        total: grandTotal,
        paid: paymentAmount,
        change: changeAmount,
        items: [...cart],
        date: transactionDate
      })

      // 4. Reset Form Pembayaran & Keranjang
      setCart([])
      setPaymentAmount(0)
      fetchProducts() // Refresh data stok terbaru dari DB

    } catch (err: any) {
      alert('Transaksi Gagal: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(
    p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search))
  )

  const inputClass = "w-full border p-2 rounded-lg text-gray-900 bg-white placeholder:text-gray-400 focus:outline-blue-500"

  return (
    <>
      {/* STYLE KHUSUS PRINT THERMAL */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt, #thermal-receipt * {
            visibility: visible;
          }
          #thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm;
            margin: 0;
            padding: 4px;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>

      <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden print:hidden">
        {/* SEKSI KIRI: KATALOG PRODUK & SEARCH */}
        <div className="w-7/12 p-6 flex flex-col h-full border-r border-gray-200">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">🛒 Kasir / POS Grosir</h1>

          {/* Barcode / Search Input */}
          <div className="mb-4">
            <input
              id="barcode-input"
              type="text"
              placeholder="🔍 Cari nama / Scan Barcode... (Tekan ESC untuk focus)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className={`${inputClass} text-lg shadow-sm`}
              autoFocus
            />
          </div>

          {/* Grid Produk */}
          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4 pr-2">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-gray-800 text-md leading-tight mb-1">{p.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">Barcode: {p.barcode || '-'}</p>
                </div>

                <div>
                  <div className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded inline-block mb-2">
                    Stok: {p.stock_in_base_unit}
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    Rp {p.product_units?.[0]?.price.toLocaleString('id-ID') || 0}
                    <span className="text-xs font-normal text-gray-500"> /{p.product_units?.[0]?.unit_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SEKSI KANAN: KERANJANG & CHECKOUT */}
        <div className="w-5/12 bg-white p-6 flex flex-col justify-between h-full shadow-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Detail Transaksi</h2>

            {/* List Items in Cart */}
            <div className="max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">🛍️</p>
                  <p>Keranjang masih kosong</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center mb-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex-1 pr-2">
                      <h4 className="font-bold text-sm text-gray-800">{item.product.name}</h4>
                      
                      {/* Select Unit Jual */}
                      <div className="flex gap-2 items-center mt-1">
                        <select
                          value={item.selectedUnit.id}
                          onChange={e => handleUnitChange(idx, e.target.value)}
                          className="text-xs border rounded p-1 text-gray-800 bg-white font-medium"
                        >
                          {item.product.product_units?.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.unit_name} (Rp {u.price.toLocaleString('id-ID')})
                            </option>
                          ))}
                        </select>

                        <span className="text-xs text-gray-500">
                          x Rp {item.selectedUnit.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => handleQtyChange(idx, item.qty - 1)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={e => handleQtyChange(idx, Number(e.target.value))}
                          className="w-10 text-center text-xs text-gray-900 border-none font-bold"
                        />
                        <button
                          onClick={() => handleQtyChange(idx, item.qty + 1)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right w-20">
                        <div className="text-xs font-bold text-gray-900">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs pl-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ringkasan & Form Pembayaran */}
          <div className="border-t pt-4 mt-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-600">Total Pembayaran:</span>
              <span 
                onClick={handlePayExact}
                title="Klik untuk set uang pas"
                className="text-2xl font-extrabold text-blue-600 cursor-pointer hover:underline"
              >
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Input Tunai / Uang Dibayar */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Uang Dibayar (Tunai):
              </label>
              <input
                type="number"
                placeholder="Masukkan nominal uang..."
                value={paymentAmount || ''}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                disabled={cart.length === 0}
                className={`${inputClass} text-md font-bold text-blue-600`}
              />
            </div>

            {/* Info Kembalian */}
            {paymentAmount > 0 && (
              <div className="flex justify-between items-center mb-3 text-sm font-semibold">
                <span className="text-gray-600">Kembalian:</span>
                <span className={changeAmount >= 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                  Rp {changeAmount.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0 || paymentAmount < grandTotal}
              className="w-full bg-blue-600 text-white text-lg font-bold py-3.5 rounded-xl hover:bg-blue-700 transition disabled:bg-gray-300 shadow-lg"
            >
              {loading ? 'Memproses Transaksi...' : 'Bayar Sekarang 💳'}
            </button>
          </div>
        </div>

        {/* --- MODAL POP-UP TRANSAKSI SUKSES --- */}
        {completedSale && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in duration-200">
              
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
                ✓
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Transaksi Berhasil!
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                No. Invoice: <span className="font-mono font-bold text-gray-700">{completedSale.invoiceNumber}</span>
              </p>

              {/* Rincian Kembalian */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2 border border-gray-100">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total Belanja</span>
                  <span className="font-semibold text-gray-800">
                    Rp {completedSale.total.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uang Tunai</span>
                  <span className="font-semibold text-gray-800">
                    Rp {completedSale.paid.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Kembalian</span>
                  <span className="text-xl font-extrabold text-green-600">
                    Rp {completedSale.change.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Tombol Cetak & Transaksi Baru */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.print()}
                  className="w-full py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
                >
                  🖨️ Cetak Struk
                </button>
                <button
                  onClick={() => setCompletedSale(null)}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                >
                  Transaksi Baru ➔
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* --- TEMPLATE LAYOUT STRUK THERMAL (HANYA MUNCUL SAAT PRINT) --- */}
      {completedSale && (
        <div id="thermal-receipt" className="hidden print:block font-mono text-black text-[10px] leading-tight">
          {/* Header Toko */}
          <div className="text-center mb-2 border-b border-dashed border-black pb-2">
            <h2 className="text-xs font-bold uppercase">{storeSettings?.store_name || 'TOKO GROSIR'}</h2>
            <p className="text-[9px]">{storeSettings?.address || 'Jl. Raya Utama No. 123'}</p>
            <p className="text-[9px]">Telp: {storeSettings?.phone || '-'}</p>
          </div>

          {/* Info Transaksi */}
          <div className="mb-2 border-b border-dashed border-black pb-1">
            <div>No: {completedSale.invoiceNumber}</div>
            <div>Tgl: {completedSale.date}</div>
          </div>

          {/* Daftar Barang */}
          <div className="border-b border-dashed border-black pb-2 mb-2">
            {completedSale.items.map((item, idx) => (
              <div key={idx} className="mb-1">
                <div className="font-bold">{item.product.name}</div>
                <div className="flex justify-between">
                  <span>{item.qty} {item.selectedUnit.unit_name} x {item.selectedUnit.price.toLocaleString('id-ID')}</span>
                  <span>{item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total & Kembalian */}
          <div className="space-y-0.5 border-b border-dashed border-black pb-2 mb-2">
            <div className="flex justify-between font-bold">
              <span>TOTAL:</span>
              <span>Rp {completedSale.total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>BAYAR:</span>
              <span>Rp {completedSale.paid.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>KEMBALI:</span>
              <span>Rp {completedSale.change.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Footer Struk */}
          <div className="text-center mt-2 text-[9px]">
            <p className="font-bold">*** TERIMA KASIH ***</p>
            <p>Barang yang sudah dibeli</p>
            <p>tidak dapat ditukar/dikembalikan</p>
          </div>
        </div>
      )}
    </>
  )
}