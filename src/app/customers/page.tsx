'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { 
  Users, 
  Search, 
  Plus, 
  Wallet, 
  Receipt, 
  History, 
  X, 
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Loader2
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone?: string
  address?: string
  total_debt: number
  created_at: string
}

interface DebtPayment {
  id: string
  amount_paid: number
  payment_method: string
  notes?: string
  created_at: string
}

export default function CustomersPage() {
  const supabase = createClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // State Pelanggan Terpilih & Histori Pembayaran
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<DebtPayment[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // State Modal Bayar Utang
  const [showPayModal, setShowPayModal] = useState(false)
  const [payAmount, setPayAmount] = useState<number>(0)
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer'>('cash')
  const [payNotes, setPayNotes] = useState('')

  // State Modal Tambah Pelanggan
  const [showAddModal, setShowAddModal] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  // 1. Fetch data pelanggan yang hanya milik store_id user login
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.store_id) return

      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', profile.store_id) // Filter Multi-Tenant
        .order('total_debt', { ascending: false })

      if (data) setCustomers(data as Customer[])
    } catch (err) {
      console.error('Gagal mengambil data pelanggan:', err)
    } finally {
      setLoading(false)
    }
  }

  // 2. Fetch riwayat cicilan/pelunasan utang
  const fetchPaymentHistory = async (customerId: string) => {
    setLoadingHistory(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .maybeSingle()

      const { data } = await supabase
        .from('debt_payments')
        .select('*')
        .eq('customer_id', customerId)
        .eq('store_id', profile?.store_id) // Filter Multi-Tenant
        .order('created_at', { ascending: false })

      if (data) setPaymentHistory(data as DebtPayment[])
    } catch (err) {
      console.error('Gagal mengambil riwayat pembayaran:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    fetchPaymentHistory(customer.id)
  }

  // 3. Tambah Pelanggan Baru dengan Inject store_id
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesi tidak ditemukan')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.store_id) throw new Error('Toko tidak terhubung')

      const { error } = await supabase.from('customers').insert([
        { 
          store_id: profile.store_id, // Inject Store ID
          user_id: user.id, 
          name, 
          phone, 
          address, 
          total_debt: 0 
        }
      ])

      if (error) throw error

      setName('')
      setPhone('')
      setAddress('')
      setShowAddModal(false)
      fetchCustomers()
    } catch (err: any) {
      alert('Gagal menambah pelanggan: ' + err.message)
    }
  }

  // 4. Proses Pelunasan / Cicilan Utang
  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || payAmount <= 0) return

    if (payAmount > selectedCustomer.total_debt) {
      if (!confirm('Nominal pembayaran melebihi total utang. Tetap lanjutkan?')) return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesi tidak ditemukan')

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.store_id) throw new Error('Toko tidak terhubung')

      // Simpan catatan pembayaran ke debt_payments
      const { error: payErr } = await supabase.from('debt_payments').insert([
        {
          store_id: profile.store_id, // Inject Store ID
          customer_id: selectedCustomer.id,
          amount_paid: payAmount,
          payment_method: payMethod,
          notes: payNotes,
          user_id: user.id
        }
      ])

      if (payErr) throw payErr

      // Update sisa utang pelanggan di tabel customers
      const newDebtBalance = Math.max(0, selectedCustomer.total_debt - payAmount)
      const { error: custErr } = await supabase
        .from('customers')
        .update({ total_debt: newDebtBalance })
        .eq('id', selectedCustomer.id)
        .eq('store_id', profile.store_id) // Safeguard Multi-tenant

      if (custErr) throw custErr

      // Reset state & refresh data
      const updatedCustomer = { ...selectedCustomer, total_debt: newDebtBalance }
      setSelectedCustomer(updatedCustomer)
      setPayAmount(0)
      setPayNotes('')
      setShowPayModal(false)
      fetchCustomers()
      fetchPaymentHistory(selectedCustomer.id)

    } catch (err: any) {
      alert('Gagal memproses pembayaran: ' + err.message)
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  )

  const totalAllDebt = customers.reduce((sum, c) => sum + (c.total_debt || 0), 0)

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-10 left-[-100px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* HEADER & SUMMARY BAR */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl text-slate-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                <Users className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Manajemen Pelanggan & Piutang
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Kelola data pelanggan dan catat pelunasan cicilan kasbon toko</p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl text-right backdrop-blur-md">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Total Piutang Toko</span>
              <span className="text-base md:text-lg font-black text-amber-400">Rp {totalAllDebt.toLocaleString('id-ID')}</span>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-3 rounded-2xl flex items-center gap-2 transition active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Pelanggan Baru
            </button>
          </div>
        </div>

        {/* MAIN CONTENT SPLIT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SEKSI KIRI: LIST PELANGGAN (7 COLS) */}
          <div className="lg:col-span-7 bg-slate-900/80 p-5 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl flex flex-col">
            
            {/* Search bar */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama pelanggan / nomor HP..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition"
              />
            </div>

            {/* List items */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[calc(100vh-280px)]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-xs font-semibold">Memuat data pelanggan...</span>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs font-medium">
                  Belum ada data pelanggan terdaftar.
                </div>
              ) : (
                filteredCustomers.map(c => {
                  const isSelected = selectedCustomer?.id === c.id
                  const hasDebt = c.total_debt > 0

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-800/90 border-cyan-500/50 shadow-lg shadow-cyan-500/5'
                          : 'bg-slate-950/40 hover:bg-slate-800/40 border-slate-800/80'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white">{c.name}</h3>
                          {hasDebt ? (
                            <span className="text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Kasbon Aktif
                            </span>
                          ) : (
                            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Lunas
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-[11px] text-slate-400">
                          {c.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500" /> {c.phone}</span>}
                          {c.address && <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-500" /> {c.address}</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Sisa Utang</span>
                        <span className={`text-sm font-black ${hasDebt ? 'text-amber-400' : 'text-slate-400'}`}>
                          Rp {(c.total_debt || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* SEKSI KANAN: DETAIL PELANGGAN & HISTORI (5 COLS) */}
          <div className="lg:col-span-5 bg-slate-900/80 p-5 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl flex flex-col justify-between">
            {selectedCustomer ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Profile Banner */}
                  <div className="border-b border-slate-800/80 pb-4 mb-4">
                    <h2 className="text-lg font-black text-white">{selectedCustomer.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedCustomer.phone || 'No. HP -'} • {selectedCustomer.address || 'Alamat -'}
                    </p>

                    <div className="mt-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Sisa Kasbon</span>
                        <span className="text-xl font-black text-amber-400">
                          Rp {(selectedCustomer.total_debt || 0).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {selectedCustomer.total_debt > 0 && (
                        <button
                          onClick={() => {
                            setPayAmount(selectedCustomer.total_debt)
                            setShowPayModal(true)
                          }}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                          <Wallet className="w-4 h-4 stroke-[2.5]" /> Bayar Utang
                        </button>
                      )}
                    </div>
                  </div>

                  {/* History Pembayaran */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-cyan-400" /> Riwayat Pembayaran Cicilan
                    </h4>

                    <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                      {loadingHistory ? (
                        <p className="text-xs text-slate-500 py-4 text-center">Memuat riwayat...</p>
                      ) : paymentHistory.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
                          Belum ada catatan pembayaran cicilan
                        </p>
                      ) : (
                        paymentHistory.map(pay => (
                          <div key={pay.id} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-extrabold text-emerald-400 block">
                                + Rp {pay.amount_paid.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(pay.created_at).toLocaleString('id-ID')} • <span className="uppercase font-bold">{pay.payment_method}</span>
                              </span>
                              {pay.notes && <p className="text-[10px] text-slate-500 italic mt-0.5">{pay.notes}</p>}
                            </div>
                            <Receipt className="w-4 h-4 text-slate-600" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16 text-center">
                <Users className="w-12 h-12 stroke-[1.5] mb-2 text-slate-600" />
                <p className="text-xs font-medium max-w-[200px]">Pilih pelanggan di sebelah kiri untuk melihat detail & histori utang</p>
              </div>
            )}
          </div>
        </div>

        {/* MODAL BAYAR UTANG */}
        {showPayModal && selectedCustomer && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" /> Pelunasan / Cicilan
                </h3>
                <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePayDebt} className="space-y-3.5 text-xs">
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-amber-400 block uppercase">Total Sisa Utang:</span>
                  <span className="text-base font-black text-amber-400">
                    Rp {selectedCustomer.total_debt.toLocaleString('id-ID')}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">Nominal Pembayaran (Rp)</label>
                  <input
                    type="number"
                    required
                    value={payAmount || ''}
                    onChange={e => setPayAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-black text-emerald-400 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">Metode Pembayaran</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="cash">Tunai (Cash)</option>
                    <option value="transfer">Transfer Bank / QRIS</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Misal: Cicilan ke-1"
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    Proses Pembayaran
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH PELANGGAN */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" /> Tambah Pelanggan Baru
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">Nama Pelanggan / Toko</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Toko Barokah"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">No. WhatsApp / Telepon</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">Alamat Singkat</label>
                  <textarea
                    placeholder="Alamat domisili/toko pelanggan"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 transition active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  >
                    Simpan Pelanggan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}