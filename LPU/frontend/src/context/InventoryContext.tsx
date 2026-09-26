import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  Warehouse,
  Location,
  Operation,
  OperationType,
  OperationStatus,
  MoveHistoryEntry
} from '../types';

// Your local Express + MySQL backend (node server.js)
const API_BASE = 'http://localhost:5000/api';

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.errors?.[0]?.msg || data.error)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

// ---------- Mappers: DB (snake_case) -> Frontend types (camelCase) ----------
function mapProduct(p: any): Product {
  return {
    id: String(p.id),
    name: p.name,
    sku: p.sku,
    category: p.category,
    unitOfMeasure: p.unit_of_measure,
    perUnitCost: Number(p.per_unit_cost),
    onHandQty: Number(p.on_hand_qty),
    freeToUseQty: Number(p.free_to_use_qty),
    minThreshold: p.min_threshold != null ? Number(p.min_threshold) : undefined,
    locationBreakdown: {}
  };
}

function mapWarehouse(w: any): Warehouse {
  return {
    id: String(w.id),
    name: w.name,
    shortCode: w.short_code,
    address: w.address || ''
  };
}

function mapLocation(l: any): Location {
  return {
    id: String(l.id),
    name: l.name,
    shortCode: l.short_code,
    warehouseId: String(l.warehouse_id),
    warehouseCode: l.warehouse_code
  };
}

function mapOperation(o: any): Operation {
  return {
    id: String(o.id),
    reference: o.reference,
    type: o.type,
    fromLocationId: o.from_location_id != null ? String(o.from_location_id) : (o.from_location_label || 'vendor'),
    fromLocationName: o.from_location_label,
    toLocationId: o.to_location_id != null ? String(o.to_location_id) : (o.to_location_label || 'customer'),
    toLocationName: o.to_location_label,
    contact: o.contact,
    responsible: o.responsible,
    scheduleDate: typeof o.schedule_date === 'string' ? o.schedule_date.slice(0, 10) : o.schedule_date,
    status: o.status,
    lines: (o.lines || []).map((l: any) => ({
      productId: String(l.product_id),
      productName: l.product_name,
      productSku: l.product_sku,
      quantity: Number(l.quantity)
    })),
    operationSubtype: o.operation_subtype,
    notes: o.notes,
    adjustmentRecordedQty: o.adjustment_recorded_qty != null ? Number(o.adjustment_recorded_qty) : undefined,
    adjustmentCountedQty: o.adjustment_counted_qty != null ? Number(o.adjustment_counted_qty) : undefined,
    adjustmentDifference: o.adjustment_difference != null ? Number(o.adjustment_difference) : undefined,
    createdAt: o.created_at
  };
}

function mapMove(m: any): MoveHistoryEntry {
  return {
    id: String(m.id),
    reference: m.reference,
    date: typeof m.move_date === 'string' ? m.move_date.slice(0, 10) : m.move_date,
    contact: m.contact,
    fromLocation: m.from_location,
    toLocation: m.to_location,
    productId: String(m.product_id),
    productName: m.product_name,
    productSku: m.product_sku,
    quantity: Number(m.quantity),
    status: m.status,
    direction: m.direction
  };
}

interface InventoryContextType {
  products: Product[];
  warehouses: Warehouse[];
  locations: Location[];
  operations: Operation[];
  moveHistory: MoveHistoryEntry[];
  loadError: string | null;

  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProductStockDirect: (id: string, newOnHand: number, reason?: string) => Promise<void>;

  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => Promise<void>;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => Promise<void>;

  addLocation: (location: Omit<Location, 'id'>) => Promise<void>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<void>;

  createOperation: (op: Omit<Operation, 'id' | 'reference' | 'createdAt'>) => Promise<Operation>;
  updateOperation: (id: string, updates: Partial<Operation>) => Promise<void>;
  validateOperation: (id: string) => Promise<{ success: boolean; error?: string }>;
  cancelOperation: (id: string) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;

