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
  MapPin
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

  const fetchCustomers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('total_debt', { ascending: false })
    if (data) setCustomers(data as Customer[])
    setLoading(false)
  }

  const fetchPaymentHistory = async (customerId: string) => {
    setLoadingHistory(true)
    const { data } = await supabase
      .from('debt_payments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (data) setPaymentHistory(data as DebtPayment[])
    setLoadingHistory(false)
  }

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    fetchPaymentHistory(customer.id)
  }

  // Tambah Pelanggan Baru
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('customers').insert([
        { name, phone, address, user_id: user?.id, total_debt: 0 }
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

  // Proses Pelunasan / Cicilan Utang
  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || payAmount <= 0) return

    if (payAmount > selectedCustomer.total_debt) {
      if (!confirm('Nominal pembayaran melebihi total utang. Tetap lanjutkan?')) return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Simpan catatan pembayaran ke debt_payments
      const { error: payErr } = await supabase.from('debt_payments').insert([
        {
          customer_id: selectedCustomer.id,
          amount_paid: payAmount,
          payment_method: payMethod,
          notes: payNotes,
          user_id: user?.id
        }
      ])

      if (payErr) throw payErr

      // 2. Update sisa utang pelanggan di tabel customers
      const newDebtBalance = Math.max(0, selectedCustomer.total_debt - payAmount)
      const { error: custErr } = await supabase
        .from('customers')
        .update({ total_debt: newDebtBalance })
        .eq('id', selectedCustomer.id)

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
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen flex flex-col gap-6">
      
      {/* HEADER & SUMMARY BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" /> Manajemen Pelanggan & Piutang (Kasbon)
          </h1>
          <p className="text-xs text-slate-400 mt-1">Kelola data pelanggan dan catat pelunasan cicilan kasbon</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Total Piutang Toko</span>
            <span className="text-lg font-black text-amber-400">Rp {totalAllDebt.toLocaleString('id-ID')}</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> Pelanggan Baru
          </button>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* SEKSI KIRI: LIST PELANGGAN (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col">
          
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pelanggan / nomor HP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[calc(100vh-280px)]">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                {loading ? 'Memuat data pelanggan...' : 'Belum ada data pelanggan'}
              </div>
            ) : (
              filteredCustomers.map(c => {
                const isSelected = selectedCustomer?.id === c.id
                const hasDebt = c.total_debt > 0

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800 border-indigo-500 shadow-md'
                        : 'bg-slate-900/60 hover:bg-slate-800/50 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{c.name}</h3>
                        {hasDebt ? (
                          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Utang Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Lunas
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" /> {c.phone}</span>}
                        {c.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> {c.address}</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Utang</span>
                      <span className={`text-sm font-extrabold ${hasDebt ? 'text-amber-400' : 'text-slate-400'}`}>
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
        <div className="lg:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          {selectedCustomer ? (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Profile Banner */}
                <div className="border-b border-slate-800 pb-4 mb-4">
                  <h2 className="text-lg font-bold text-white">{selectedCustomer.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedCustomer.phone || 'No. HP tidak dicatat'} • {selectedCustomer.address || 'Alamat tidak dicatat'}
                  </p>

                  <div className="mt-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sisa Utang</span>
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
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
                      >
                        <Wallet className="w-4 h-4" /> Bayar Utang
                      </button>
                    )}
                  </div>
                </div>

                {/* History Pembayaran */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-400" /> Riwayat Pembayaran Cicilan
                  </h4>

                  <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                    {loadingHistory ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Memuat riwayat...</p>
                    ) : paymentHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center bg-slate-800/30 rounded-xl border border-slate-800">
                        Belum ada catatan pembayaran cicilan
                      </p>
                    ) : (
                      paymentHistory.map(pay => (
                        <div key={pay.id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-emerald-400 block">
                              + Rp pay.amount_paid.toLocaleString('id-ID')
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(pay.created_at).toLocaleString('id-ID')} • <span className="uppercase">{pay.payment_method}</span>
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
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
              <Users className="w-12 h-12 stroke-[1.5] mb-2 opacity-40" />
              <p className="text-xs font-medium">Pilih pelanggan di sebelah kiri untuk melihat detail & histori utang</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL BAYAR UTANG ================= */}
      {showPayModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">Pelunasan Utang / Cicilan</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePayDebt} className="space-y-3 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                <span className="text-[10px] text-amber-400 block">Total Utang {selectedCustomer.name}:</span>
                <span className="text-base font-extrabold text-amber-400">
                  Rp {selectedCustomer.total_debt.toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  required
                  value={payAmount || ''}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Metode Pembayaran</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="cash">Tunai (Cash)</option>
                  <option value="transfer">Transfer Bank / QRIS</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Cicilan ke-1"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Proses Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH PELANGGAN ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">Tambah Pelanggan Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Nama Pelanggan / Toko</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Toko Barokah"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">No. WhatsApp / Telepon</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Alamat Singkat</label>
                <textarea
                  placeholder="Alamat domisili/toko pelanggan"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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

    </div>
  )
}