'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { FileText, TrendingUp, ShoppingBag, AlertCircle } from 'lucide-react'

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

  useEffect(() => {
    fetchSalesReport()
  }, [])

  const fetchSalesReport = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      // Query dengan nama kolom price_per_unit yang sesuai dengan POS
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
            product_units ( unit_name ),
            products ( name )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      if (data) {
        setSales(data as unknown as SaleReport[])
      }
    } catch (err: any) {
      console.error('Gagal mengambil laporan:', err)
      setErrorMessage(err.message || 'Gagal memuat data dari database.')
    } finally {
      setLoading(false)
    }
  }

  // Ringkasan Statistik
  const totalOmzet = sales.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
  const totalTransaksi = sales.length

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 font-sans text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" /> Laporan Penjualan Grosir
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau omzet, total transaksi, dan detail barang yang terjual
          </p>
        </div>

        {/* Pesan Error jika Query Bermasalah */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Error Database:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Ringkasan Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Omzet Penjualan</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              Rp {totalOmzet.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Transaksi Selesai</span>
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-400">
              {totalTransaksi} <span className="text-sm font-normal text-slate-400">Transaksi</span>
            </div>
          </div>
        </div>

        {/* Tabel Riwayat Penjualan */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 font-bold text-white text-sm flex items-center gap-2">
            📄 Riwayat Transaksi Terakhir
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs sm:text-sm font-semibold animate-pulse">
              Memuat data laporan penjualan...
            </div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">
              Belum ada transaksi penjualan yang dicatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="p-4">Waktu</th>
                    <th className="p-4">Detail Items</th>
                    <th className="p-4">Metode Bayar</th>
                    <th className="p-4 text-right">Total Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                  {sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 text-xs font-medium text-slate-400 whitespace-nowrap">
                        {new Date(sale.created_at).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {sale.sale_items?.map(item => (
                            <div key={item.id} className="text-xs text-slate-300">
                              • <span className="font-semibold text-white">{item.products?.name || 'Produk'}</span> x{item.quantity} {item.product_units?.unit_name || ''} (@Rp {(item.price_per_unit || 0).toLocaleString('id-ID')})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          sale.payment_method === 'kasbon' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                          {sale.payment_method || 'CASH'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-extrabold text-white whitespace-nowrap">
                        Rp {(sale.total_amount || 0).toLocaleString('id-ID')}
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
  )
}