import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types';
import { 
  Plus, 
  Search, 
  List, 
  LayoutGrid, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Check, 
  SlidersHorizontal,
  IndianRupee,
  Package
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, updateProductStockDirect } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('Office Furniture');
  const [formUom, setFormUom] = useState<Product['unitOfMeasure']>('pcs');
  const [formCost, setFormCost] = useState(3000);
  const [formStock, setFormStock] = useState(50);
  const [formMinThreshold, setFormMinThreshold] = useState(10);

  // Direct stock update modal/popover (Image 2 note: "User must be able to update the stock from here")
  const [stockUpdateTarget, setStockUpdateTarget] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [stockUpdateReason, setStockUpdateReason] = useState<string>('Inventory Stock Count');

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku(`PRD${String(products.length + 1).padStart(3, '0')}`);
    setFormCategory('Office Furniture');
    setFormUom('pcs');
    setFormCost(3000);
    setFormStock(20);
    setFormMinThreshold(10);
    setShowProductModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.category);
    setFormUom(p.unitOfMeasure);
    setFormCost(p.perUnitCost);
    setFormStock(p.onHandQty);
    setFormMinThreshold(p.minThreshold || 10);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) return;

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: formName.trim(),
        sku: formSku.trim(),
        category: formCategory,
        unitOfMeasure: formUom,
        perUnitCost: Number(formCost),
        onHandQty: Number(formStock),
        freeToUseQty: Number(formStock),
        minThreshold: Number(formMinThreshold)
      });
    } else {
      await addProduct({
        name: formName.trim(),
        sku: formSku.trim(),
        category: formCategory,
        unitOfMeasure: formUom,
        perUnitCost: Number(formCost),
        onHandQty: Number(formStock),
        freeToUseQty: Number(formStock),
        minThreshold: Number(formMinThreshold)
      });
    }

    setShowProductModal(false);
  };

  const handleOpenDirectStock = (p: Product) => {
    setStockUpdateTarget(p);
    setNewStockValue(p.onHandQty);
    setStockUpdateReason('Physical shelf count revision');
  };

  const handleSaveDirectStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockUpdateTarget) return;
    await updateProductStockDirect(stockUpdateTarget.id, Number(newStockValue), stockUpdateReason);
    setStockUpdateTarget(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Wireframe styled bar matching Image 2 */}
      <div className="bg-white rounded-3xl p-6 border-2 border-rose-900 shadow-md space-y-4">
        
        {/* Title row: [NEW] button, "Stock" title, Search and View toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-rose-100">
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white font-extrabold text-sm rounded-xl border border-rose-950 shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>NEW</span>
            </button>

            {/* Title matching Image 2: "Stock" */}
            <h1 className="text-2xl font-black text-rose-950 tracking-tight">
              Stock
            </h1>
            <span className="text-xs text-neutral-500 font-medium hidden sm:inline">
              ({filteredProducts.length} items)
            </span>
          </div>

          {/* Search bar and List/Grid icons from Image 2 */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Product / SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 w-48 sm:w-64 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
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

        {/* Note from Image 2 highlighted for users */}
        <div className="bg-amber-50/80 border border-amber-200 text-amber-900 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between">
          <span className="font-semibold italic">
            &ldquo;User must be able to update the stock from here.&rdquo;
          </span>
          <span className="text-[11px] text-amber-800">
            Click <strong>Update Stock</strong> on any row to immediately reconcile inventory.
          </span>
        </div>

        {/* LIST VIEW (Exact table from Image 2) */}
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-neutral-200 text-neutral-600 font-bold uppercase text-xs tracking-wider">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">per unit cost</th>
                  <th className="py-3 px-4 text-center">On hand</th>
                  <th className="py-3 px-4 text-center">Free to Use</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500 text-sm">
                      No stock items found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLowStock = p.onHandQty <= (p.minThreshold || 10);
                    return (
                      <tr key={p.id} className="hover:bg-rose-50/40 transition-colors">
                        
                        {/* Product Name */}
                        <td className="py-3.5 px-4 font-bold text-neutral-900">
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            {isLowStock && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                Low
                              </span>
                            )}
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3.5 px-4 font-mono text-xs text-neutral-600 font-semibold">
                          [{p.sku}]
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 text-xs text-neutral-600">
                          <span className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-700 font-medium">
                            {p.category}
                          </span>
                        </td>

                        {/* per unit cost matching Image 2 format (e.g. 3000 Rs) */}
                        <td className="py-3.5 px-4 font-semibold text-neutral-800">
                          {p.perUnitCost.toLocaleString('en-IN')} Rs
                        </td>

                        {/* On hand */}
                        <td className="py-3.5 px-4 text-center font-bold text-neutral-900">
                          <span className={`px-2.5 py-1 rounded-lg ${isLowStock ? 'bg-red-50 text-red-700 font-black border border-red-200' : 'bg-neutral-100'}`}>
                            {p.onHandQty} {p.unitOfMeasure}
                          </span>
                        </td>

                        {/* Free to Use */}
                        <td className="py-3.5 px-4 text-center font-semibold text-emerald-800">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                            {p.freeToUseQty} {p.unitOfMeasure}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDirectStock(p)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Update stock from here"
                            >
                              Update Stock
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-neutral-600 hover:text-rose-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                              title="Edit product"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
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
            {filteredProducts.map((p) => {
              const isLowStock = p.onHandQty <= (p.minThreshold || 10);
              return (
                <div key={p.id} className="bg-neutral-50 rounded-2xl p-4 border border-rose-200 hover:border-rose-800 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-neutral-900 text-base">{p.name}</h3>
                        <p className="font-mono text-xs text-neutral-500 font-semibold">[{p.sku}]</p>
                      </div>
                      <span className="text-xs bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-200">
                        {p.category}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-xl border border-neutral-200">
                        <span className="text-neutral-500 block text-[10px] uppercase font-bold">Per Unit Cost</span>
                        <span className="font-bold text-neutral-900 text-sm">{p.perUnitCost.toLocaleString('en-IN')} Rs</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-neutral-200">
                        <span className="text-neutral-500 block text-[10px] uppercase font-bold">On Hand</span>
                        <span className={`font-bold text-sm ${isLowStock ? 'text-red-700' : 'text-neutral-900'}`}>{p.onHandQty} {p.unitOfMeasure}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700">Free to use: {p.freeToUseQty}</span>
                    <button
                      onClick={() => handleOpenDirectStock(p)}
                      className="px-3 py-1 bg-rose-900 text-white text-xs font-bold rounded-lg hover:bg-rose-950 transition-colors"
                    >
                      Update Stock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ================= PRODUCT CREATE / EDIT MODAL ================= */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border-2 border-rose-900 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowProductModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 text-rose-900 mb-4 pb-2 border-b border-rose-100">
              <Package className="w-6 h-6" />
              <h2 className="text-xl font-black">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h2>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ergonomic Office Desk"
                    required
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    SKU / Code *
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. DSK001"
                    required
                    className="w-full px-3.5 py-2 font-mono bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Office Furniture, Seating..."
                    required
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Unit of Measure
                  </label>
                  <select
                    value={formUom}
                    onChange={(e) => setFormUom(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="box">box (Boxes)</option>
                    <option value="set">set (Sets)</option>
                    <option value="unit">unit (Units)</option>
                    <option value="meter">meter (Meters)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Per-unit Cost (Rs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Initial Stock (Qty)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinThreshold}
                    onChange={(e) => setFormMinThreshold(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl text-xs font-semibold hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DIRECT STOCK UPDATE MODAL (Image 2 note) ================= */}
      {stockUpdateTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border-2 border-rose-900 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setStockUpdateTarget(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 text-rose-900 mb-2">
              <SlidersHorizontal className="w-5 h-5" />
              <h3 className="text-lg font-black">Direct Stock Update</h3>
            </div>
            <p className="text-xs text-neutral-600 mb-4">
              Update recorded stock for <strong>{stockUpdateTarget.name}</strong> [{stockUpdateTarget.sku}]. This automatically logs an adjustment operation in Move History.
            </p>

            <form onSubmit={handleSaveDirectStock} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <div>
                  <span className="text-neutral-500 font-bold block">Current On Hand:</span>
                  <span className="text-base font-black text-neutral-900">{stockUpdateTarget.onHandQty} {stockUpdateTarget.unitOfMeasure}</span>
                </div>
                <div>
                  <span className="text-neutral-500 font-bold block">Difference:</span>
                  <span className={`text-base font-black ${newStockValue - stockUpdateTarget.onHandQty >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {newStockValue - stockUpdateTarget.onHandQty >= 0 ? `+${newStockValue - stockUpdateTarget.onHandQty}` : newStockValue - stockUpdateTarget.onHandQty}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  New Counted On-Hand Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 text-base font-bold bg-white border border-rose-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Reason / Audit Note
                </label>
                <input
                  type="text"
                  value={stockUpdateReason}
                  onChange={(e) => setStockUpdateReason(e.target.value)}
                  placeholder="e.g. Physical inventory check, damaged box replaced"
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStockUpdateTarget(null)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl text-xs font-semibold hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  Confirm & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
