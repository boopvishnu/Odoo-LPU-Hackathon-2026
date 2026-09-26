import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { Operation, OperationType, OperationStatus, OperationLine } from '../types';
import { 
  ArrowLeft, 
  Printer, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  Building2, 
  MapPin, 
  User as UserIcon, 
  AlertCircle,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

interface OperationDetailProps {
  operationId?: string; // undefined means create new
  defaultType: OperationType;
  onBack: () => void;
  onPrint: (op: Operation) => void;
}

export const OperationDetail: React.FC<OperationDetailProps> = ({
  operationId,
  defaultType,
  onBack,
  onPrint
}) => {
  const { user } = useAuth();
  const { 
    operations, 
    products, 
    warehouses, 
    locations, 
    createOperation, 
    updateOperation, 
    validateOperation, 
    cancelOperation 
  } = useInventory();

  const isNew = !operationId;
  const existingOp = operations.find((o) => o.id === operationId);

  const [type, setType] = useState<OperationType>(existingOp ? existingOp.type : defaultType);
  const [reference, setReference] = useState(existingOp ? existingOp.reference : '');
  const [status, setStatus] = useState<OperationStatus>(existingOp ? existingOp.status : 'Draft');
  const [contact, setContact] = useState(existingOp ? existingOp.contact : 'Azure Interior');
  const [responsible, setResponsible] = useState(existingOp ? existingOp.responsible : user?.name || 'Aman Shaikh');
  const [scheduleDate, setScheduleDate] = useState(
    existingOp ? existingOp.scheduleDate : new Date().toISOString().split('T')[0]
  );
  const [fromLocationId, setFromLocationId] = useState(
    existingOp 
      ? existingOp.fromLocationId 
      : (type === 'Receipt' ? 'vendor' : 'loc_wh_stock1')
  );
  const [toLocationId, setToLocationId] = useState(
    existingOp 
      ? existingOp.toLocationId 
      : (type === 'Delivery' ? 'customer' : 'loc_wh_stock1')
  );
  const [operationSubtype, setOperationSubtype] = useState(
    existingOp ? existingOp.operationSubtype || 'Standard' : 'Customer Dispatch'
  );
  const [notes, setNotes] = useState(existingOp ? existingOp.notes || '' : '');

  // Lines
  const [lines, setLines] = useState<OperationLine[]>(
    existingOp && existingOp.lines.length > 0
      ? existingOp.lines
      : [{ productId: products[0]?.id || '', productName: products[0]?.name || '', productSku: products[0]?.sku || '', quantity: 6 }]
  );

  // For adjustments
  const [adjProductId, setAdjProductId] = useState<string>(
    existingOp && existingOp.lines[0] ? existingOp.lines[0].productId : products[0]?.id || ''
  );
  const selectedAdjProduct = products.find((p) => p.id === adjProductId);
  const [adjCountedQty, setAdjCountedQty] = useState<number>(
    existingOp?.adjustmentCountedQty ?? (selectedAdjProduct?.onHandQty || 0)
  );

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-generate reference for new operation
  useEffect(() => {
    if (isNew) {
      let prefix = 'WH/IN';
      if (type === 'Delivery') prefix = 'WH/OUT';
      else if (type === 'Transfer') prefix = 'WH/INT';
      else if (type === 'Adjustment') prefix = 'WH/ADJ';

      const count = operations.filter((o) => o.type === type).length + 1;
      setReference(`${prefix}/${String(count).padStart(4, '0')}`);
    }
  }, [type, isNew, operations]);

  // Product line handlers
  const handleAddLine = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    setLines([
      ...lines,
      {
        productId: firstProd.id,
        productName: firstProd.name,
        productSku: firstProd.sku,
        quantity: 1
      }
    ]);
  };

  const handleUpdateLine = (index: number, productId: string, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    const updated = [...lines];
    updated[index] = {
      productId,
      productName: prod?.name || '',
      productSku: prod?.sku || '',
      quantity: Math.max(1, quantity)
    };
    setLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, idx) => idx !== index));
  };

  // Actions
  const handleSaveDraft = async () => {
    setErrorMsg('');
    try {
      const fromLoc = locations.find((l) => l.id === fromLocationId);
      const toLoc = locations.find((l) => l.id === toLocationId);

      const opPayload = {
        type,
        fromLocationId,
        fromLocationName: fromLoc ? fromLoc.name : (type === 'Receipt' ? 'vendor' : fromLocationId),
        toLocationId,
        toLocationName: toLoc ? toLoc.name : (type === 'Delivery' ? 'vendor / customer' : toLocationId),
        contact,
        responsible,
        scheduleDate,
        status: status,
        lines: type === 'Adjustment' ? [
          {
            productId: adjProductId,
            productName: selectedAdjProduct?.name,
            productSku: selectedAdjProduct?.sku,
            quantity: Math.abs(adjCountedQty - (selectedAdjProduct?.onHandQty || 0))
          }
        ] : lines,
        operationSubtype,
        notes,
        adjustmentRecordedQty: selectedAdjProduct?.onHandQty || 0,
        adjustmentCountedQty: adjCountedQty,
        adjustmentDifference: adjCountedQty - (selectedAdjProduct?.onHandQty || 0)
      };

      if (isNew) {
        const created = await createOperation(opPayload);
        setSuccessMsg(`Operation ${created.reference} saved successfully!`);
        setTimeout(() => {
          onBack();
        }, 1200);
      } else if (existingOp) {
        await updateOperation(existingOp.id, opPayload);
        setSuccessMsg('Operation updated successfully!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving operation');
    }
  };

  const handleValidate = async () => {
    setErrorMsg('');
    try {
      if (isNew) {
        const fromLoc = locations.find((l) => l.id === fromLocationId);
        const toLoc = locations.find((l) => l.id === toLocationId);

        const created = await createOperation({
          type,
          fromLocationId,
          fromLocationName: fromLoc ? fromLoc.name : (type === 'Receipt' ? 'vendor' : fromLocationId),
          toLocationId,
          toLocationName: toLoc ? toLoc.name : (type === 'Delivery' ? 'vendor / customer' : toLocationId),
          contact,
          responsible,
          scheduleDate,
          status: 'Ready',
          lines: type === 'Adjustment' ? [
            {
              productId: adjProductId,
              productName: selectedAdjProduct?.name,
              productSku: selectedAdjProduct?.sku,
              quantity: Math.abs(adjCountedQty - (selectedAdjProduct?.onHandQty || 0))
            }
          ] : lines,
          operationSubtype,
          notes,
          adjustmentRecordedQty: selectedAdjProduct?.onHandQty || 0,
          adjustmentCountedQty: adjCountedQty,
          adjustmentDifference: adjCountedQty - (selectedAdjProduct?.onHandQty || 0)
        });

        const res = await validateOperation(created.id);
        if (res.success) {
          setStatus('Done');
          setSuccessMsg(`Stock updated! ${created.reference} marked as Done and logged to Move History.`);
        } else {
          setErrorMsg(res.error || 'Failed to validate');
        }
      } else if (existingOp) {
        const res = await validateOperation(existingOp.id);
        if (res.success) {
          setStatus('Done');
          setSuccessMsg(`Stock updated! ${existingOp.reference} marked as Done and logged to Move History.`);
        } else {
          setErrorMsg(res.error || 'Failed to validate');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Validation error');
    }
  };

  const handleCancel = async () => {
    if (existingOp) {
      await cancelOperation(existingOp.id);
      setStatus('Canceled');
    } else {
      onBack();
    }
  };

  const currentOpForPrint: Operation = existingOp || {
    id: 'temp_op',
    reference,
    type,
    fromLocationId,
    fromLocationName: locations.find((l) => l.id === fromLocationId)?.name || fromLocationId,
    toLocationId,
    toLocationName: locations.find((l) => l.id === toLocationId)?.name || toLocationId,
    contact,
    responsible,
    scheduleDate,
    status,
    lines,
    operationSubtype,
    notes,
    createdAt: new Date().toISOString()
  };

  // Pipeline indicator steps matching wireframes
  const pipelineSteps: OperationStatus[] = ['Draft', 'Waiting', 'Ready', 'Done'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-rose-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {type === 'Receipt' ? 'Receipts' : type === 'Delivery' ? 'Deliveries' : type}</span>
        </button>
      </div>

      {/* Main Wireframe Card matching Image 9 (Delivery) & Image 10 (Receipt) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-rose-900 shadow-md space-y-6">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-rose-100">
          
          {/* Left Title: "[New]" button & Operation Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!isNew) {
                  onBack();
                }
              }}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-950 font-extrabold text-xs rounded-xl border border-rose-300 shadow-2xs transition-all"
            >
              New
            </button>

            <h1 className="text-2xl font-black text-rose-950 tracking-tight">
              {type === 'Receipt' ? 'Receipt' : type === 'Delivery' ? 'Delivery' : type === 'Transfer' ? 'Internal Transfer' : 'Stock Adjustment'}
            </h1>
          </div>

          {/* Right Pipeline Badge matching "Draft > Waiting > Ready > Done" in Image 9 & 10 */}
          <div className="flex items-center bg-neutral-50 px-3 py-1.5 rounded-2xl border border-rose-200 text-xs font-semibold">
            {pipelineSteps.map((step, idx) => {
              const isCurrent = status === step;
              const isPassed = pipelineSteps.indexOf(status) > idx && status !== 'Canceled';
              return (
                <React.Fragment key={step}>
                  <span
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      isCurrent
                        ? 'bg-rose-900 text-white font-extrabold shadow-2xs'
                        : isPassed
                        ? 'text-emerald-700 font-bold'
                        : 'text-neutral-400'
                    }`}
                  >
                    {step}
                  </span>
                  {idx < pipelineSteps.length - 1 && (
                    <span className="text-neutral-300 mx-1">&gt;</span>
                  )}
                </React.Fragment>
              );
            })}
            {status === 'Canceled' && (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-bold border border-red-300">
                Canceled
              </span>
            )}
          </div>

        </div>

        {/* ================= ACTION BUTTONS ROW (Image 9 & 10: Validate, Print, Cancel) ================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
          
          <div className="flex items-center gap-2.5">
            {/* [Validate] Button */}
            <button
              onClick={handleValidate}
              disabled={status === 'Done' || status === 'Canceled'}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs border border-emerald-900 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Validate</span>
            </button>

            {/* [Print] Button (Enabled when Done per mockup note "Print the receipt once it's DONE") */}
            <button
              onClick={() => onPrint(currentOpForPrint)}
              disabled={status !== 'Done' && !isNew}
              className={`px-5 py-2 font-extrabold text-xs rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                status === 'Done' || isNew
                  ? 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300 shadow-2xs'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-200 opacity-60 cursor-not-allowed'
              }`}
              title={status !== 'Done' ? 'Print becomes active once validated as DONE' : 'Print Document'}
            >
              <Printer className="w-4 h-4 text-rose-900" />
              <span>Print</span>
            </button>

            {/* [Cancel] Button */}
            <button
              onClick={handleCancel}
              disabled={status === 'Done' || status === 'Canceled'}
              className="px-4 py-2 bg-white hover:bg-red-50 text-red-700 hover:text-red-800 font-bold text-xs rounded-xl border border-red-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2">
            {status !== 'Done' && status !== 'Canceled' && (
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-700 font-semibold text-xs rounded-xl border border-neutral-300 shadow-2xs"
              >
                Save Changes
              </button>
            )}
            <span className="text-xs text-neutral-500 font-mono">
              Ref: <strong className="text-rose-950 font-bold">{reference}</strong>
            </span>
          </div>

        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= TWO-COLUMN HEADER FIELDS (As shown in Image 9 & 10) ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            
            {/* Reference Number */}
            <div>
              <span className="text-xs font-mono font-bold text-rose-900 uppercase">Reference Number</span>
              <div className="text-lg font-black text-neutral-900 font-mono mt-0.5">
                {reference}
              </div>
            </div>

            {/* In Receipt: "Receive From" (Image 10). In Delivery: "Delivery Adress" (Image 9) */}
            {type === 'Receipt' ? (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Receive From:
                </label>
                <input
                  type="text"
                  value={contact}
                  disabled={status === 'Done'}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. Azure Interior / Tata Steel"
                  className="w-full px-3.5 py-2 bg-neutral-50 border-b-2 border-rose-300 focus:border-rose-800 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
                />
              </div>
            ) : type === 'Delivery' ? (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Delivery Adress:
                </label>
                <input
                  type="text"
                  value={notes}
                  disabled={status === 'Done'}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Plot 42, Bandra Kurla Complex, Mumbai"
                  className="w-full px-3.5 py-2 bg-neutral-50 border-b-2 border-rose-300 focus:border-rose-800 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
                />
                <div className="mt-2">
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                    Customer / Recipient Contact:
                  </label>
                  <input
                    type="text"
                    value={contact}
                    disabled={status === 'Done'}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. Azure Interior / Reliance Retail"
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            ) : type === 'Transfer' ? (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  From Location:
                </label>
                <select
                  value={fromLocationId}
                  disabled={status === 'Done'}
                  onChange={(e) => setFromLocationId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border-b-2 border-rose-300 focus:border-rose-800 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.warehouseCode || 'WH'})</option>
                  ))}
                </select>
              </div>
            ) : (
              /* Adjustment Location */
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Audit Location:
                </label>
                <select
                  value={fromLocationId}
                  disabled={status === 'Done'}
                  onChange={(e) => {
                    setFromLocationId(e.target.value);
                    setToLocationId(e.target.value);
                  }}
                  className="w-full px-3.5 py-2 bg-neutral-50 border-b-2 border-rose-300 focus:border-rose-800 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Responsible Field (Image 9 & 10) */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Responsible:
              </label>
              <input
                type="text"
                value={responsible}
                disabled={status === 'Done'}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="e.g. Aman Shaikh"
                className="w-full px-3.5 py-2 bg-neutral-50 border-b-2 border-rose-300 focus:border-rose-800 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
              />
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            
            {/* Schedule Date (Image 9 & 10) */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Schedule Date:
              </label>
              <input
                type="date"
                value={scheduleDate}
                disabled={status === 'Done'}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-neutral-50 border-b-2 border-rose-300 focus:border-rose-800 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden font-mono"
              />
            </div>

            {/* In Delivery: "Operation type" dropdown (Image 9) */}
            {type === 'Delivery' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Operation type:
                </label>
                <select
                  value={operationSubtype}
                  disabled={status === 'Done'}
                  onChange={(e) => setOperationSubtype(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border-b-2 border-rose-300 focus:border-rose-800 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
                >
                  <option value="Customer Dispatch">Customer Dispatch</option>
                  <option value="Warehouse Delivery">Warehouse Delivery</option>
                  <option value="Inter-State Consignment">Inter-State Consignment</option>
                  <option value="Sample Dispatch">Sample Dispatch</option>
                </select>
              </div>
            )}

            {/* In Receipt: Destination Location */}
            {type === 'Receipt' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Destination Location:
                </label>
                <select
                  value={toLocationId}
                  disabled={status === 'Done'}
                  onChange={(e) => setToLocationId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border-b-2 border-rose-300 focus:border-rose-800 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.warehouseCode || 'WH'})</option>
                  ))}
                </select>
              </div>
            )}

            {/* In Transfer: Destination Location */}
            {type === 'Transfer' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  To Location:
                </label>
                <select
                  value={toLocationId}
                  disabled={status === 'Done'}
                  onChange={(e) => setToLocationId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border-b-2 border-rose-300 focus:border-rose-800 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.warehouseCode || 'WH'})</option>
                  ))}
                </select>
              </div>
            )}

            {/* In Adjustment: Reason / Audit Note */}
            {type === 'Adjustment' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Adjustment Reason:
                </label>
                <input
                  type="text"
                  value={notes}
                  disabled={status === 'Done'}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Damage in transit, physical stock count mismatch"
                  className="w-full px-3.5 py-2 bg-neutral-50 border-b-2 border-rose-300 focus:border-rose-800 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
                />
              </div>
            )}

          </div>

        </div>

        {/* ================= PRODUCTS TABLE (As shown in Image 9 & 10) ================= */}
        {type !== 'Adjustment' ? (
          <div className="pt-4 border-t-2 border-rose-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-neutral-900">Products</h3>
              <span className="text-xs text-neutral-500 font-medium">{lines.length} item line(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 w-40">Quantity</th>
                    <th className="py-2.5 px-3 w-32">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    {status !== 'Done' && <th className="py-2.5 px-3 w-12 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lines.map((line, idx) => {
                    const prod = products.find((p) => p.id === line.productId);
                    const cost = prod ? prod.perUnitCost : 0;
                    return (
                      <tr key={idx} className="hover:bg-neutral-50/70">
                        {/* Product selection (Image 10: "[DESK001] Desk") */}
                        <td className="py-2 px-3">
                          {status === 'Done' ? (
                            <span className="font-bold text-neutral-900 font-mono">
                              [{prod?.sku}] {prod?.name}
                            </span>
                          ) : (
                            <select
                              value={line.productId}
                              onChange={(e) => handleUpdateLine(idx, e.target.value, line.quantity)}
                              className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  [{p.sku}] {p.name} — ({p.onHandQty} on hand)
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-2 px-3">
                          {status === 'Done' ? (
                            <span className="font-bold text-neutral-900 font-mono text-sm">
                              {line.quantity} {prod?.unitOfMeasure || 'pcs'}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                value={line.quantity}
                                onChange={(e) => handleUpdateLine(idx, line.productId, Number(e.target.value))}
                                className="w-24 p-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                              />
                              <span className="text-neutral-500 font-medium text-xs">
                                {prod?.unitOfMeasure || 'pcs'}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-3 font-semibold text-neutral-700">
                          {cost.toLocaleString('en-IN')} Rs
                        </td>

                        <td className="py-2 px-3 text-right font-black text-rose-950 font-mono">
                          {(cost * line.quantity).toLocaleString('en-IN')} Rs
                        </td>

                        {status !== 'Done' && (
                          <td className="py-2 px-3 text-center">
                            {lines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="p-1.5 text-neutral-400 hover:text-red-600 rounded hover:bg-neutral-100"
                                title="Remove line"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* "Add New product" row matching wireframes in Image 9 & 10 */}
            {status !== 'Done' && (
              <div className="mt-4 pt-2">
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="px-4 py-2 bg-neutral-100 hover:bg-rose-50 text-rose-900 border border-rose-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New product</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ================= ADJUSTMENT SPECIFIC FORM (Section 5.4) ================= */
          <div className="pt-4 border-t-2 border-rose-100 space-y-4">
            <h3 className="text-base font-black text-neutral-900">Stock Count Reconciliation</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
              
              {/* Product Select */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Product to Adjust:
                </label>
                <select
                  value={adjProductId}
                  disabled={status === 'Done'}
                  onChange={(e) => {
                    setAdjProductId(e.target.value);
                    const p = products.find((x) => x.id === e.target.value);
                    if (p) setAdjCountedQty(p.onHandQty);
                  }}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Recorded Quantity (Read-only from system) */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Recorded Quantity (System):
                </label>
                <div className="p-2 bg-neutral-200/80 rounded-xl text-sm font-bold text-neutral-800 font-mono">
                  {selectedAdjProduct?.onHandQty || 0} {selectedAdjProduct?.unitOfMeasure}
                </div>
              </div>

              {/* Counted Quantity (Input) */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Counted Quantity (Physical):
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjCountedQty}
                  disabled={status === 'Done'}
                  onChange={(e) => setAdjCountedQty(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-rose-300 rounded-xl text-sm font-bold text-neutral-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                />
              </div>

            </div>

            {/* Difference Calculation */}
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-700">Calculated Variance / Difference:</span>
              <span className={`text-base font-black font-mono ${adjCountedQty - (selectedAdjProduct?.onHandQty || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {adjCountedQty - (selectedAdjProduct?.onHandQty || 0) >= 0 
                  ? `+${adjCountedQty - (selectedAdjProduct?.onHandQty || 0)}` 
                  : adjCountedQty - (selectedAdjProduct?.onHandQty || 0)} {selectedAdjProduct?.unitOfMeasure}
              </span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
