import React from 'react';
import { Operation, Product } from '../types';
import { Printer, X, CheckCircle2, ShieldCheck } from 'lucide-react';

interface PrintDocumentModalProps {
  operation: Operation;
  products: Product[];
  onClose: () => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({ operation, products, onClose }) => {
  const isReceipt = operation.type === 'Receipt';
  const docTitle = isReceipt ? 'GOODS RECEIPT NOTE (GRN)' : 'DELIVERY CHALLAN & DISPATCH NOTE';

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const totalQty = operation.lines.reduce((acc, l) => acc + l.quantity, 0);
  const totalValue = operation.lines.reduce((acc, l) => {
    const p = products.find((prod) => prod.id === l.productId);
    return acc + (p?.perUnitCost || 0) * l.quantity;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border-2 border-rose-900 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
        
        {/* Top Action Bar (hidden in print) */}
        <div className="p-4 bg-neutral-100 rounded-t-3xl border-b border-neutral-300 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-rose-900" />
            <span className="font-extrabold text-sm text-neutral-800">Print Preview Document</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE BODY */}
        <div className="p-8 sm:p-10 font-sans text-neutral-900 space-y-6 print:p-0">
          
          {/* Company & Document Header */}
          <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-rose-900">VHAT StockSense</span>
                <span className="text-[10px] bg-neutral-200 px-1.5 py-0.5 rounded font-mono font-bold">GSTIN: 27AABCU9603R1ZX</span>
              </div>
              <p className="text-xs text-neutral-600 mt-1 max-w-sm">
                Plot C-12, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093 &bull; Phone: +91 (022) 2835-4900
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase tracking-widest font-black text-neutral-500 block">
                Official Document
              </span>
              <h2 className="text-xl font-black text-rose-950">{docTitle}</h2>
              <span className="text-sm font-mono font-extrabold text-neutral-900 block mt-1">
                Ref: {operation.reference}
              </span>
            </div>
          </div>

          {/* Meta Details 2-Column Grid */}
          <div className="grid grid-cols-2 gap-6 text-xs bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <div>
              <div className="font-bold text-neutral-500 uppercase tracking-wider mb-1">
                {isReceipt ? 'Vendor / Source:' : 'Customer / Consignee:'}
              </div>
              <div className="font-extrabold text-sm text-neutral-900">{operation.contact || 'Azure Interior'}</div>
              <div className="text-neutral-600 mt-0.5">
                {operation.notes || (isReceipt ? 'Registered Vendor Facility' : 'Delivery Address Provided On Order')}
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div>
                <span className="text-neutral-500 font-bold">Schedule / Process Date:</span>{' '}
                <strong className="font-mono text-neutral-900">{operation.scheduleDate}</strong>
              </div>
              <div>
                <span className="text-neutral-500 font-bold">Warehouse Route:</span>{' '}
                <strong className="text-neutral-900">{operation.fromLocationName || operation.fromLocationId} &rarr; {operation.toLocationName || operation.toLocationId}</strong>
              </div>
              <div>
                <span className="text-neutral-500 font-bold">Responsible Staff:</span>{' '}
                <strong className="text-neutral-900">{operation.responsible}</strong>
              </div>
              <div>
                <span className="text-neutral-500 font-bold">Status:</span>{' '}
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                  {operation.status}
                </span>
              </div>
            </div>
          </div>

          {/* Line items Table */}
          <div className="border border-neutral-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-700 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Item #</th>
                  <th className="py-2.5 px-3">SKU / Code</th>
                  <th className="py-2.5 px-3">Product Description</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate (Rs)</th>
                  <th className="py-2.5 px-3 text-right">Amount (Rs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {operation.lines.map((line, i) => {
                  const p = products.find((prod) => prod.id === line.productId);
                  const rate = p?.perUnitCost || 0;
                  const amt = rate * line.quantity;
                  return (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-3 font-mono">{i + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-neutral-800">
                        [{p?.sku || line.productSku || 'SKU'}]
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-900">
                        {p?.name || line.productName || 'Product'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono">
                        {line.quantity} {p?.unitOfMeasure || 'pcs'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {rate.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {amt.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-neutral-50 font-bold border-t border-neutral-300 text-xs">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 text-right uppercase">Total:</td>
                  <td className="py-2.5 px-3 text-center font-mono font-black">{totalQty} units</td>
                  <td></td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-rose-950 text-sm">
                    {totalValue.toLocaleString('en-IN')} Rs
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Declarations & Signatures Block */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs border-t border-neutral-200">
            <div>
              <p className="font-bold text-neutral-700">Verification & Quality Check:</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Goods received/dispatched in good order and condition. Verified against physical count and packaging seals.
              </p>
              <div className="mt-8 pt-2 border-t border-dashed border-neutral-400 w-48 text-center text-neutral-600 font-semibold">
                Store In-Charge Signature
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-neutral-700">Authorized Signatory:</p>
              <p className="text-[11px] text-neutral-500 mt-1">For VHAT StockSense IMS</p>
              <div className="mt-8 pt-2 border-t border-dashed border-neutral-400 w-48 ml-auto text-center text-neutral-600 font-semibold">
                Receiver / Driver Signature
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
