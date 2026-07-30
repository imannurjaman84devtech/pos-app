'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { FileText, TrendingUp, ShoppingBag, AlertCircle, Calendar, Printer, Filter, Trash2 } from 'lucide-react'

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

  // State Filter Periode & Metode Pembayaran
  const [timeRange, setTimeRange] = useState<'today' | 'month' | 'year' | 'all'>('month')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'kasbon'>('all')

  useEffect(() => {
    fetchSalesReport()
  }, [])

  const fetchSalesReport = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
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

  // Filter Data berdasarkan Waktu & Metode Bayar
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

      return matchesTime && matchesPayment
    })
  }, [sales, timeRange, paymentFilter])

  // Ringkasan Statistik Berdasarkan Data Terfilter
  const totalOmzet = filteredSales.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
  const totalTransaksi = filteredSales.length

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 font-sans text-slate-100 print:bg-white print:text-black print:p-0">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Tombol Cetak */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white print:text-black flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-500 print:hidden" /> Laporan Penjualan Grosir
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 print:text-slate-600 mt-1">
              Pantau omzet harian, bulanan, tahunan, serta detail transaksi
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold transition print:hidden"
          >
            <Printer className="w-4 h-4 text-indigo-400" /> Cetak Laporan
          </button>
        </div>

        {/* Pesan Error */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-xs sm:text-sm print:hidden">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Error Database:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Control Panel: Filter Waktu & Pembayaran */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 print:hidden">
          
          {/* Filter Periode */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            <span className="px-3 text-slate-500 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Periode:
            </span>
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                timeRange === 'today' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                timeRange === 'month' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                timeRange === 'year' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                timeRange === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
          </div>

          {/* Filter Jenis Pembayaran */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Metode Bayar:
            </span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Jenis</option>
              <option value="cash">Tunai (Cash)</option>
              <option value="kasbon">Kasbon / Hutang</option>
            </select>
          </div>
        </div>

        {/* ========================================================= */}
        {/* AREA YANG AKAN DICETAK (DIBERI ID: printable-report) */}
        {/* ========================================================= */}
        <div id="printable-report" className="space-y-6">
          
          {/* Metrics Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-lg print:border-black print:bg-slate-100">
              <div className="flex justify-between items-center text-slate-400 print:text-slate-700 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Omzet Penjualan ({timeRange === 'today' ? 'Hari Ini' : timeRange === 'month' ? 'Bulan Ini' : timeRange === 'year' ? 'Tahun Ini' : 'Keseluruhan'})
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-400 print:hidden" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 print:text-black">
                Rp {totalOmzet.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-lg print:border-black print:bg-slate-100">
              <div className="flex justify-between items-center text-slate-400 print:text-slate-700 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Transaksi Selesai</span>
                <ShoppingBag className="w-5 h-5 text-indigo-400 print:hidden" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-400 print:text-black">
                {totalTransaksi} <span className="text-sm font-normal text-slate-400 print:text-slate-700">Transaksi</span>
              </div>
            </div>
          </div>

          {/* Tabel Data Transaksi */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg print:border-black print:bg-white">
            <div className="p-4 border-b border-slate-800 print:border-black font-bold text-white print:text-black text-sm flex justify-between items-center">
              <span>📄 Riwayat Transaksi</span>
              <span className="text-xs font-normal text-slate-400 print:text-slate-700">
                Menampilkan {filteredSales.length} data
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs sm:text-sm font-semibold animate-pulse print:hidden">
                Memuat data laporan penjualan...
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs sm:text-sm print:text-black">
                Tidak ada transaksi ditemukan pada periode/filter ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 print:bg-slate-200 text-[11px] text-slate-400 print:text-black uppercase tracking-wider border-b border-slate-800 print:border-black">
                      <th className="p-4">Waktu</th>
                      <th className="p-4">Detail Items</th>
                      <th className="p-4">Metode Bayar</th>
                      <th className="p-4 text-right">Total Transaksi</th>
                      <th className="p-4 text-center print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-300 text-xs sm:text-sm">
                    {filteredSales.map(sale => (
                      <tr key={sale.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 text-xs font-medium text-slate-400 print:text-black whitespace-nowrap">
                          {new Date(sale.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            {sale.sale_items?.map(item => (
                              <div key={item.id} className="text-xs text-slate-300 print:text-black">
                                • <span className="font-semibold text-white print:text-black">{item.products?.name || 'Produk'}</span> x{item.quantity} {item.product_units?.unit_name || ''} (@Rp {(item.price_per_unit || 0).toLocaleString('id-ID')})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border print:border-black print:text-black ${
                            sale.payment_method?.toLowerCase() === 'kasbon' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {sale.payment_method || 'CASH'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-extrabold text-white print:text-black whitespace-nowrap">
                          Rp {(sale.total_amount || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-center print:hidden">
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            disabled={deletingId === sale.id}
                            title="Hapus Transaksi"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-50"
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