/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { Dashboard } from './components/Dashboard';
import { ProductsView } from './components/ProductsView';
import { OperationsList } from './components/OperationsList';
import { OperationDetail } from './components/OperationDetail';
import { MoveHistoryView } from './components/MoveHistoryView';
import { WarehousesView } from './components/WarehousesView';
import { LocationsView } from './components/LocationsView';
import { ProfileModal } from './components/ProfileModal';
import { PrintDocumentModal } from './components/PrintDocumentModal';
import { Operation, OperationType } from './types';

function MainApp() {
  const { isAuthenticated } = useAuth();
  const { products } = useInventory();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeOperationId, setActiveOperationId] = useState<string | undefined>(undefined);
  const [activeOperationDefaultType, setActiveOperationDefaultType] = useState<OperationType>('Receipt');

  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [printDoc, setPrintDoc] = useState<Operation | null>(null);

  // If not logged in, show Image 3 Login / Signup view
  if (!isAuthenticated) {
    return <AuthView />;
  }

  const handleNavigate = (tab: string, param?: any) => {
    if (tab === 'operations-receipts' && param?.createNew) {
      setActiveOperationId(undefined);
      setActiveOperationDefaultType('Receipt');
      setCurrentTab('operation-detail');
      return;
    }
    if (tab === 'operations-delivery' && param?.createNew) {
      setActiveOperationId(undefined);
      setActiveOperationDefaultType('Delivery');
      setCurrentTab('operation-detail');
      return;
    }
    setCurrentTab(tab);
  };

  const handleOpenOperation = (opId?: string, fallbackType: OperationType = 'Receipt') => {
    setActiveOperationId(opId);
    setActiveOperationDefaultType(fallbackType);
    setCurrentTab('operation-detail');
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-neutral-900 font-sans selection:bg-rose-900 selection:text-white pb-12">
      
      {/* Top Global Navigation matching wireframe header in all mock images */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main className="mt-2">
        {currentTab === 'dashboard' && (
          <Dashboard 
            onNavigate={handleNavigate}
            onOpenOperation={(id) => handleOpenOperation(id)}
          />
        )}

        {currentTab === 'products' && (
          <ProductsView />
        )}

        {currentTab === 'operations-receipts' && (
          <OperationsList 
            type="Receipt"
            onOpenOperation={(id) => handleOpenOperation(id, 'Receipt')}
          />
        )}

        {currentTab === 'operations-delivery' && (
          <OperationsList 
            type="Delivery"
            onOpenOperation={(id) => handleOpenOperation(id, 'Delivery')}
          />
        )}

        {currentTab === 'operations-transfers' && (
          <OperationsList 
            type="Transfer"
            onOpenOperation={(id) => handleOpenOperation(id, 'Transfer')}
          />
        )}

        {currentTab === 'operations-adjustments' && (
          <OperationsList 
            type="Adjustment"
            onOpenOperation={(id) => handleOpenOperation(id, 'Adjustment')}
          />
        )}

        {currentTab === 'operation-detail' && (
          <OperationDetail
            operationId={activeOperationId}
            defaultType={activeOperationDefaultType}
            onBack={() => {
              if (activeOperationDefaultType === 'Receipt') setCurrentTab('operations-receipts');
              else if (activeOperationDefaultType === 'Delivery') setCurrentTab('operations-delivery');
              else if (activeOperationDefaultType === 'Transfer') setCurrentTab('operations-transfers');
              else setCurrentTab('operations-adjustments');
            }}
            onPrint={(op) => setPrintDoc(op)}
          />
        )}

        {currentTab === 'move-history' && (
          <MoveHistoryView onNavigate={handleNavigate} />
        )}

        {currentTab === 'settings-warehouse' && (
          <WarehousesView />
        )}

        {currentTab === 'settings-locations' && (
          <LocationsView />
        )}
      </main>

      {/* Profile Modal */}
      {isProfileOpen && (
        <ProfileModal onClose={() => setIsProfileOpen(false)} />
      )}

      {/* Print Document Modal (GRN / Delivery Challan) */}
      {printDoc && (
        <PrintDocumentModal
          operation={printDoc}
          products={products}
          onClose={() => setPrintDoc(null)}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <MainApp />
      </InventoryProvider>
    </AuthProvider>
  );
}
