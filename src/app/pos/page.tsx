'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Product, ProductUnit } from '@/types/pos'
import { 
  Search, 
  ShoppingCart, 
  User, 
  Plus, 
  Calendar, 
  Printer, 
  CheckCircle2, 
  CreditCard, 
  Wallet, 
  Clock, 
  X,
  Trash2,
  Building2,
  FileText,
  QrCode
} from 'lucide-react'

interface CartItem {
  product: Product
  selectedUnit: ProductUnit
  qty: number
  subtotal: number
}

interface Customer {
  id: string
  name: string
  phone?: string
  total_debt?: number
}

// Interface untuk Tabel Baru store_accounts
interface StoreAccount {
  id: string
  account_name: string
  account_number: string
  holder_name: string
  qris_image_url?: string | null
}

interface CompletedSale {
  id: string
  invoiceNumber: string
  total: number
  paid: number
  change: number
  items: CartItem[]
  date: string
  paymentMethod: string
  selectedBank?: string
  transferRef?: string
  customerName?: string
  dueDate?: string
}

interface StoreSettings {
  store_name?: string
  address?: string
  phone?: string
}

export default function POSPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [storeAccounts, setStoreAccounts] = useState<StoreAccount[]>([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null)

  // State Pembayaran
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'kasbon'>('cash')
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  
  // State Dinamis Rekening / QRIS
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [transferRef, setTransferRef] = useState<string>('')

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  
  // State Modal Tambah Pelanggan Cepat
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')

  // Modal Sukses Transaksi
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null)

  // Load Initial Data
  useEffect(() => {
    fetchProducts()
    fetchCustomers()
    fetchStoreSettings()
    fetchStoreAccounts()
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

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true })
    if (data) setCustomers(data as Customer[])
  }

  const fetchStoreSettings = async () => {
    const { data } = await supabase.from('store_settings').select('*').single()
    if (data) setStoreSettings(data)
  }

  // Fetch Data Rekening & QRIS Dinamis dari DB
  const fetchStoreAccounts = async () => {
    const { data } = await supabase
      .from('store_accounts')
      .select('*')
      .eq('is_active', true)
    
    if (data && data.length > 0) {
      setStoreAccounts(data)
      setSelectedAccountId(data[0].id) // Default pilih opsi pertama
    }
  }

  // Quick Add Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomerName.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('customers')
        .insert([{ 
          name: newCustomerName, 
          phone: newCustomerPhone,
          user_id: user?.id 
        }])
        .select()
        .single()

      if (error) throw error

      setCustomers([...customers, data])
      setSelectedCustomerId(data.id)
      setNewCustomerName('')
      setNewCustomerPhone('')
      setShowAddCustomerModal(false)
    } catch (err: any) {
      alert('Gagal menambah pelanggan: ' + err.message)
    }
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

  const handleUnitChange = (index: number, unitId: string) => {
    const updatedCart = [...cart]
    const newUnit = updatedCart[index].product.product_units?.find(u => u.id === unitId)
    if (newUnit) {
      updatedCart[index].selectedUnit = newUnit
      updatedCart[index].subtotal = updatedCart[index].qty * newUnit.price
      setCart(updatedCart)
    }
  }

  const handleQtyChange = (index: number, newQty: number) => {
    if (newQty <= 0) return
    const updatedCart = [...cart]
    updatedCart[index].qty = newQty
    updatedCart[index].subtotal = newQty * updatedCart[index].selectedUnit.price
    setCart(updatedCart)
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const changeAmount = paymentMethod === 'kasbon' ? 0 : paymentAmount - grandTotal

  const handlePayExact = () => {
    setPaymentAmount(grandTotal)
  }

  // Cari objek rekening yang sedang dipilih kasir
  const currentSelectedAccount = storeAccounts.find(a => a.id === selectedAccountId)

  // Process Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Keranjang belanja masih kosong!')
    
    if (paymentMethod === 'kasbon') {
      if (!selectedCustomerId) return alert('Wajib memilih Nama Pelanggan untuk transaksi Kasbon!')
      if (!dueDate) return alert('Wajib menentukan Tanggal Jatuh Tempo Kasbon!')
    } else if (paymentAmount < grandTotal) {
      return alert('Nominal pembayaran kurang!')
    }

    setLoading(true)

    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const randomNum = Math.floor(1000 + Math.random() * 9000)
      const invoiceNumber = `INV-${dateStr}-${randomNum}`
      const transactionDate = new Date().toLocaleString('id-ID')
      const activeCustomer = customers.find(c => c.id === selectedCustomerId)

      const bankLabel = currentSelectedAccount 
        ? `${currentSelectedAccount.account_name} (${currentSelectedAccount.account_number})`
        : '-'

      // Gabungkan catatan jika transfer
      const finalNotes = paymentMethod === 'transfer' 
        ? `[Payment via ${bankLabel}${transferRef ? ` - Ref/Pengirim: ${transferRef}` : ''}] ${notes}`.trim()
        : notes || null

      // 1. Simpan ke Tabel Sales
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert([
          { 
            invoice_number: invoiceNumber, 
            total_amount: grandTotal,
            paid_amount: paymentMethod === 'kasbon' ? 0 : paymentAmount,
            change_amount: changeAmount,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'kasbon' ? 'unpaid' : 'paid',
            customer_id: selectedCustomerId || null,
            due_date: paymentMethod === 'kasbon' ? dueDate : null,
            notes: finalNotes
          }
        ])
        .select()
        .single()

      if (saleErr || !sale) throw new Error(saleErr?.message || 'Gagal membuat transaksi')

      // 2. Simpan Detail Item
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

      // 3. Update Utang Pelanggan di DB jika Kasbon
      if (paymentMethod === 'kasbon' && activeCustomer) {
        const updatedTotalDebt = (activeCustomer.total_debt || 0) + grandTotal
        await supabase
          .from('customers')
          .update({ total_debt: updatedTotalDebt })
          .eq('id', activeCustomer.id)
      }

      // 4. Modal Sukses & Reset Form
      setCompletedSale({
        id: sale.id,
        invoiceNumber,
        total: grandTotal,
        paid: paymentMethod === 'kasbon' ? 0 : paymentAmount,
        change: changeAmount,
        items: [...cart],
        date: transactionDate,
        paymentMethod,
        selectedBank: paymentMethod === 'transfer' ? currentSelectedAccount?.account_name : undefined,
        transferRef: paymentMethod === 'transfer' ? transferRef : undefined,
        customerName: activeCustomer?.name,
        dueDate
      })

      setCart([])
      setPaymentAmount(0)
      setTransferRef('')
      setSelectedCustomerId('')
      setDueDate('')
      setNotes('')
      setPaymentMethod('cash')
      fetchProducts()
      fetchCustomers()

    } catch (err: any) {
      alert('Transaksi Gagal: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(
    p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search))
  )

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #thermal-receipt, #thermal-receipt * { visibility: visible; }
          #thermal-receipt {
            position: absolute; left: 0; top: 0; width: 58mm; margin: 0; padding: 4px;
          }
          @page { size: auto; margin: 0mm; }
        }
      `}</style>

      <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden print:hidden">
        
        {/* ================= SEKSI KIRI: KATALOG PRODUK ================= */}
        <div className="w-7/12 p-6 flex flex-col h-full border-r border-slate-800/80 bg-slate-900/50">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-indigo-500" /> POS Kasir Grosir
              </h1>
              <p className="text-xs text-slate-400">Tekan ESC kapan saja untuk fokus pencarian</p>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 font-semibold px-3 py-1 rounded-full border border-indigo-500/20">
              {filteredProducts.length} Produk Tersedia
            </span>
          </div>

          {/* Barcode Search Bar */}
          <div className="relative mb-5">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
            <input
              id="barcode-input"
              type="text"
              placeholder="Cari Produk atau Scan Barcode... [ESC]"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
              autoFocus
            />
          </div>

          {/* Grid Katalog Produk */}
          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3.5 pr-1">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl p-3.5 transition cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-indigo-500/10"
              >
                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-indigo-400 transition mb-1">
                    {p.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">BC: {p.barcode || '-'}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/50 flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    Stok: {p.stock_in_base_unit}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-indigo-400">
                      Rp {p.product_units?.[0]?.price.toLocaleString('id-ID') || 0}
                    </span>
                    <span className="text-[10px] text-slate-400 block">/{p.product_units?.[0]?.unit_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= SEKSI KANAN: KERANJANG & PAYMENTS ================= */}
        <div className="w-5/12 bg-slate-900 p-5 flex flex-col justify-between h-full border-l border-slate-800">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Rincian Keranjang
              </h2>
              {cart.length > 0 && (
                <button 
                  onClick={() => setCart([])}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Bersihkan
                </button>
              )}
            </div>

            {/* Item List Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <ShoppingCart className="w-12 h-12 stroke-[1.5] mb-2 opacity-40" />
                  <p className="text-xs font-medium">Keranjang Belanja Masih Kosong</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex justify-between items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-white truncate">{item.product.name}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <select
                          value={item.selectedUnit.id}
                          onChange={e => handleUnitChange(idx, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded text-[11px] font-bold text-indigo-300 px-1.5 py-0.5 focus:outline-none"
                        >
                          {item.product.product_units?.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.unit_name} (Rp {u.price.toLocaleString('id-ID')})
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-400">
                          x Rp {item.selectedUnit.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleQtyChange(idx, item.qty - 1)}
                          className="px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={e => handleQtyChange(idx, Number(e.target.value))}
                          className="w-9 text-center text-xs font-bold text-white bg-transparent border-none focus:outline-none"
                        />
                        <button
                          onClick={() => handleQtyChange(idx, item.qty + 1)}
                          className="px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right w-16">
                        <span className="text-xs font-bold text-white block">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ================= PANEL METODE BAYAR & FORM CHECKOUT ================= */}
          <div className="border-t border-slate-800 pt-3.5 mt-2 space-y-3">
            {/* Grand Total Bar */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400">Total Transaksi</span>
              <span 
                onClick={handlePayExact}
                title="Klik untuk atur Uang Pas"
                className="text-xl font-black text-indigo-400 cursor-pointer hover:underline"
              >
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Tabs Pilihan Metode Pembayaran */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'cash'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" /> Tunai
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'transfer'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Transfer / QRIS
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('kasbon')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'kasbon'
                    ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/30'
                    : 'bg-slate-800 border-slate-700 text-amber-400/80 hover:text-amber-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Kasbon
              </button>
            </div>

            {/* Dynamic Form berdasarkan Metode Bayar */}
            {paymentMethod === 'kasbon' ? (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <User className="w-3 h-3" /> Pelanggan Utang
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="text-[10px] text-indigo-400 hover:underline font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Pelanggan Baru
                  </button>
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Nama Pelanggan --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.total_debt ? `(Utang: Rp ${c.total_debt.toLocaleString('id-ID')})` : ''}
                    </option>
                  ))}
                </select>

                <div>
                  <label className="text-[11px] font-bold text-amber-400 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Tanggal Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                
                {/* FORM TRANSFER / QRIS DINAMIS DARI DATABASE */}
                {paymentMethod === 'transfer' && (
                  <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl space-y-2 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-indigo-300 mb-1 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Rekening / QRIS Tujuan
                      </label>
                      <select
                        value={selectedAccountId}
                        onChange={e => setSelectedAccountId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-semibold text-white focus:outline-none focus:border-indigo-500"
                      >
                        {storeAccounts.length === 0 ? (
                          <option value="">Tidak ada akun terdaftar</option>
                        ) : (
                          storeAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.account_name} - {acc.account_number} ({acc.holder_name})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Tampilkan QRIS jika tersedia di Database */}
                    {currentSelectedAccount?.qris_image_url && (
                      <div className="bg-white p-2.5 rounded-xl flex flex-col items-center justify-center my-1 text-center shadow">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 mb-1">
                          <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Scan QRIS di Bawah Ini
                        </div>
                        <img 
                          src={currentSelectedAccount.qris_image_url} 
                          alt="QRIS Toko" 
                          className="w-32 h-32 object-contain border border-slate-200 rounded-lg"
                        />
                        <span className="text-[10px] font-semibold text-slate-500 mt-1">
                          {currentSelectedAccount.holder_name}
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-bold text-indigo-300 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> No. Ref / Pengirim <span className="text-slate-500 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Ref#8812 / a.n Budi"
                        value={transferRef}
                        onChange={e => setTransferRef(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Input Nominal Pembayaran */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300">
                      {paymentMethod === 'cash' ? 'Uang Dibayar (Tunai)' : 'Nominal Transfer'}
                    </label>
                    <button 
                      type="button"
                      onClick={handlePayExact}
                      className="text-[10px] text-indigo-400 hover:underline font-bold"
                    >
                      [Uang Pas]
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    value={paymentAmount || ''}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    disabled={cart.length === 0}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm font-extrabold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {paymentAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold pt-0.5">
                    <span className="text-slate-400">
                      {paymentMethod === 'cash' ? 'Kembalian:' : 'Status Validasi:'}
                    </span>
                    <span className={changeAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {paymentMethod === 'cash' 
                        ? `Rp ${changeAmount.toLocaleString('id-ID')}`
                        : changeAmount >= 0 ? '✓ Nominal Pas / Sesuai' : '✕ Nominal Kurang'
                      }
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tombol Eksekusi Checkout */}
            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition shadow-lg flex items-center justify-center gap-2 ${
                paymentMethod === 'kasbon'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              } disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none`}
            >
              {loading ? 'Memproses...' : paymentMethod === 'kasbon' ? 'Simpan Kasbon (Tempo) 🕒' : 'Selesaikan Pembayaran 💳'}
            </button>
          </div>
        </div>

        {/* ================= MODAL TAMBAH PELANGGAN BARU ================= */}
        {showAddCustomerModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white text-sm">Tambah Pelanggan Baru</h3>
                <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pak Haji Ahmad"
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">No. WhatsApp / Telepon</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Simpan Pelanggan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL TRANSAKSI SUKSES ================= */}
        {completedSale && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-800 text-center animate-in fade-in zoom-in duration-200">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-bold text-white mb-0.5">
                {completedSale.paymentMethod === 'kasbon' ? 'Kasbon Terekam!' : 'Transaksi Berhasil!'}
              </h2>
              <p className="text-[11px] text-slate-400 mb-4 font-mono">
                {completedSale.invoiceNumber}
              </p>

              <div className="bg-slate-800/80 rounded-xl p-3.5 mb-5 text-left space-y-2 border border-slate-700/60 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Metode Bayar</span>
                  <span className="font-bold text-white uppercase">{completedSale.paymentMethod}</span>
                </div>

                {completedSale.selectedBank && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tujuan</span>
                    <span className="font-bold text-indigo-400">{completedSale.selectedBank}</span>
                  </div>
                )}

                {completedSale.transferRef && (
                  <div className="flex justify-between text-slate-400">
                    <span>No. Ref / Pengirim</span>
                    <span className="font-bold text-slate-200">{completedSale.transferRef}</span>
                  </div>
                )}

                {completedSale.customerName && (
                  <div className="flex justify-between text-slate-400">
                    <span>Pelanggan</span>
                    <span className="font-bold text-amber-400">{completedSale.customerName}</span>
                  </div>
                )}

                {completedSale.dueDate && (
                  <div className="flex justify-between text-slate-400">
                    <span>Jatuh Tempo</span>
                    <span className="font-bold text-rose-400">{completedSale.dueDate}</span>
                  </div>
                )}

                <div className="border-t border-slate-700/80 pt-2 flex justify-between items-center">
                  <span className="font-bold text-slate-300">Total Belanja</span>
                  <span className="text-base font-black text-indigo-400">
                    Rp {completedSale.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => window.print()}
                  className="py-2.5 px-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 text-xs flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Struk
                </button>
                <button
                  onClick={() => setCompletedSale(null)}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Transaksi Baru
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= STRUK THERMAL PRINT ================= */}
      {completedSale && (
        <div id="thermal-receipt" className="hidden print:block font-mono text-black text-[10px] leading-tight">
          <div className="text-center mb-2 border-b border-dashed border-black pb-2">
            <h2 className="text-xs font-bold uppercase">{storeSettings?.store_name || 'TOKO GROSIR'}</h2>
            <p className="text-[9px]">{storeSettings?.address || 'Jl. Raya Utama No. 123'}</p>
            <p className="text-[9px]">Telp: {storeSettings?.phone || '-'}</p>
          </div>

          <div className="mb-2 border-b border-dashed border-black pb-1">
            <div>No: {completedSale.invoiceNumber}</div>
            <div>Tgl: {completedSale.date}</div>
            <div>Metode: {completedSale.paymentMethod.toUpperCase()}</div>
            {completedSale.selectedBank && <div>Bank: {completedSale.selectedBank}</div>}
            {completedSale.transferRef && <div>Ref: {completedSale.transferRef}</div>}
            {completedSale.customerName && <div>Pelanggan: {completedSale.customerName}</div>}
            {completedSale.dueDate && <div>Jatuh Tempo: {completedSale.dueDate}</div>}
          </div>

          <div className="border-b border-dashed border-black pb-2 mb-2">
            {completedSale.items.map((item, idx) => (
              <div key={idx} className="mb-1">
                <div className="font-bold">{item.product.name}</div>
                <div className="flex justify-between">
                  <span>{item.qty} {item.selectedUnit.unit_name} x {item.selectedUnit.price.toLocaleString('id-ID')}</span>
                  <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

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

          <div className="text-center pt-1 text-[9px]">
            <p>*** Terima Kasih ***</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
          </div>
        </div>
      )}
    </>
  )
}