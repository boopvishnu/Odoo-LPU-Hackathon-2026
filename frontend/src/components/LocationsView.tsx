import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Location } from '../types';
import { MapPin, Plus, Edit3, CheckCircle2 } from 'lucide-react';

export const LocationsView: React.FC = () => {
  const { locations, warehouses, addLocation, updateLocation } = useInventory();

  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortCode.trim()) return;

    if (editingId) {
      await updateLocation(editingId, {
        name: name.trim(),
        shortCode: shortCode.trim(),
        warehouseId
      });
      setSuccessMsg('Location updated successfully!');
      setEditingId(null);
    } else {
      await addLocation({
        name: name.trim(),
        shortCode: shortCode.trim(),
        warehouseId
      });
      setSuccessMsg('Location created successfully!');
    }

    setName('');
    setShortCode('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEdit = (loc: Location) => {
    setEditingId(loc.id);
    setName(loc.name);
    setShortCode(loc.shortCode);
    setWarehouseId(loc.warehouseId);
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setShortCode('');
  };

  const selectedWh = warehouses.find((w) => w.id === warehouseId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Wireframe Container matching Image 4 */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-rose-900 shadow-md space-y-6">
        
        {/* Title matching Image 4: "location" */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-rose-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-900 rounded-xl border border-rose-200">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-rose-950 tracking-tight lowercase">location</h1>
              <p className="text-xs text-neutral-500 font-medium">Sub-zones, racks, shelving & dispatch bays</p>
            </div>
          </div>
          <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
            {locations.length} Sub-Locations
          </span>
        </div>

        {/* Note from Image 4 */}
        <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-2xl text-xs text-neutral-600 italic">
          &ldquo;This holds the multiple locations of warehouse, rooms etc..&rdquo;
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Wireframe Form matching Image 4: Name, Short Code, warehouse: WH */}
        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-300">
          <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider mb-4">
            {editingId ? 'Edit Location' : 'New Location Registration'}
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
                placeholder="e.g. WH/Stock1 or Rack A-02"
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
                placeholder="e.g. Stock1"
                required
                className="w-48 px-4 py-2 bg-white border-b-2 border-rose-400 focus:border-rose-900 text-sm font-bold text-neutral-900 rounded-t-lg focus:outline-hidden font-mono"
              />
            </div>

            {/* warehouse: WH matching Image 4 */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                warehouse: {selectedWh ? selectedWh.shortCode : 'WH'}
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full sm:w-72 px-4 py-2 bg-white border-b-2 border-rose-400 focus:border-rose-900 text-sm font-semibold text-neutral-900 rounded-t-lg focus:outline-hidden"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.shortCode} — {wh.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {editingId ? 'Update Location' : 'Save Location'}
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

        {/* Existing Locations Table */}
        <div className="pt-4">
          <h3 className="text-base font-black text-neutral-900 mb-3">Warehouse Locations Directory</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Location Name</th>
                  <th className="py-2.5 px-3">Short Code</th>
                  <th className="py-2.5 px-3">Parent Warehouse</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {locations.map((loc) => {
                  const wh = warehouses.find((w) => w.id === loc.warehouseId);
                  return (
                    <tr key={loc.id} className="hover:bg-neutral-50/70">
                      <td className="py-3 px-3 font-bold text-neutral-900 font-mono text-sm">
                        {loc.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-600">
                        {loc.shortCode}
                      </td>
                      <td className="py-3 px-3 font-semibold text-neutral-800">
                        <span className="bg-rose-50 text-rose-900 px-2 py-0.5 rounded border border-rose-200 font-bold">
                          {wh?.shortCode || 'WH'}
                        </span>{' '}
                        <span className="text-neutral-600 ml-1">({wh?.name || 'Main Warehouse'})</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleEdit(loc)}
                          className="text-xs font-bold text-rose-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
