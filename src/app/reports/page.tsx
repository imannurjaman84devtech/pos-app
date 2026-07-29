'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

interface SaleReport {
  id: string
  created_at: string
  total_amount: number
  payment_method: string
  sale_items: {
    id: string
    quantity: number
    price_at_sale: number
    product_units: {
      unit_name: string
    }
    products: {
      name: string
    }
  }[]
}

export default function ReportsPage() {
  const supabase = createClient()
  const [sales, setSales] = useState<SaleReport[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchSalesReport()
  }, [])

  const fetchSalesReport = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sales')
      .select(`
        id,
        created_at,
        total_amount,
        payment_method,
        sale_items (
          id,
          quantity,
          price_at_sale,
          product_units ( unit_name ),
          products ( name )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Gagal mengambil laporan:', error.message)
    } else if (data) {
      setSales(data as unknown as SaleReport[])
    }
    setLoading(false)
  }

  // Ringkasan Statistik
  const totalOmzet = sales.reduce((acc, curr) => acc + curr.total_amount, 0)
  const totalTransaksi = sales.length

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Laporan Penjualan Grosir</h1>
          <p className="text-sm text-gray-500">Pantau omzet, total transaksi, dan detail barang yang terjual</p>
        </div>

        {/* Ringkasan Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Omzet Penjualan</span>
            <div className="text-3xl font-black text-green-600 mt-1">
              Rp {totalOmzet.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Transaksi Selesai</span>
            <div className="text-3xl font-black text-blue-600 mt-1">
              {totalTransaksi} <span className="text-base font-normal text-gray-500">Transaksi</span>
            </div>
          </div>
        </div>

        {/* Tabel Riwayat Penjualan */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-bold text-gray-700">
            📑 Riwayat Transaksi Terakhir
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 font-semibold">Memuat data laporan...</div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Belum ada transaksi penjualan yang dicatat.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Waktu</th>
                    <th className="p-4">Detail Items</th>
                    <th className="p-4">Metode</th>
                    <th className="p-4 text-right">Total Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                        {new Date(sale.created_at).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {sale.sale_items?.map(item => (
                            <div key={item.id} className="text-xs text-gray-700">
                              • <span className="font-semibold">{item.products?.name || 'Produk'}</span> x{item.quantity} {item.product_units?.unit_name} (@Rp {item.price_at_sale.toLocaleString('id-ID')})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 uppercase border border-blue-100">
                          {sale.payment_method || 'CASH'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-gray-800 whitespace-nowrap">
                        Rp {sale.total_amount.toLocaleString('id-ID')}
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