import React from 'react';

interface CartItem {
  id: string;
  name: string;
  qty: number;
  unit_name: string;
  price: number;
  subtotal: number;
}

interface ReceiptProps {
  storeSettings?: {
    store_name?: string;
    address?: string;
    phone?: string;
  };
  invoiceNo: string;
  items: CartItem[];
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  date?: string;
}

export const ReceiptPrint = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ storeSettings, invoiceNo, items, totalAmount, paidAmount, changeAmount, date }, ref) => {
    return (
      <div ref={ref} className="receipt-print-area hidden print:block text-black font-mono text-xs p-2 max-w-[58mm] mx-auto">
        {/* Header Toko */}
        <div className="text-center mb-2 border-b border-dashed border-black pb-2">
          <h2 className="text-sm font-bold uppercase">{storeSettings?.store_name || 'TOKO GROSIR'}</h2>
          <p className="text-[10px] leading-tight">{storeSettings?.address || 'Jl. Raya Utama No. 123'}</p>
          <p className="text-[10px]">Telp: {storeSettings?.phone || '-'}</p>
        </div>

        {/* Info Transaksi */}
        <div className="mb-2 border-b border-dashed border-black pb-1 text-[10px]">
          <div>No: {invoiceNo}</div>
          <div>Tgl: {date || new Date().toLocaleString('id-ID')}</div>
        </div>

        {/* List Items */}
        <div className="border-b border-dashed border-black pb-2 mb-2">
          {items.map((item, idx) => (
            <div key={idx} className="mb-1">
              <div className="font-semibold">{item.name}</div>
              <div className="flex justify-between text-[11px]">
                <span>{item.qty} {item.unit_name} x Rp {item.price.toLocaleString('id-ID')}</span>
                <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total & Pembayaran */}
        <div className="space-y-1 border-b border-dashed border-black pb-2 mb-2 text-[11px]">
          <div className="flex justify-between font-bold">
            <span>TOTAL:</span>
            <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>BAYAR:</span>
            <span>Rp {paidAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>KEMBALI:</span>
            <span>Rp {changeAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-3 text-[10px]">
          <p>*** TERIMA KASIH ***</p>
          <p>Barang yang sudah dibeli</p>
          <p>tidak dapat ditukar/dikembalikan</p>
        </div>
      </div>
    );
  }
);

ReceiptPrint.displayName = 'ReceiptPrint';