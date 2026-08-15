'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { 
  FileText, 
  TrendingUp, 
  ShoppingBag, 
  AlertCircle, 
  Calendar, 
  Printer, 
  Filter, 
  Trash2,
  RefreshCw,
  Search,
  DollarSign,
  Layers
} from 'lucide-react'

interface SaleReport {
  id: string
  created_at: string
  total_amount: number
  payment_method: string
  payment_status?: string
  sale_items: {
    id: string
    quantity: number
    price_per_unit: number
    product_units?: {
      unit_name: string
    }
    products?: {
      name: string
    }
  }[]
}

export default function ReportsPage() {
  const supabase = createClient()
  const [sales, setSales] = useState<SaleReport[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // State Filter Periode & Metode Pembayaran & Pencarian
  const [timeRange, setTimeRange] = useState<'today' | 'month' | 'year' | 'all'>('month')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'kasbon'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    fetchSalesReport()
  }, [])

  const fetchSalesReport = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      // 1. Dapatkan user yang sedang login
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setErrorMessage('Sesi pengguna tidak ditemukan. Silakan login kembali.')
        return
      }

      // 2. Ambil store_id dari profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.store_id) {
        setErrorMessage('Toko belum terhubung ke akun ini.')
        setSales([])
        return
      }

      // 3. Tarik data sales HANYA untuk store_id milik user yang login
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          created_at,
          total_amount,
          payment_method,
          payment_status,
          sale_items (
            id,
            quantity,
            price_per_unit,
            product_units!product_unit_id ( unit_name ),
            products ( name )
          )
        `)
        .eq('store_id', profile.store_id) // Filter Multi-Tenant
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setSales(data as unknown as SaleReport[])
    } catch (err: any) {
      console.error('Gagal mengambil laporan:', err)
      setErrorMessage(err.message || 'Gagal memuat data dari database.')
    } finally {
      setLoading(false)
    }
  }

  // Fungsi Hapus Transaksi
  const handleDeleteSale = async (id: string) => {
    const confirmDelete = confirm('Apakah Anda yakin ingin menghapus riwayat transaksi ini?')
    if (!confirmDelete) return

    setDeletingId(id)
    try {
      // 1. Hapus item turunan di sale_items terlebih dahulu
      const { error: itemError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id)

      if (itemError) throw itemError

      // 2. Hapus data utama di sales
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)

      if (saleError) throw saleError

      // Update state lokal setelah hapus berhasil
      setSales(prev => prev.filter(item => item.id !== id))
      alert('Transaksi berhasil dihapus!')
    } catch (err: any) {
      console.error('Gagal menghapus transaksi:', err)
      alert('Gagal menghapus transaksi: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // Filter Data berdasarkan Waktu, Metode Bayar & Pencarian Nama Produk/ID
  const filteredSales = useMemo(() => {
    const now = new Date()

    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at)

      // Filter Waktu
      let matchesTime = true
      if (timeRange === 'today') {
        matchesTime = saleDate.toDateString() === now.toDateString()
      } else if (timeRange === 'month') {
        matchesTime =
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
      } else if (timeRange === 'year') {
        matchesTime = saleDate.getFullYear() === now.getFullYear()
      }

      // Filter Pembayaran
      let matchesPayment = true
      if (paymentFilter === 'cash') {
        matchesPayment = sale.payment_method?.toLowerCase() === 'cash' || !sale.payment_method
      } else if (paymentFilter === 'kasbon') {
        matchesPayment = sale.payment_method?.toLowerCase() === 'kasbon'
      }

      // Filter Pencarian
      let matchesSearch = true
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const hasMatchingProduct = sale.sale_items?.some(item => 
          item.products?.name?.toLowerCase().includes(query)
        )
        const hasMatchingId = sale.id.toLowerCase().includes(query)
        matchesSearch = hasMatchingProduct || hasMatchingId
      }

      return matchesTime && matchesPayment && matchesSearch
    })
  }, [sales, timeRange, paymentFilter, searchQuery])

  // Ringkasan Statistik Berdasarkan Data Terfilter
  const totalOmzet = filteredSales.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
  const totalTransaksi = filteredSales.length
  const avgTransaksi = totalTransaksi > 0 ? Math.round(totalOmzet / totalTransaksi) : 0

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 font-sans text-slate-100 selection:bg-cyan-500 selection:text-slate-950 print:bg-white print:text-black print:p-0 relative overflow-x-hidden">
      
      {/* Background Glows (Diabaikan saat print) */}
      <div className="fixed inset-0 pointer-events-none z-0 print:hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-1/2 left-[-100px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Header & Tombol Aksi */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6 print:border-slate-300">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl text-slate-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.25)] print:hidden">
                <FileText className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight print:text-black">
                Laporan Penjualan Grosir
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 print:text-slate-600 mt-1">
              Pantau real-time omzet harian, bulanan, statistik transaksi, dan riwayat penjualan.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto print:hidden">
            <button
              onClick={fetchSalesReport}
              disabled={loading}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition active:scale-95 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)] text-xs sm:text-sm transition active:scale-95"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" /> 
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Pesan Error Database */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3 text-rose-400 text-xs sm:text-sm print:hidden">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Error Database:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Control Panel: Filter Waktu, Pembayaran & Search */}
        <div className="bg-slate-900/80 p-4 rounded-3xl border border-slate-800/80 backdrop-blur-xl flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 print:hidden shadow-xl">
          
          {/* Filter Periode Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 text-xs overflow-x-auto">
            <span className="px-3 text-slate-500 font-semibold flex items-center gap-1.5 flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Periode:
            </span>
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex-shrink-0 ${
                timeRange === 'today' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex-shrink-0 ${
                timeRange === 'month' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex-shrink-0 ${
                timeRange === 'year' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex-shrink-0 ${
                timeRange === 'all' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
          </div>

          {/* Filter Jenis Pembayaran & Input Pencarian */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Cari produk / ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-cyan-500/50 transition placeholder:text-slate-600"
              />
            </div>

            {/* Dropdown Payment */}
            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 flex-shrink-0">
                <Filter className="w-3.5 h-3.5 text-cyan-400" /> Metode:
              </span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="w-full sm:w-auto bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="all">Semua Jenis</option>
                <option value="cash">Tunai (Cash)</option>
                <option value="kasbon">Kasbon / Hutang</option>
              </select>
            </div>

          </div>
        </div>

        {/* AREA LAPORAN LENGKAP */}
        <div id="printable-report" className="space-y-6">
          
          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Omzet */}
            <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl relative overflow-hidden print:border-black print:bg-slate-50">
              <div className="flex justify-between items-center text-slate-400 print:text-slate-700 mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Total Omzet ({timeRange === 'today' ? 'Hari Ini' : timeRange === 'month' ? 'Bulan Ini' : timeRange === 'year' ? 'Tahun Ini' : 'Keseluruhan'})
                </span>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 print:hidden">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 print:text-black font-mono">
                Rp {totalOmzet.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium print:text-slate-600">
                Akumulasi penjualan terfilter
              </div>
            </div>

            {/* Total Transaksi */}
            <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl relative overflow-hidden print:border-black print:bg-slate-50">
              <div className="flex justify-between items-center text-slate-400 print:text-slate-700 mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Total Transaksi
                </span>
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 print:hidden">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 print:text-black font-mono">
                {totalTransaksi} <span className="text-xs font-semibold text-slate-400 print:text-slate-700">Nota</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium print:text-slate-600">
                Transaksi berhasil tercatat
              </div>
            </div>

            {/* Rata-Rata Nilai Transaksi */}
            <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-xl relative overflow-hidden print:border-black print:bg-slate-50">
              <div className="flex justify-between items-center text-slate-400 print:text-slate-700 mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Rata-Rata Nota
                </span>
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 print:hidden">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-300 print:text-black font-mono">
                Rp {avgTransaksi.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium print:text-slate-600">
                Nilai per transaksi pelanggan
              </div>
            </div>

          </div>

          {/* Tabel Data Transaksi */}
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-xl print:border-black print:bg-white">
            
            {/* Table Header Info */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 print:border-black font-bold text-white print:text-black text-xs sm:text-sm flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400 print:hidden" />
                <span>Riwayat & Detail Transaksi</span>
              </div>
              <span className="text-xs font-medium text-slate-400 print:text-slate-700 font-mono">
                Menampilkan {filteredSales.length} data
              </span>
            </div>

            {loading ? (
              <div className="p-16 text-center text-slate-400 text-xs sm:text-sm font-semibold animate-pulse print:hidden flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span>Memuat data laporan penjualan...</span>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="p-16 text-center text-slate-500 text-xs sm:text-sm print:text-black space-y-2">
                <p className="font-bold text-slate-400">Tidak ada transaksi ditemukan</p>
                <p className="text-xs text-slate-600">Coba ubah filter periode, metode pembayaran, atau pencarian Anda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 print:bg-slate-200 text-[11px] text-slate-400 print:text-black uppercase tracking-wider border-b border-slate-800/80 print:border-black font-extrabold">
                      <th className="p-4">Waktu</th>
                      <th className="p-4">Detail Items</th>
                      <th className="p-4">Metode Bayar</th>
                      <th className="p-4 text-right">Total Transaksi</th>
                      <th className="p-4 text-center print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-300 text-xs sm:text-sm">
                    {filteredSales.map(sale => (
                      <tr key={sale.id} className="hover:bg-slate-800/30 transition group">
                        
                        {/* Column 1: Waktu */}
                        <td className="p-4 text-xs font-semibold text-slate-400 print:text-black whitespace-nowrap font-mono">
                          {new Date(sale.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>

                        {/* Column 2: Detail Items */}
                        <td className="p-4">
                          <div className="space-y-1.5">
                            {sale.sale_items?.map(item => (
                              <div key={item.id} className="text-xs text-slate-300 print:text-black flex items-baseline gap-1.5">
                                <span className="text-cyan-400 font-bold print:text-black">•</span>
                                <span className="font-bold text-slate-100 print:text-black">
                                  {item.products?.name || 'Produk'}
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">
                                  x{item.quantity} {item.product_units?.unit_name || ''}
                                </span>
                                <span className="text-slate-500 font-mono text-[11px]">
                                  (@Rp {(item.price_per_unit || 0).toLocaleString('id-ID')})
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Column 3: Metode Bayar */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border print:border-black print:text-black ${
                            sale.payment_method?.toLowerCase() === 'kasbon' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          }`}>
                            {sale.payment_method || 'CASH'}
                          </span>
                        </td>

                        {/* Column 4: Total Transaksi */}
                        <td className="p-4 text-right font-black text-slate-100 print:text-black whitespace-nowrap font-mono text-sm">
                          Rp {(sale.total_amount || 0).toLocaleString('id-ID')}
                        </td>

                        {/* Column 5: Aksi (Delete) */}
                        <td className="p-4 text-center print:hidden whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            disabled={deletingId === sale.id}
                            title="Hapus Transaksi"
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition disabled:opacity-50 active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}