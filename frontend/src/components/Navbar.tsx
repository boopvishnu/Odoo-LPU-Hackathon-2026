import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './AppLogo';
import { 
  ChevronDown, 
  User as UserIcon, 
  LogOut, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight, 
  SlidersHorizontal,
  Building2,
  MapPin,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, subParam?: any) => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenProfile }) => {
  const { user, logout } = useAuth();
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const opsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (opsRef.current && !opsRef.current.contains(e.target as Node)) {
        setOperationsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOpsActive = ['operations-receipts', 'operations-delivery', 'operations-transfers', 'operations-adjustments'].includes(currentTab);
  const isSettingsActive = ['settings-warehouse', 'settings-locations'].includes(currentTab);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-rose-900/20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo & Navigation Links */}
          <div className="flex items-center gap-6 sm:gap-8">
            <button 
              onClick={() => onNavigate('dashboard')} 
              className="text-left focus:outline-hidden hover:opacity-90 transition-opacity"
            >
              <AppLogo size="sm" />
            </button>

            {/* Navigation Menu styled as in mockups */}
            <nav className="flex items-center space-x-1 sm:space-x-3 text-sm font-semibold tracking-wide text-neutral-700">
              
              {/* Dashboard */}
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  currentTab === 'dashboard'
                    ? 'text-rose-900 bg-rose-50 border border-rose-300 font-bold shadow-2xs'
                    : 'hover:text-rose-900 hover:bg-neutral-100'
                }`}
              >
                Dashboard
              </button>

              {/* Operations Dropdown */}
              <div className="relative" ref={opsRef}>
                <button
                  onClick={() => setOperationsOpen(!operationsOpen)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                    isOpsActive
                      ? 'text-rose-900 bg-rose-50 border border-rose-300 font-bold shadow-2xs'
                      : 'hover:text-rose-900 hover:bg-neutral-100'
                  }`}
                >
                  <span>Operations</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${operationsOpen ? 'rotate-180 text-rose-900' : 'text-neutral-500'}`} />
                </button>

                {operationsOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-rose-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        onNavigate('operations-receipts');
                        setOperationsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-neutral-800 hover:bg-rose-50 hover:text-rose-950 font-medium"
                    >
                      <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-semibold">Receipts</div>
                        <div className="text-[11px] text-neutral-500">Incoming stock from vendor</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('operations-delivery');
                        setOperationsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-neutral-800 hover:bg-rose-50 hover:text-rose-950 font-medium"
                    >
                      <ArrowUpFromLine className="w-4 h-4 text-rose-600" />
                      <div>
                        <div className="font-semibold">Delivery Orders</div>
                        <div className="text-[11px] text-neutral-500">Outgoing customer dispatch</div>
                      </div>
                    </button>

                    <div className="my-1 border-t border-neutral-100"></div>

                    <button
                      onClick={() => {
                        onNavigate('operations-transfers');
                        setOperationsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-neutral-800 hover:bg-rose-50 hover:text-rose-950 font-medium"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-semibold">Internal Transfers</div>
                        <div className="text-[11px] text-neutral-500">Between warehouse locations</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('operations-adjustments');
                        setOperationsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-neutral-800 hover:bg-rose-50 hover:text-rose-950 font-medium"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-semibold">Stock Adjustments</div>
                        <div className="text-[11px] text-neutral-500">Physical count reconciliation</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Products (Stock in wireframe) */}
              <button
                onClick={() => onNavigate('products')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  currentTab === 'products'
                    ? 'text-rose-900 bg-rose-50 border border-rose-300 font-bold shadow-2xs'
                    : 'hover:text-rose-900 hover:bg-neutral-100'
                }`}
              >
                Products
              </button>

              {/* Move History */}
              <button
                onClick={() => onNavigate('move-history')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  currentTab === 'move-history'
                    ? 'text-rose-900 bg-rose-50 border border-rose-300 font-bold shadow-2xs'
                    : 'hover:text-rose-900 hover:bg-neutral-100'
                }`}
              >
                Move History
              </button>

              {/* Settings Dropdown */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                    isSettingsActive
                      ? 'text-rose-900 bg-rose-50 border border-rose-300 font-bold shadow-2xs'
                      : 'hover:text-rose-900 hover:bg-neutral-100'
                  }`}
                >
                  <span>Settings</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${settingsOpen ? 'rotate-180 text-rose-900' : 'text-neutral-500'}`} />
                </button>

                {settingsOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-rose-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        onNavigate('settings-warehouse');
                        setSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-neutral-800 hover:bg-rose-50 hover:text-rose-950 font-medium"
                    >
                      <Building2 className="w-4 h-4 text-neutral-600" />
                      <span>Warehouse</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('settings-locations');
                        setSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-neutral-800 hover:bg-rose-50 hover:text-rose-950 font-medium"
                    >
                      <MapPin className="w-4 h-4 text-neutral-600" />
                      <span>Locations</span>
                    </button>
                  </div>
                )}
              </div>

            </nav>
          </div>

          {/* Right: Circular profile icon "[A]" as depicted in the mockups */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-neutral-900">{user?.name || 'Aman Shaikh'}</span>
              <span className="text-[10px] text-neutral-500 flex items-center justify-end gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {user?.role || 'Inventory Manager'}
              </span>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-rose-900 text-amber-200 font-bold text-sm flex items-center justify-center border-2 border-rose-950/40 shadow-xs hover:bg-rose-800 focus:outline-hidden transition-transform active:scale-95"
                title="User Profile & Settings"
                aria-label="User Profile"
              >
                {user?.avatarLetter || 'A'}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-rose-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-xs text-neutral-500">Signed in as</p>
                    <p className="text-sm font-semibold text-neutral-900 truncate">{user?.email || 'aman.shaikh@stocksense.in'}</p>
                    <p className="text-[11px] text-rose-800 font-medium mt-0.5">{user?.role || 'Inventory Manager'}</p>
                  </div>

                  <button
                    onClick={() => {
                      onOpenProfile();
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-neutral-700 hover:bg-rose-50 hover:text-rose-900 font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-neutral-500" />
                    <span>My Profile</span>
                  </button>

                  <div className="my-1 border-t border-neutral-100"></div>

                  <button
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