  getOperationById: (id: string) => Operation | undefined;
  getLateCount: (type: OperationType) => number;
  getPendingCount: (type: OperationType) => number;
  getWaitingCount: (type: OperationType) => number;
  getTotalCount: (type: OperationType) => number;
  totalProductsCount: number;
  lowStockCount: number;
  pendingReceiptsCount: number;
  pendingDeliveriesCount: number;
  scheduledTransfersCount: number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    const data = await apiFetch('/products');
    setProducts(data.map(mapProduct));
  }, []);
  const refreshWarehouses = useCallback(async () => {
    const data = await apiFetch('/warehouses');
    setWarehouses(data.map(mapWarehouse));
  }, []);
  const refreshLocations = useCallback(async () => {
    const data = await apiFetch('/locations');
    setLocations(data.map(mapLocation));
  }, []);
  const refreshOperations = useCallback(async () => {
    const data = await apiFetch('/operations');
    setOperations(data.map(mapOperation));
  }, []);
  const refreshMoveHistory = useCallback(async () => {
    const data = await apiFetch('/move-history');
    setMoveHistory(data.map(mapMove));
  }, []);

  useEffect(() => {
    Promise.all([
      refreshProducts(),
      refreshWarehouses(),
      refreshLocations(),
      refreshOperations(),
      refreshMoveHistory()
    ])
      .then(() => setLoadError(null))
      .catch((e) => {
        console.error('Failed to load data from backend:', e);
        setLoadError(
          'Could not reach the local backend at ' + API_BASE + '. Is `node server.js` running? (' + e.message + ')'
        );
      });
  }, [refreshProducts, refreshWarehouses, refreshLocations, refreshOperations, refreshMoveHistory]);

  // ---------------- Products ----------------
  const addProduct = async (product: Omit<Product, 'id'>) => {
    await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit_of_measure: product.unitOfMeasure,
        per_unit_cost: product.perUnitCost,
        on_hand_qty: product.onHandQty,
        min_threshold: product.minThreshold
      })
    });
    await refreshProducts();
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    await apiFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        sku: updates.sku,
        category: updates.category,
        unit_of_measure: updates.unitOfMeasure,
        per_unit_cost: updates.perUnitCost,
        on_hand_qty: updates.onHandQty,
        free_to_use_qty: updates.freeToUseQty,
        min_threshold: updates.minThreshold
      })
    });
    await refreshProducts();
  };

  const deleteProduct = async (id: string) => {
    // No delete route wired up on the backend yet (not used anywhere in the UI today).
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateProductStockDirect = async (id: string, newOnHand: number, _reason?: string) => {
    await apiFetch(`/products/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ on_hand_qty: newOnHand })
    });
    await refreshProducts();
  };

  // ---------------- Warehouses ----------------
  const addWarehouse = async (warehouse: Omit<Warehouse, 'id'>) => {
    await apiFetch('/warehouses', {
      method: 'POST',
      body: JSON.stringify({
        name: warehouse.name,
        short_code: warehouse.shortCode,
        address: warehouse.address
      })
    });
    await refreshWarehouses();
  };

  const updateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    await apiFetch(`/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        short_code: updates.shortCode,
        address: updates.address
      })
    });
    await refreshWarehouses();
  };

  // ---------------- Locations ----------------
  const addLocation = async (location: Omit<Location, 'id'>) => {
    await apiFetch('/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: location.name,
        short_code: location.shortCode,
        warehouse_id: location.warehouseId
      })
    });
    await refreshLocations();
  };

  const updateLocation = async (id: string, updates: Partial<Location>) => {
    await apiFetch(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        short_code: updates.shortCode,
        warehouse_id: updates.warehouseId
      })
    });
    await refreshLocations();
  };

  // ---------------- Operations ----------------
  function opPayload(op: Partial<Operation>) {
    return {
      type: op.type,
      from_location_id: /^\d+$/.test(String(op.fromLocationId)) ? op.fromLocationId : null,
      from_location_label: op.fromLocationName || (op.fromLocationId && !/^\d+$/.test(String(op.fromLocationId)) ? op.fromLocationId : null),
      to_location_id: /^\d+$/.test(String(op.toLocationId)) ? op.toLocationId : null,
      to_location_label: op.toLocationName || (op.toLocationId && !/^\d+$/.test(String(op.toLocationId)) ? op.toLocationId : null),
      contact: op.contact,
      responsible: op.responsible,
      schedule_date: op.scheduleDate,
      status: op.status,
      operation_subtype: op.operationSubtype,
      notes: op.notes,
      adjustment_recorded_qty: op.adjustmentRecordedQty,
      adjustment_counted_qty: op.adjustmentCountedQty,
      adjustment_difference: op.adjustmentDifference,
      lines: (op.lines || []).map((l) => ({ product_id: l.productId, quantity: l.quantity }))
    };
  }

  const createOperation = async (op: Omit<Operation, 'id' | 'reference' | 'createdAt'>): Promise<Operation> => {
    const created = await apiFetch('/operations', {
      method: 'POST',
      body: JSON.stringify(opPayload(op))
    });
    await refreshOperations();
    const full = await apiFetch(`/operations/${created.id}`);
    return mapOperation(full);
  };

  const updateOperation = async (id: string, updates: Partial<Operation>) => {
    await apiFetch(`/operations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(opPayload(updates))
    });
    await refreshOperations();
  };

  const validateOperation = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch(`/operations/${id}/validate`, { method: 'PUT' });
      await Promise.all([refreshOperations(), refreshProducts(), refreshMoveHistory()]);
      return result;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const cancelOperation = async (id: string) => {
    await apiFetch(`/operations/${id}/cancel`, { method: 'PUT' });
    await refreshOperations();
  };

  const deleteOperation = async (id: string) => {
    await apiFetch(`/operations/${id}`, { method: 'DELETE' });
    await refreshOperations();
  };

  const getOperationById = (id: string) => operations.find((o) => o.id === id);

  const getLateCount = (type: OperationType) => {
    const today = new Date().toISOString().split('T')[0];
    return operations.filter(
      (o) => o.type === type && o.status !== 'Done' && o.status !== 'Canceled' && o.scheduleDate < today
    ).length;
  };

  const getPendingCount = (type: OperationType) => {
    return operations.filter(
      (o) => o.type === type && (o.status === 'Ready' || o.status === 'Waiting' || o.status === 'Draft')
    ).length;
  };

  const getWaitingCount = (type: OperationType) => {
    return operations.filter((o) => o.type === type && o.status === 'Waiting').length;
  };

  const getTotalCount = (type: OperationType) => {
    return operations.filter((o) => o.type === type).length;
  };

  const totalProductsCount = products.length;
  const lowStockCount = products.filter((p) => p.onHandQty <= (p.minThreshold ?? 10)).length;
  const pendingReceiptsCount = getPendingCount('Receipt');
  const pendingDeliveriesCount = getPendingCount('Delivery');
  const scheduledTransfersCount = operations.filter(
    (o) => o.type === 'Transfer' && o.status !== 'Done' && o.status !== 'Canceled'
  ).length;

  return (
    <InventoryContext.Provider
      value={{
        products,
        warehouses,
        locations,
        operations,
        moveHistory,
        loadError,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductStockDirect,
        addWarehouse,
        updateWarehouse,
        addLocation,
        updateLocation,
        createOperation,
        updateOperation,
        validateOperation,
        cancelOperation,
        deleteOperation,
        getOperationById,
        getLateCount,
        getPendingCount,
        getWaitingCount,
        getTotalCount,
        totalProductsCount,
        lowStockCount,
        pendingReceiptsCount,
        pendingDeliveriesCount,
        scheduledTransfersCount
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
