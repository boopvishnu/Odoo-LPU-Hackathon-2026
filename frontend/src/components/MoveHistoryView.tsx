import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { MoveHistoryEntry } from '../types';
import { 
  History, 
  Search, 
  List, 
  LayoutGrid, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight,
  Plus,
  Calendar
} from 'lucide-react';

interface MoveHistoryViewProps {
  onNavigate: (tab: string, subParam?: any) => void;
}

export const MoveHistoryView: React.FC<MoveHistoryViewProps> = ({ onNavigate }) => {
  const { moveHistory } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'in' | 'out' | 'internal'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredHistory = moveHistory.filter((entry) => {
    if (directionFilter !== 'all' && entry.direction !== directionFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchRef = entry.reference.toLowerCase().includes(term);
      const matchContact = (entry.contact || '').toLowerCase().includes(term);
      const matchFrom = entry.fromLocation.toLowerCase().includes(term);
      const matchTo = entry.toLocation.toLowerCase().includes(term);
      const matchProd = entry.productName.toLowerCase().includes(term) || entry.productSku.toLowerCase().includes(term);
      return matchRef || matchContact || matchFrom || matchTo || matchProd;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Wireframe Container matching Image 7 */}
      <div className="bg-white rounded-3xl p-6 border-2 border-rose-900 shadow-md space-y-4">
        
        {/* Top Header Row matching Image 7: [NEW] button, "Move History" title, Search and Icons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-rose-100">
          
          <div className="flex items-center gap-4">
            {/* [NEW] Button from Image 7 */}
            <button
              onClick={() => onNavigate('operations-receipts', { createNew: true })}
              className="px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white font-extrabold text-sm rounded-xl border border-rose-950 shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>NEW</span>
            </button>

            {/* Title matching Image 7: "Move History" */}
            <h1 className="text-2xl font-black text-rose-950 tracking-tight">
              Move History
            </h1>
            <span className="text-xs text-neutral-500 font-medium hidden sm:inline">
              ({filteredHistory.length} ledger movements)
            </span>
          </div>

          {/* Search bar and Tool icons from Image 7 */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reference, contact, product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 w-48 sm:w-64 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
              />
            </div>

            {/* Direction Filter */}
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as any)}
              className="py-1.5 px-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
            >
              <option value="all">All Movements</option>
              <option value="in">Incoming (Green)</option>
              <option value="out">Outgoing (Red)</option>
              <option value="internal">Internal (Blue)</option>
            </select>

            {/* Toggle view buttons */}
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

        {/* Notes from Image 7 wireframe displayed prominently */}
        <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-neutral-700">Ledger Legend:</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Incoming moves (Green)
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Outgoing moves (Red)
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Internal moves (Blue)
            </span>
          </div>
          <span className="text-neutral-500 italic text-[11px]">
            &ldquo;Single reference with multiple products displayed in multiple rows&rdquo;
          </span>
        </div>

        {/* LIST VIEW (Table Columns matching Image 7: Reference | Date | Contact | From | To | Quantity | Status) */}
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-neutral-200 text-neutral-600 font-bold uppercase text-xs tracking-wider">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500 text-sm">
                      No stock movement history recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((row) => {
                    // Color coding rule from Image 7:
                    // "In event should be display in green"
                    // "Out moves should be display in red"
                    const isIncoming = row.direction === 'in';
                    const isOutgoing = row.direction === 'out';
                    const isInternal = row.direction === 'internal';

                    const rowBgClass = isIncoming 
                      ? 'text-emerald-800 hover:bg-emerald-50/50' 
                      : isOutgoing 
                      ? 'text-red-800 hover:bg-red-50/50' 
                      : 'text-blue-900 hover:bg-blue-50/50';

                    return (
                      <tr 
                        key={row.id} 
                        className={`transition-colors font-medium ${rowBgClass}`}
                      >
                        {/* Reference (e.g. WH/IN/0001 or WH/OUT/0002) */}
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <div className="flex items-center gap-1.5">
                            {isIncoming && <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            {isOutgoing && <ArrowUpRight className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                            {isInternal && <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            <span>{row.reference}</span>
                          </div>
                        </td>

                        {/* Date (e.g. 12/1/2001 or YYYY-MM-DD) */}
                        <td className="py-3.5 px-4 font-mono text-xs text-neutral-600">
                          {row.date}
                        </td>

                        {/* Contact (Azure Interior in mockup) */}
                        <td className="py-3.5 px-4 font-semibold text-neutral-900">
                          {row.contact || 'Azure Interior'}
                        </td>

                        {/* Product Name & SKU */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-neutral-900">{row.productName}</span>{' '}
                          <span className="font-mono text-xs text-neutral-500">[{row.productSku}]</span>
                        </td>

                        {/* From */}
                        <td className="py-3.5 px-4 text-xs font-semibold">
                          <span className="bg-white/80 px-2 py-0.5 rounded border border-neutral-200">
                            {row.fromLocation}
                          </span>
                        </td>

                        {/* To */}
                        <td className="py-3.5 px-4 text-xs font-semibold">
                          <span className="bg-white/80 px-2 py-0.5 rounded border border-neutral-200">
                            {row.toLocation}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td className="py-3.5 px-4 text-center font-black font-mono text-sm">
                          <span className={`px-2 py-0.5 rounded ${
                            isIncoming 
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                              : isOutgoing 
                              ? 'bg-red-100 text-red-900 border border-red-300' 
                              : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}>
                            {isIncoming ? `+${row.quantity}` : isOutgoing ? `-${row.quantity}` : row.quantity}
                          </span>
                        </td>

                        {/* Status (Ready / Done) */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {filteredHistory.map((row) => (
              <div
                key={row.id}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  row.direction === 'in'
                    ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950'
                    : row.direction === 'out'
                    ? 'border-red-300 bg-red-50/40 text-red-950'
                    : 'border-blue-300 bg-blue-50/40 text-blue-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm">{row.reference}</span>
                  <span className="text-xs font-mono text-neutral-500">{row.date}</span>
                </div>

                <div className="mt-2 text-sm font-bold">
                  {row.productName} <span className="font-mono text-xs font-normal">[{row.productSku}]</span>
                </div>

                <div className="mt-2 text-xs space-y-1 text-neutral-700">
                  <div><strong>Contact:</strong> {row.contact}</div>
                  <div><strong>Route:</strong> {row.fromLocation} &rarr; {row.toLocation}</div>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">{row.direction} move</span>
                  <span className="font-mono font-black text-base">
                    {row.direction === 'in' ? `+${row.quantity}` : row.direction === 'out' ? `-${row.quantity}` : row.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
