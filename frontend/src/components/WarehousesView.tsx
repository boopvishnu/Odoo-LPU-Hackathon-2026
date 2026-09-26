import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Warehouse } from '../types';
import { Building2, Plus, Edit3, MapPin, CheckCircle2 } from 'lucide-react';

export const WarehousesView: React.FC = () => {
  const { warehouses, addWarehouse, updateWarehouse } = useInventory();

  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [address, setAddress] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortCode.trim()) return;

    if (editingId) {
      await updateWarehouse(editingId, {
        name: name.trim(),
        shortCode: shortCode.trim().toUpperCase(),
        address: address.trim()
      });
      setSuccessMsg('Warehouse updated successfully!');
      setEditingId(null);
    } else {
      await addWarehouse({
        name: name.trim(),
        shortCode: shortCode.trim().toUpperCase(),
        address: address.trim()
      });
      setSuccessMsg('Warehouse created successfully!');
    }

    setName('');
    setShortCode('');
    setAddress('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEdit = (wh: Warehouse) => {
    setEditingId(wh.id);
    setName(wh.name);
    setShortCode(wh.shortCode);
    setAddress(wh.address);
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setShortCode('');
    setAddress('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Wireframe Container matching Image 5 */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-rose-900 shadow-md space-y-6">
        
        {/* Title matching Image 5: "Warehouse" */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-rose-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-900 rounded-xl border border-rose-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-rose-950 tracking-tight">Warehouse</h1>
              <p className="text-xs text-neutral-500 font-medium">Configure storage warehouses and primary shipping hubs</p>
            </div>
          </div>
          <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
            {warehouses.length} Active Hubs
          </span>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Wireframe Form matching Image 5: Name, Short Code, Address */}
        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-300">
          <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider mb-4">
            {editingId ? 'Edit Warehouse' : 'New Warehouse Setup'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Name:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Central Warehouse"
                required
                className="w-full px-4 py-2 bg-white border-b-2 border-rose-400 focus:border-rose-900 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
              />
            </div>

            {/* Short Code */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Short Code:
              </label>
              <input
                type="text"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                placeholder="e.g. WH or BLR"
                required
                maxLength={6}
                className="w-48 px-4 py-2 font-mono uppercase bg-white border-b-2 border-rose-400 focus:border-rose-900 text-sm font-bold text-neutral-900 rounded-t-lg focus:outline-hidden"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Address:
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Plot C-12, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093"
                rows={2}
                required
                className="w-full px-4 py-2 bg-white border-b-2 border-rose-400 focus:border-rose-900 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {editingId ? 'Update Warehouse' : 'Save Warehouse'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 font-semibold text-xs rounded-xl hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Warehouses List */}
        <div className="pt-4">
          <h3 className="text-base font-black text-neutral-900 mb-3">Registered Warehouses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses.map((wh) => (
              <div 
                key={wh.id}
                className="bg-white p-5 rounded-2xl border-2 border-rose-200 hover:border-rose-800 transition-all flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-neutral-900 text-base">{wh.name}</span>
                    <span className="font-mono text-xs font-black bg-rose-900 text-white px-2 py-0.5 rounded">
                      {wh.shortCode}
                    </span>
                  </div>
                  <div className="mt-2.5 text-xs text-neutral-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                    <span>{wh.address}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-end">
                  <button
                    onClick={() => handleEdit(wh)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-900 hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
