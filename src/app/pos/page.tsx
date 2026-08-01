"use client";


import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, Trash2, X, Plus, Wallet, 
  CreditCard, Clock, User, Calendar, Building2, 
  QrCode, FileText, CheckCircle2, Printer 
} from 'lucide-react';
import { createClient } from '@/lib/supabaseClient'; // Sesuaikan path supabase client Anda
const supabase = createClient();

// ================= TYPES =================
interface ProductUnit {
  id: string;
  unit_name: string;
  conversion_factor: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  stock_in_base_unit: number;
  product_units: ProductUnit[];
}

interface CartItem {
  product: Product;
  selectedUnit: ProductUnit;
  qty: number;
  subtotal: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  total_debt?: number;
}

interface StoreAccount {
  id: string;
  account_name: string;
  account_number: string;
  holder_name: string;
  qris_image_url?: string;
}

interface SaleSuccess {
  invoiceNumber: string;
  total: number;
  paid: number;
  change: number;
  paymentMethod: string;
  customerName?: string;
  dueDate?: string;
  items: CartItem[];
  date: string;
}

export default function PosComponent() {
  // ================= STATE =================
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeAccounts, setStoreAccounts] = useState<StoreAccount[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'kasbon'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [transferRef, setTransferRef] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [completedSale, setCompletedSale] = useState<SaleSuccess | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // ================= FETCH DATA =================
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch Products
      const { data: prodData } = await supabase
        .from('products')
        .select(`*, product_units(*)`)
        .order('name');
      if (prodData) {
        setProducts(prodData);
        setFilteredProducts(prodData);
      }

      // Fetch Customers
      const { data: custData } = await supabase.from('customers').select('*').order('name');
      if (custData) setCustomers(custData);

      // Fetch Store Accounts
      const { data: accData } = await supabase.from('store_accounts').select('*');
      if (accData) {
        setStoreAccounts(accData);
        if (accData.length > 0) setSelectedAccountId(accData[0].id);
      }

      // Fetch Store Settings
      const { data: settData } = await supabase.from('store_settings').select('*').single();
      if (settData) setStoreSettings(settData);
    } catch (err) {
      console.error('Error fetching POS data:', err);
    }
  };

  // Filter Produk Berdasarkan Pencarian
  useEffect(() => {
    if (!search.trim()) {
      setFilteredProducts(products);
      return;
    }
    const q = search.toLowerCase();
    const filtered = products.filter(
      p => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.toLowerCase().includes(q))
    );
    setFilteredProducts(filtered);
  }, [search, products]);

  // Focus Kembali ke Input Barcode
  const focusBarcode = () => {
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  // ================= CART HANDLERS =================
  const addToCart = (product: Product) => {
    if (!product.product_units || product.product_units.length === 0) {
      alert('Produk ini tidak memiliki satuan harga!');
      return;
    }

    const defaultUnit = product.product_units[0];
    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && item.selectedUnit.id === defaultUnit.id
    );

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].qty += 1;
      updatedCart[existingIndex].subtotal = updatedCart[existingIndex].qty * updatedCart[existingIndex].selectedUnit.price;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          product,
          selectedUnit: defaultUnit,
          qty: 1,
          subtotal: defaultUnit.price,
        },
      ]);
    }
    focusBarcode();
  };

  const removeFromCart = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
  };

  const handleQtyChange = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const updated = [...cart];
    updated[index].qty = newQty;
    updated[index].subtotal = newQty * updated[index].selectedUnit.price;
    setCart(updated);
  };

  const handleUnitChange = (index: number, unitId: string) => {
    const updated = [...cart];
    const targetProduct = updated[index].product;
    const newUnit = targetProduct.product_units.find(u => u.id === unitId);

    if (newUnit) {
      updated[index].selectedUnit = newUnit;
      updated[index].subtotal = updated[index].qty * newUnit.price;
      setCart(updated);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      const exactBarcodeMatch = products.find(
        p => p.barcode && p.barcode.toLowerCase() === search.trim().toLowerCase()
      );
      if (exactBarcodeMatch) {
        addToCart(exactBarcodeMatch);
        setSearch('');
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearch('');
      }
    }
  };

  // ================= CALCULATIONS =================
  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const changeAmount = paymentAmount - grandTotal;

  const handlePayExact = () => {
    setPaymentAmount(grandTotal);
  };

  const currentSelectedAccount = storeAccounts.find(a => a.id === selectedAccountId);

  // ================= CHECKOUT & CUSTOMER HANDLERS =================
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ name: newCustomerName, phone: newCustomerPhone }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCustomers([...customers, data]);
        setSelectedCustomerId(data.id);
        setShowAddCustomerModal(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
      }
    } catch (err: any) {
      alert('Gagal menambah pelanggan: ' + err.message);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'kasbon') {
      if (!selectedCustomerId) {
        alert('Silakan pilih pelanggan untuk transaksi Kasbon!');
        return;
      }
      if (!dueDate) {
        alert('Silakan tentukan tanggal jatuh tempo!');
        return;
      }
    } else {
      if (paymentAmount < grandTotal) {
        alert('Jumlah pembayaran/transfer masih kurang dari total transaksi!');
        return;
      }
    }

    setLoading(true);
    try {
      const invoiceNum = 'INV-' + Date.now();
      const customerObj = customers.find(c => c.id === selectedCustomerId);

      // Simpan Transaksi Penjualan ke Supabase
      const { data: saleData, error: saleErr } = await supabase
        .from('sales')
        .insert([
          {
            invoice_number: invoiceNum,
            total_amount: grandTotal,
            paid_amount: paymentMethod === 'kasbon' ? 0 : paymentAmount,
            change_amount: paymentMethod === 'cash' ? Math.max(0, changeAmount) : 0,
            payment_method: paymentMethod,
            customer_id: paymentMethod === 'kasbon' ? selectedCustomerId : null,
            due_date: paymentMethod === 'kasbon' ? dueDate : null,
            store_account_id: paymentMethod === 'transfer' ? selectedAccountId : null,
            transfer_ref: paymentMethod === 'transfer' ? transferRef : null,
          },
        ])
        .select()
        .single();

      if (saleErr) throw saleErr;

      console.log('Struktur item keranjang:', cart[0]);
      const itemsToInsert = cart.map((item: any) => ({
        sale_id: saleData.id,
        product_id: item.id || item.product_id,
  
      // Ambil quantity, jika tidak ada cari 'qty', jika masih tidak ada beri nilai default 1
        quantity: item.quantity ?? item.qty ?? 1, 
  
        price: item.price ?? item.unit_price ?? 0,
        buy_price: item.buy_price ?? item.buyPrice ?? item.cost_price ?? 0,
  
      // Ambil unit ID (sesuaikan jika ada nama lain seperti selectedUnitId)
        product_unit_id: item.product_unit_id ?? item.unit_id ?? item.selectedUnitId ?? null, 
      }));

      const { error: itemsErr } = await supabase
        .from('sale_items')
        .insert(itemsToInsert);

      if (itemsErr) throw itemsErr;
      // Sukses
      setCompletedSale({
        invoiceNumber: invoiceNum,
        total: grandTotal,
        paid: paymentMethod === 'kasbon' ? 0 : paymentAmount,
        change: paymentMethod === 'cash' ? Math.max(0, changeAmount) : 0,
        paymentMethod,
        customerName: customerObj?.name,
        dueDate,
        items: [...cart],
        date: new Date().toLocaleString('id-ID'),
      });

      // Reset Form State
      setCart([]);
      setPaymentAmount(0);
      setTransferRef('');
      setSelectedCustomerId('');
      setDueDate('');
      setSearch('');
      fetchInitialData(); // Refresh Data Stok & Utang
    } catch (err: any) {
      alert('Transaksi Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 text-slate-100 font-sans overflow-hidden">
        
        {/* ================= SEKSI KIRI: KATALOG & BARCODE ================= */}
        <div className="w-full lg:w-7/12 p-4 sm:p-6 flex flex-col justify-between h-auto lg:h-full overflow-hidden">
          <div>
            {/* Header POS */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span className="w-2.5 h-7 bg-indigo-500 rounded-full inline-block"></span>
                  {storeSettings?.store_name || 'Kasir POS'}
                </h1>
                <p className="text-xs text-slate-400">Sistem Penjualan & Kasbon Terintegrasi</p>
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ● Sistem Siap
                </span>
              </div>
            </div>

            {/* Barcode Search Bar */}
            <div className="relative mb-4 sm:mb-5 group">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
              <input
                ref={barcodeInputRef}
                id="barcode-input"
                type="text"
                placeholder="Cari Nama Produk / Scan Barcode... (Tekan Enter)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-11 pr-12 py-3 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-inner"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex absolute right-3.5 top-3 items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded-md shadow-sm">
                ↵ Enter
              </kbd>
            </div>
          </div>

          {/* Grid Katalog Produk */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pr-1 max-h-[48vh] lg:max-h-none custom-scrollbar">
            {filteredProducts.map(p => {
              const mainUnit = p.product_units?.[0];
              const isLowStock = p.stock_in_base_unit <= 5;
              
              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="relative overflow-hidden bg-slate-900/60 backdrop-blur-md hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-3.5 transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                >
                  <div>
                    <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-indigo-300 transition mb-1">
                      {p.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono truncate">BC: {p.barcode || '-'}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex justify-between items-end">
                    <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isLowStock 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      Stok: {p.stock_in_base_unit}
                    </span>
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300 font-mono block">
                        Rp {mainUnit?.price.toLocaleString('id-ID') || 0}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">/{mainUnit?.unit_name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= SEKSI KANAN: KERANJANG & CHECKOUT ================= */}
        <div className="w-full lg:w-5/12 bg-slate-900/90 backdrop-blur-2xl p-4 sm:p-6 flex flex-col justify-between h-auto lg:h-full border-t lg:border-t-0 lg:border-l border-slate-800 shadow-2xl">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header Rincian */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-3">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-400" /> Rincian Keranjang
              </h2>
              {cart.length > 0 && (
                <button 
                  onClick={() => setCart([])}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 hover:underline transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Bersihkan
                </button>
              )}
            </div>

            {/* List Keranjang Belanja */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[38vh] lg:max-h-none min-h-[120px] custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full py-10 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800/60 rounded-2xl">
                  <ShoppingCart className="w-10 h-10 stroke-[1.2] mb-2 opacity-30" />
                  <p className="text-xs font-medium">Keranjang Masih Kosong</p>
                  <p className="text-[10px] text-slate-600">Klik produk di sebelah kiri untuk menambahkan</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/50 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 flex justify-between items-center gap-2 shadow-sm hover:border-slate-600 transition">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-white truncate">{item.product.name}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <select
                          value={item.selectedUnit.id}
                          onChange={e => handleUnitChange(idx, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg text-[10px] sm:text-[11px] font-bold text-indigo-300 px-1.5 py-0.5 focus:outline-none focus:border-indigo-500"
                        >
                          {item.product.product_units?.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.unit_name} (Rp {u.price.toLocaleString('id-ID')})
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-400 font-mono">
                          x Rp {item.selectedUnit.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-0.5">
                        <button
                          onClick={() => handleQtyChange(idx, item.qty - 1)}
                          className="px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800 font-bold transition rounded-lg"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={e => handleQtyChange(idx, Number(e.target.value))}
                          className="w-8 text-center text-xs font-black text-white bg-transparent border-none focus:outline-none font-mono"
                        />
                        <button
                          onClick={() => handleQtyChange(idx, item.qty + 1)}
                          className="px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800 font-bold transition rounded-lg"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[65px]">
                        <span className="text-xs font-black text-indigo-300 font-mono block">
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

          {/* ================= PANEL METODE PEMBAYARAN ================= */}
          <div className="border-t border-slate-800/80 pt-3.5 mt-3 space-y-3">
            {/* Display Grand Total */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 p-3.5 rounded-2xl border border-slate-800/80 flex justify-between items-center shadow-lg">
              <span className="text-xs font-semibold text-slate-400">Total Transaksi</span>
              <span 
                onClick={handlePayExact}
                title="Klik untuk atur Uang Pas"
                className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300 font-mono cursor-pointer hover:underline"
              >
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Pilihan Metode Pembayaran */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2.5 px-2 rounded-xl border text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  paymentMethod === 'cash'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-400/50 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/20'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" /> Tunai
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-2.5 px-2 rounded-xl border text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  paymentMethod === 'transfer'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-400/50 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/20'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Transfer
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('kasbon')}
                className={`py-2.5 px-2 rounded-xl border text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  paymentMethod === 'kasbon'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 border-amber-400/50 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-500/20'
                    : 'bg-slate-800/60 border-slate-700/80 text-amber-400/80 hover:text-amber-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Kasbon
              </button>
            </div>

            {/* Detail Form Berdasarkan Metode Bayar */}
            {paymentMethod === 'kasbon' ? (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl space-y-3">
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Nama Pelanggan --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.total_debt ? `(Utang: Rp ${c.total_debt.toLocaleString('id-ID')})` : ''}
                    </option>
                  ))}
                </select>

                <div>
                  <label className="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Tanggal Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paymentMethod === 'transfer' && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-2xl space-y-2.5 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-indigo-300 mb-1 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Rekening / QRIS Tujuan
                      </label>
                      <select
                        value={selectedAccountId}
                        onChange={e => setSelectedAccountId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-semibold text-white focus:outline-none focus:border-indigo-500"
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

                    {currentSelectedAccount?.qris_image_url && (
                      <div className="bg-white p-2.5 rounded-xl flex flex-col items-center justify-center my-1 text-center shadow-md">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 mb-1">
                          <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Scan QRIS di Bawah Ini
                        </div>
                        <img 
                          src={currentSelectedAccount.qris_image_url} 
                          alt="QRIS Toko" 
                          className="w-28 h-28 sm:w-32 sm:h-32 object-contain border border-slate-200 rounded-lg"
                        />
                        <span className="text-[10px] font-semibold text-slate-600 mt-1">
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
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Input Payment Amount */}
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-black text-white font-mono focus:outline-none focus:border-indigo-500 transition shadow-inner"
                  />
                </div>

                {paymentAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold pt-0.5">
                    <span className="text-slate-400">
                      {paymentMethod === 'cash' ? 'Kembalian:' : 'Status Validasi:'}
                    </span>
                    <span className={`font-mono ${changeAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {paymentMethod === 'cash' 
                        ? `Rp ${changeAmount.toLocaleString('id-ID')}`
                        : changeAmount >= 0 ? '✓ Nominal Sesuai' : '✕ Nominal Kurang'
                      }
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Button Checkout */}
            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black tracking-wide uppercase transition duration-300 shadow-xl flex items-center justify-center gap-2 ${
                paymentMethod === 'kasbon'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/20'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/20'
              } disabled:bg-slate-800 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:shadow-none`}
            >
              {loading ? 'Memproses...' : paymentMethod === 'kasbon' ? 'Simpan Kasbon (Tempo) 🕒' : 'Selesaikan Pembayaran 💳'}
            </button>
          </div>
        </div>

        {/* ================= MODAL TAMBAH PELANGGAN ================= */}
        {showAddCustomerModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm">Tambah Pelanggan Baru</h3>
                <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pak Haji Ahmad"
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">No. WhatsApp / Telepon</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500"
                  >
                    Simpan Pelanggan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL SUKSES TRANSAKSI ================= */}
        {completedSale && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Transaksi Berhasil!</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{completedSale.invoiceNumber}</p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-2 text-left font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Total</span>
                  <span className="font-bold text-white">Rp {completedSale.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Metode</span>
                  <span className="font-bold text-indigo-400 uppercase">{completedSale.paymentMethod}</span>
                </div>
                {completedSale.paymentMethod === 'cash' && (
                  <div className="flex justify-between text-slate-300">
                    <span>Kembalian</span>
                    <span className="font-bold text-emerald-400">Rp {completedSale.change.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <Printer className="w-4 h-4" /> Cetak Struk
                </button>
                <button
                  onClick={() => {
                    setCompletedSale(null);
                    focusBarcode();
                  }}
                  className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= ELEMEN PRINT STRUK (THERMAL RECEIPT) ================= */}
      {completedSale && (
        <div id="thermal-receipt" className="hidden print:block text-black bg-white p-1 text-xs font-mono">
          <div className="text-center font-bold uppercase mb-1">
            <p className="text-sm">{storeSettings?.store_name || 'TOKO GROSIR'}</p>
            <p className="font-normal text-[10px]">{storeSettings?.address || ''}</p>
            <p className="font-normal text-[10px]">{storeSettings?.phone || ''}</p>
          </div>
          <p className="text-center">--------------------------------</p>
          <div className="text-[10px] my-1">
            <p>No   : {completedSale.invoiceNumber}</p>
            <p>Tgl  : {completedSale.date}</p>
            {completedSale.customerName && <p>Pel  : {completedSale.customerName}</p>}
            <p>Bayar: {completedSale.paymentMethod.toUpperCase()}</p>
          </div>
          <p className="text-center">--------------------------------</p>
          <div className="space-y-1 my-1">
            {completedSale.items.map((item, idx) => (
              <div key={idx}>
                <p className="font-bold">{item.product.name}</p>
                <div className="flex justify-between text-[10px]">
                  <span>{item.qty} {item.selectedUnit.unit_name} x {item.selectedUnit.price.toLocaleString('id-ID')}</span>
                  <span>{item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center">--------------------------------</p>
          <div className="space-y-0.5 text-right font-bold text-[11px]">
            <div className="flex justify-between">
              <span>TOTAL:</span>
              <span>Rp {completedSale.total.toLocaleString('id-ID')}</span>
            </div>
            {completedSale.paymentMethod !== 'kasbon' ? (
              <>
                <div className="flex justify-between font-normal text-[10px]">
                  <span>BAYAR:</span>
                  <span>Rp {completedSale.paid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-normal text-[10px]">
                  <span>KEMBALI:</span>
                  <span>Rp {completedSale.change.toLocaleString('id-ID')}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-amber-800 font-normal text-[10px]">
                <span>TEMPO:</span>
                <span>{completedSale.dueDate || '-'}</span>
              </div>
            )}
          </div>
          <p className="text-center mt-2">--------------------------------</p>
          <p className="text-center text-[10px] italic">*** Terima Kasih ***</p>
        </div>
      )}
    </>
  );
}