import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  Package, 
  AlertTriangle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ChevronRight,
  TrendingUp,
  Warehouse as WarehouseIcon,
  Search
} from 'lucide-react';
import { OperationStatus, OperationType } from '../types';

interface DashboardProps {
  onNavigate: (tab: string, subParam?: any) => void;
  onOpenOperation: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenOperation }) => {
  const { 
    products, 
    operations, 
    warehouses, 
    locations,
    totalProductsCount,
    lowStockCount,
    pendingReceiptsCount,
    pendingDeliveriesCount,
    scheduledTransfersCount,
    getLateCount,
    getWaitingCount,
    getTotalCount
  } = useInventory();

  // Dynamic filter state
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Collect distinct categories
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filter operations based on dynamic filters
  const filteredOperations = operations.filter((op) => {
    if (selectedDocType !== 'all') {
      if (selectedDocType === 'Receipt' && op.type !== 'Receipt') return false;
      if (selectedDocType === 'Delivery' && op.type !== 'Delivery') return false;
      if (selectedDocType === 'Transfer' && op.type !== 'Transfer') return false;
      if (selectedDocType === 'Adjustment' && op.type !== 'Adjustment') return false;
    }

    if (selectedStatus !== 'all' && op.status !== selectedStatus) return false;

    if (selectedWarehouse !== 'all') {
      // Check if location belongs to selected warehouse
      const matchesFrom = locations.some((l) => l.id === op.fromLocationId && l.warehouseId === selectedWarehouse);
      const matchesTo = locations.some((l) => l.id === op.toLocationId && l.warehouseId === selectedWarehouse);
      if (!matchesFrom && !matchesTo) return false;
    }

    if (selectedCategory !== 'all') {
      const hasCategory = op.lines.some((line) => {
        const prod = products.find((p) => p.id === line.productId);
        return prod?.category === selectedCategory;
      });
      if (!hasCategory) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchRef = op.reference.toLowerCase().includes(term);
      const matchContact = (op.contact || '').toLowerCase().includes(term);
      const matchResp = (op.responsible || '').toLowerCase().includes(term);
      const matchProd = op.lines.some((l) => (l.productName || '').toLowerCase().includes(term) || (l.productSku || '').toLowerCase().includes(term));
      if (!matchRef && !matchContact && !matchResp && !matchProd) return false;
    }

    return true;
  });

  const getStatusBadge = (status: OperationStatus) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-200 text-neutral-700 border border-neutral-300">Draft</span>;
      case 'Waiting':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Waiting</span>;
      case 'Ready':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">Ready</span>;
      case 'Done':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Done</span>;
      case 'Canceled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">Canceled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Page Header matching wireframe style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-rose-900/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-900 text-amber-200 rounded-xl shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Dashboard</h1>
            <p className="text-xs text-neutral-500 font-medium">Real-time inventory statistics & warehouse operations summary</p>
          </div>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-medium">Active Warehouse:</span>
          <span className="text-xs font-bold px-2.5 py-1 bg-neutral-100 rounded-lg border border-neutral-300 text-neutral-800">
            All Warehouses (WH & BLR)
          </span>
        </div>
      </div>

      {/* KPI Cards (Section 3) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        
        {/* Total Products */}
        <div 
          onClick={() => onNavigate('products')}
          className="bg-white p-4 rounded-2xl border-2 border-rose-200/90 shadow-xs hover:border-rose-900 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Products</span>
            <Package className="w-4 h-4 text-neutral-400 group-hover:text-rose-900" />
          </div>
          <div className="mt-2 text-2xl font-black text-neutral-900">{totalProductsCount}</div>
          <div className="mt-1 text-[11px] text-neutral-500">Active catalog items</div>
        </div>

        {/* Low Stock Items */}
        <div 
          onClick={() => {
            onNavigate('products');
          }}
          className={`p-4 rounded-2xl border-2 shadow-xs transition-all cursor-pointer group ${
            lowStockCount > 0 
              ? 'bg-rose-50/60 border-rose-400 hover:border-rose-900 hover:shadow-md' 
              : 'bg-white border-rose-200/90 hover:border-rose-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-rose-600 animate-pulse' : 'text-neutral-400'}`} />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-950">{lowStockCount}</div>
          <div className="mt-1 text-[11px] text-rose-800 font-medium">Below reorder threshold</div>
        </div>

        {/* Pending Receipts */}
        <div 
          onClick={() => onNavigate('operations-receipts')}
          className="bg-white p-4 rounded-2xl border-2 border-rose-200/90 shadow-xs hover:border-rose-900 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pending Receipts</span>
            <ArrowDownToLine className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-black text-neutral-900">{pendingReceiptsCount}</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">To be received & verified</div>
        </div>

        {/* Pending Deliveries */}
        <div 
          onClick={() => onNavigate('operations-delivery')}
          className="bg-white p-4 rounded-2xl border-2 border-rose-200/90 shadow-xs hover:border-rose-900 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pending Deliveries</span>
            <ArrowUpFromLine className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-black text-neutral-900">{pendingDeliveriesCount}</div>
          <div className="mt-1 text-[11px] text-rose-800 font-medium">To be dispatched</div>
        </div>

        {/* Internal Transfers Scheduled */}
        <div 
          onClick={() => onNavigate('operations-transfers')}
          className="bg-white p-4 rounded-2xl border-2 border-rose-200/90 shadow-xs hover:border-rose-900 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Transfers</span>
            <ArrowLeftRight className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-black text-neutral-900">{scheduledTransfersCount}</div>
          <div className="mt-1 text-[11px] text-blue-700 font-medium">Scheduled relocations</div>
        </div>

      </div>

      {/* OPERATIONS SUMMARY PANELS (THE 2 BIG PANELS FROM IMAGE 6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ================= LEFT PANEL: RECEIPT ================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-rose-900 shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-neutral-900">Receipt</h2>
              </div>
              <span className="text-xs text-neutral-500 uppercase font-semibold">Incoming Stock</span>
            </div>

            {/* Content inside panel matching Image 6: "[4 to receive] | 1 Late | 6 operations" */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              {/* Clickable button/stat box */}
              <button
                onClick={() => onNavigate('operations-receipts')}
                className="w-full sm:w-auto px-6 py-4 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-lg rounded-2xl shadow-md border-2 border-emerald-900 transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>{pendingReceiptsCount} to receive</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Stats on the right */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 text-sm font-semibold">
                <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                  <Clock className="w-4 h-4" />
                  <span>{getLateCount('Receipt')} Late</span>
                </div>
                <div className="text-neutral-600 mt-1">
                  <span className="font-bold text-neutral-900">{getTotalCount('Receipt')}</span> operations
                </div>
              </div>

            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Primary destination: <strong className="text-neutral-800">WH/Stock1</strong></span>
            <button
              onClick={() => onNavigate('operations-receipts', { createNew: true })}
              className="text-rose-900 font-bold hover:underline"
            >
              + Create New Receipt
            </button>
          </div>
        </div>

        {/* ================= RIGHT PANEL: DELIVERY ================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-rose-900 shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
                  <ArrowUpFromLine className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-neutral-900">Delivery</h2>
              </div>
              <span className="text-xs text-neutral-500 uppercase font-semibold">Outgoing Stock</span>
            </div>

            {/* Content inside panel matching Image 6: "[4 to Deliver] | 1 Late | 2 waiting | 6 operations" */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              {/* Clickable button/stat box */}
              <button
                onClick={() => onNavigate('operations-delivery')}
                className="w-full sm:w-auto px-6 py-4 bg-rose-900 hover:bg-rose-950 active:scale-95 text-white font-extrabold text-lg rounded-2xl shadow-md border-2 border-rose-950 transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>{pendingDeliveriesCount} to Deliver</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Stats on the right */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 text-sm font-semibold">
                <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                  <Clock className="w-4 h-4" />
                  <span>{getLateCount('Delivery')} Late</span>
                </div>
                <div className="text-amber-800 text-xs bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 mt-1">
                  {getWaitingCount('Delivery')} waiting
                </div>
                <div className="text-neutral-600 mt-0.5">
                  <span className="font-bold text-neutral-900">{getTotalCount('Delivery')}</span> operations
                </div>
              </div>

            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Primary source: <strong className="text-neutral-800">WH/Stock1</strong></span>
            <button
              onClick={() => onNavigate('operations-delivery', { createNew: true })}
              className="text-rose-900 font-bold hover:underline"
            >
              + Create New Delivery
            </button>
          </div>
        </div>

      </div>

      {/* DYNAMIC FILTERS & RECENT OPERATIONS LIST */}
      <div className="bg-white rounded-3xl p-6 border-2 border-rose-200/90 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-rose-900" />
            <h3 className="font-extrabold text-neutral-900 text-base">Dynamic Operations Filter</h3>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-800"
            />
          </div>
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          {/* Document Type */}
          <div>
            <label className="block text-neutral-500 font-bold mb-1">Document Type</label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-800"
            >
              <option value="all">All Document Types</option>
              <option value="Receipt">Receipts</option>
              <option value="Delivery">Deliveries</option>
              <option value="Transfer">Internal Transfers</option>
              <option value="Adjustment">Stock Adjustments</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-neutral-500 font-bold mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-800"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Waiting">Waiting</option>
              <option value="Ready">Ready</option>
              <option value="Done">Done</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>

          {/* Warehouse */}
          <div>
            <label className="block text-neutral-500 font-bold mb-1">Warehouse / Location</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-800"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name} ({wh.shortCode})</option>
              ))}
            </select>
          </div>

          {/* Product Category */}
          <div>
            <label className="block text-neutral-500 font-bold mb-1">Product Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-800"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Filtered Operations Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-neutral-200 text-neutral-600 font-black uppercase tracking-wider">
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">From</th>
                <th className="py-2.5 px-3">To</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Scheduled</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    No operations found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOperations.slice(0, 10).map((op) => (
                  <tr 
                    key={op.id}
                    onClick={() => onOpenOperation(op.id)}
                    className="hover:bg-rose-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 font-bold text-rose-900 font-mono">
                      {op.reference}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-800">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        op.type === 'Receipt' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        op.type === 'Delivery' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                        op.type === 'Transfer' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {op.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-700 font-medium">
                      {op.fromLocationName || op.fromLocationId}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-700 font-medium">
                      {op.toLocationName || op.toLocationId}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-800 font-medium">
                      {op.contact || 'Azure Interior'}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 font-mono">
                      {op.scheduleDate}
                    </td>
                    <td className="py-2.5 px-3">
                      {getStatusBadge(op.status)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-xs font-bold text-rose-900 group-hover:underline">
                        Open &rarr;
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
