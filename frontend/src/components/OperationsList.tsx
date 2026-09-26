import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Operation, OperationStatus, OperationType } from '../types';
import { 
  Plus, 
  Search, 
  List, 
  LayoutGrid, 
  Filter, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight, 
  SlidersHorizontal,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface OperationsListProps {
  type: OperationType;
  onOpenOperation: (id?: string) => void;
}

export const OperationsList: React.FC<OperationsListProps> = ({ type, onOpenOperation }) => {
  const { operations } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Display title matching mockups (Image 1 says "Reciepts", Image 8 says "Delivery")
  const getTitles = () => {
    switch (type) {
      case 'Receipt':
        return {
          title: 'Reciepts', // matching wireframe spelling from Image 1
          subtitle: 'Incoming stock from vendors to warehouse locations',
          icon: <ArrowDownToLine className="w-5 h-5 text-emerald-600" />,
          fromHeader: 'From',
          toHeader: 'To',
          newButtonText: 'NEW'
        };
      case 'Delivery':
        return {
          title: 'Delivery', // matching Image 8
          subtitle: 'Outgoing stock to customers or partner branches',
          icon: <ArrowUpFromLine className="w-5 h-5 text-rose-600" />,
          fromHeader: 'From',
          toHeader: 'To',
          newButtonText: 'NEW'
        };
      case 'Transfer':
        return {
          title: 'Internal Transfers',
          subtitle: 'Inter-warehouse and intra-location relocations',
          icon: <ArrowLeftRight className="w-5 h-5 text-blue-600" />,
          fromHeader: 'From Location',
          toHeader: 'To Location',
          newButtonText: 'NEW'
        };
      case 'Adjustment':
        return {
          title: 'Stock Adjustments',
          subtitle: 'Physical inventory audit and variance reconciliations',
          icon: <SlidersHorizontal className="w-5 h-5 text-amber-600" />,
          fromHeader: 'Location',
          toHeader: 'Product',
          newButtonText: 'NEW'
        };
    }
  };

  const meta = getTitles();

  const filteredOps = operations.filter((op) => {
    if (op.type !== type) return false;
    if (statusFilter !== 'all' && op.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchRef = op.reference.toLowerCase().includes(term);
      const matchContact = (op.contact || '').toLowerCase().includes(term);
      const matchFrom = (op.fromLocationName || op.fromLocationId).toLowerCase().includes(term);
      const matchTo = (op.toLocationName || op.toLocationId).toLowerCase().includes(term);
      const matchResp = (op.responsible || '').toLowerCase().includes(term);
      return matchRef || matchContact || matchFrom || matchTo || matchResp;
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
      
      {/* Wireframe Container matching Image 1 & Image 8 */}
      <div className="bg-white rounded-3xl p-6 border-2 border-rose-900 shadow-md space-y-4">
        
        {/* Top Header Row: [NEW] button, Title, Search and Tool Icons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-rose-100">
          
          <div className="flex items-center gap-4">
            {/* [NEW] Button as styled in mockups */}
            <button
              onClick={() => onOpenOperation(undefined)}
              className="px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white font-extrabold text-sm rounded-xl border border-rose-950 shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{meta.newButtonText}</span>
            </button>

            {/* Title from mockups */}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-rose-950 tracking-tight">
                {meta.title}
              </h1>
              <span className="text-xs text-neutral-500 font-medium">
                ({filteredOps.length} orders)
              </span>
            </div>
          </div>

          {/* Search bar, List/Grid icons, Filter as shown in Image 1 & Image 8 */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reference, contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 w-48 sm:w-64 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Waiting">Waiting</option>
              <option value="Ready">Ready</option>
              <option value="Done">Done</option>
              <option value="Canceled">Canceled</option>
            </select>

            {/* Icons from mockup (search, list, grid) */}
            <div className="flex items-center border border-neutral-300 rounded-xl p-0.5 bg-neutral-50">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-xs text-rose-900' : 'text-neutral-500 hover:text-neutral-800'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-xs text-rose-900' : 'text-neutral-500 hover:text-neutral-800'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* LIST VIEW (Table Columns matching Image 1: Reference | From | To | Contact | Schedule date | Status) */}
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-neutral-200 text-neutral-600 font-bold uppercase text-xs tracking-wider">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">{meta.fromHeader}</th>
                  <th className="py-3 px-4">{meta.toHeader}</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Schedule date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500 text-sm">
                      No {meta.title.toLowerCase()} found. Click <strong>NEW</strong> to create one!
                    </td>
                  </tr>
                ) : (
                  filteredOps.map((op) => (
                    <tr
                      key={op.id}
                      onClick={() => onOpenOperation(op.id)}
                      className="hover:bg-rose-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Reference (e.g. WH/IN/0001 or WH/OUT/0001) */}
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-900 group-hover:underline">
                        {op.reference}
                      </td>

                      {/* From */}
                      <td className="py-3.5 px-4 text-neutral-800 font-medium">
                        {op.fromLocationName || op.fromLocationId}
                      </td>

                      {/* To */}
                      <td className="py-3.5 px-4 text-neutral-800 font-medium">
                        {op.toLocationName || op.toLocationId}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-neutral-900 font-semibold">
                        {op.contact || 'Azure Interior'}
                      </td>

                      {/* Schedule date */}
                      <td className="py-3.5 px-4 text-neutral-600 font-mono text-xs">
                        {op.scheduleDate}
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(op.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center text-xs font-bold text-rose-900 group-hover:translate-x-0.5 transition-transform">
                          View &rarr;
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {filteredOps.map((op) => (
              <div
                key={op.id}
                onClick={() => onOpenOperation(op.id)}
                className="bg-neutral-50 rounded-2xl p-4 border border-rose-200 hover:border-rose-900 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-rose-900">{op.reference}</span>
                    {getStatusBadge(op.status)}
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="text-neutral-700">
                      <span className="text-neutral-500 font-medium">Contact:</span> <strong>{op.contact || 'Azure Interior'}</strong>
                    </div>
                    <div className="text-neutral-700">
                      <span className="text-neutral-500 font-medium">Route:</span> {op.fromLocationName || op.fromLocationId} &rarr; {op.toLocationName || op.toLocationId}
                    </div>
                    <div className="text-neutral-500 font-mono">
                      Scheduled: {op.scheduleDate}
                    </div>
                  </div>

                  {/* Lines preview */}
                  <div className="mt-3 pt-2 border-t border-neutral-200 text-xs">
                    <span className="font-bold text-neutral-700">Products ({op.lines.length}):</span>
                    <ul className="mt-1 space-y-0.5 text-neutral-600 text-[11px]">
                      {op.lines.slice(0, 2).map((l, idx) => (
                        <li key={idx} className="truncate">
                          &bull; {l.productName || l.productId} &times; {l.quantity}
                        </li>
                      ))}
                      {op.lines.length > 2 && <li className="text-neutral-400">+{op.lines.length - 2} more</li>}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-neutral-200 flex justify-end">
                  <span className="text-xs font-bold text-rose-900">Open Detail &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
