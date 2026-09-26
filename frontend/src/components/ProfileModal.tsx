import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { User as UserIcon, X, Check, ShieldCheck, Mail, Key } from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'Inventory Manager');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: name.trim(),
      email: email.trim(),
      role: role,
      avatarLetter: (name[0] || 'A').toUpperCase()
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-rose-900 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 font-bold text-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-rose-100">
          <div className="w-12 h-12 rounded-full bg-rose-900 text-amber-200 font-black text-xl flex items-center justify-center shadow-sm">
            {user?.avatarLetter || 'A'}
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-900">My Profile</h2>
            <p className="text-xs text-neutral-500 font-mono">User ID: {user?.loginId}</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Profile settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
              System Role & Access
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
            >
              <option value="Inventory Manager">Inventory Manager (Approvals, Receipts & Deliveries)</option>
              <option value="Warehouse Staff">Warehouse Staff (Picking, Transfers, Shelving)</option>
              <option value="Admin">Administrator (All Warehouse Permissions)</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-neutral-100">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
            >
              Sign Out
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl text-xs font-semibold hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
