import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  Warehouse, 
  Location, 
  Operation, 
  OperationType, 
  OperationStatus, 
  MoveHistoryEntry 
} from '../types';
import { db } from '../services/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

interface InventoryContextType {
  products: Product[];
  warehouses: Warehouse[];
  locations: Location[];
  operations: Operation[];
  moveHistory: MoveHistoryEntry[];
  
  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProductStockDirect: (id: string, newOnHand: number, reason?: string) => Promise<void>;

  // Warehouse actions
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => Promise<void>;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => Promise<void>;
  
  // Location actions
  addLocation: (location: Omit<Location, 'id'>) => Promise<void>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<void>;

  // Operation actions
  createOperation: (op: Omit<Operation, 'id' | 'reference' | 'createdAt'>) => Promise<Operation>;
  updateOperation: (id: string, updates: Partial<Operation>) => Promise<void>;
  validateOperation: (id: string) => Promise<{ success: boolean; error?: string }>;
  cancelOperation: (id: string) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;

  // Calculations / Helpers
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

// Initial realistic data tailored to Indian context & mockups
const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh_1',
    name: 'Main Central Warehouse',
    shortCode: 'WH',
    address: 'Plot C-12, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093'
  },
  {
    id: 'wh_2',
    name: 'Bengaluru Logistics Depot',
    shortCode: 'BLR',
    address: 'Survey No. 44, Whitefield Industrial Zone, Bengaluru, Karnataka 560066'
  }
];

const INITIAL_LOCATIONS: Location[] = [
  { id: 'loc_wh_stock1', name: 'WH/Stock1', shortCode: 'Stock1', warehouseId: 'wh_1', warehouseCode: 'WH' },
  { id: 'loc_wh_stock2', name: 'WH/Stock2', shortCode: 'Stock2', warehouseId: 'wh_1', warehouseCode: 'WH' },
  { id: 'loc_wh_packing', name: 'WH/Packing', shortCode: 'Packing', warehouseId: 'wh_1', warehouseCode: 'WH' },
  { id: 'loc_wh_dispatch', name: 'WH/Dispatch', shortCode: 'Dispatch', warehouseId: 'wh_1', warehouseCode: 'WH' },
  { id: 'loc_blr_stock1', name: 'BLR/Stock1', shortCode: 'Stock1', warehouseId: 'wh_2', warehouseCode: 'BLR' }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Desk',
    sku: 'DESK001',
    category: 'Office Furniture',
    unitOfMeasure: 'pcs',
    perUnitCost: 3000,
    onHandQty: 50,
    freeToUseQty: 45,
    minThreshold: 15,
    locationBreakdown: { 'loc_wh_stock1': 35, 'loc_wh_stock2': 15 }
  },
  {
    id: 'prod_2',
    name: 'Table',
    sku: 'TABL002',
    category: 'Office Furniture',
    unitOfMeasure: 'pcs',
    perUnitCost: 3000,
    onHandQty: 50,
    freeToUseQty: 50,
    minThreshold: 10,
    locationBreakdown: { 'loc_wh_stock1': 50 }
  },
  {
    id: 'prod_3',
    name: 'Ergonomic Mesh Chair',
    sku: 'CHR003',
    category: 'Seating',
    unitOfMeasure: 'pcs',
    perUnitCost: 4500,
    onHandQty: 28,
    freeToUseQty: 24,
    minThreshold: 10,
    locationBreakdown: { 'loc_wh_stock1': 28 }
  },
  {
    id: 'prod_4',
    name: 'Steel Storage Cabinet',
    sku: 'CAB004',
    category: 'Storage',
    unitOfMeasure: 'unit',
    perUnitCost: 8200,
    onHandQty: 12,
    freeToUseQty: 10,
    minThreshold: 8,
    locationBreakdown: { 'loc_wh_stock2': 12 }
  },
  {
    id: 'prod_5',
    name: 'Modular Partition Panel',
    sku: 'MOD005',
    category: 'Partitions',
    unitOfMeasure: 'set',
    perUnitCost: 2200,
    onHandQty: 6,
    freeToUseQty: 4,
    minThreshold: 10, // low stock flag!
    locationBreakdown: { 'loc_wh_stock1': 6 }
  },
  {
    id: 'prod_6',
    name: 'Industrial Heavy Duty Rack',
    sku: 'RCK006',
    category: 'Warehouse Equipment',
    unitOfMeasure: 'set',
    perUnitCost: 11500,
    onHandQty: 18,
    freeToUseQty: 18,
    minThreshold: 5,
    locationBreakdown: { 'loc_wh_stock2': 18 }
  }
];

// Initial operations seeded to match Image 1, Image 6, Image 8, Image 9 & 10
// In Image 6:
// Receipt panel: 4 to receive, 1 Late, 6 operations
// Delivery panel: 4 to Deliver, 1 Late, 2 waiting, 6 operations
const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
const tomorrowStr = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
const nextWeekStr = new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0];

const INITIAL_OPERATIONS: Operation[] = [
  // 1. Receipts (6 operations total, 4 pending/to receive, 1 late)
  {
    id: 'op_rcpt_1',
    reference: 'WH/IN/0001',
    type: 'Receipt',
    fromLocationId: 'vendor',
    fromLocationName: 'vendor (Azure Interior)',
    toLocationId: 'loc_wh_stock1',
    toLocationName: 'WH/Stock1',
    contact: 'Azure Interior',
    responsible: 'Aman Shaikh',
    scheduleDate: yesterdayStr, // Late!
    status: 'Ready',
    lines: [{ productId: 'prod_1', productName: 'Desk', productSku: 'DESK001', quantity: 6 }],
    createdAt: yesterdayStr,
    operationSubtype: 'Vendor Inflow'
  },
  {
    id: 'op_rcpt_2',
    reference: 'WH/IN/0002',
    type: 'Receipt',
    fromLocationId: 'vendor',
    fromLocationName: 'vendor (Tata Steel)',
    toLocationId: 'loc_wh_stock1',
    toLocationName: 'WH/Stock1',
    contact: 'Azure Interior',
    responsible: 'Aman Shaikh',
    scheduleDate: todayStr,
    status: 'Ready',
    lines: [
      { productId: 'prod_1', productName: 'Desk', productSku: 'DESK001', quantity: 10 },
      { productId: 'prod_2', productName: 'Table', productSku: 'TABL002', quantity: 8 }
    ],
    createdAt: todayStr,
    operationSubtype: 'Vendor Inflow'
  },
  {
    id: 'op_rcpt_3',
    reference: 'WH/IN/0003',
    type: 'Receipt',
    fromLocationId: 'vendor',
    fromLocationName: 'vendor (Godrej Interio)',
    toLocationId: 'loc_wh_stock2',
    toLocationName: 'WH/Stock2',
    contact: 'Godrej Interio',
    responsible: 'Sashank',
    scheduleDate: tomorrowStr,
    status: 'Waiting',
    lines: [{ productId: 'prod_4', productName: 'Steel Storage Cabinet', productSku: 'CAB004', quantity: 5 }],
    createdAt: todayStr,
    operationSubtype: 'Vendor Inflow'
  },
  {
    id: 'op_rcpt_4',
    reference: 'WH/IN/0004',
    type: 'Receipt',
    fromLocationId: 'vendor',
    fromLocationName: 'vendor (Nilkamal Polymers)',
    toLocationId: 'loc_wh_stock1',
    toLocationName: 'WH/Stock1',
    contact: 'Nilkamal Industries',
    responsible: 'Varshini S',
    scheduleDate: nextWeekStr,
    status: 'Draft',
    lines: [{ productId: 'prod_3', productName: 'Ergonomic Mesh Chair', productSku: 'CHR003', quantity: 12 }],
    createdAt: todayStr,
    operationSubtype: 'Vendor Inflow'
  },
  {
    id: 'op_rcpt_5',
    reference: 'WH/IN/0005',
    type: 'Receipt',
    fromLocationId: 'vendor',
    fromLocationName: 'vendor (Featherlite Furniture)',
    toLocationId: 'loc_wh_stock1',
    toLocationName: 'WH/Stock1',
    contact: 'Featherlite Products',
    responsible: 'Aman Shaikh',
    scheduleDate: '2026-09-15',
    status: 'Done',
    lines: [{ productId: 'prod_2', productName: 'Table', productSku: 'TABL002', quantity: 20 }],
    createdAt: '2026-09-14',
    operationSubtype: 'Vendor Inflow'
  },
  {
    id: 'op_rcpt_6',
    reference: 'WH/IN/0006',
    type: 'Receipt',
    fromLocationId: 'vendor',
    fromLocationName: 'vendor (Durian Woodworks)',
    toLocationId: 'loc_wh_stock2',
    toLocationName: 'WH/Stock2',
    contact: 'Durian Enterprises',
    responsible: 'Sashank',
    scheduleDate: '2026-09-18',
    status: 'Done',
    lines: [{ productId: 'prod_1', productName: 'Desk', productSku: 'DESK001', quantity: 15 }],
    createdAt: '2026-09-17',
    operationSubtype: 'Vendor Inflow'
  },

  // 2. Deliveries (6 operations total, 4 pending/to deliver, 1 late, 2 waiting)
  {
    id: 'op_del_1',
    reference: 'WH/OUT/0001',
    type: 'Delivery',
    fromLocationId: 'loc_wh_stock1',
    fromLocationName: 'WH/Stock1',
    toLocationId: 'customer',
    toLocationName: 'vendor/Customer (Azure Interior)',
    contact: 'Azure Interior',
    responsible: 'Sashank',
    scheduleDate: yesterdayStr, // Late!
    status: 'Ready',
    lines: [{ productId: 'prod_1', productName: 'Desk', productSku: 'DESK001', quantity: 6 }],
    notes: 'Plot 42, Bandra Kurla Complex, Mumbai',
    createdAt: yesterdayStr,
    operationSubtype: 'Customer Dispatch'
  },
  {
    id: 'op_del_2',
    reference: 'WH/OUT/0002',
    type: 'Delivery',
    fromLocationId: 'loc_wh_stock1',
    fromLocationName: 'WH/Stock1',
    toLocationId: 'customer',
    toLocationName: 'vendor/Customer (Infosys Tech Park)',
    contact: 'Azure Interior',
    responsible: 'Varshini S',
    scheduleDate: tomorrowStr,
    status: 'Ready',
    lines: [
      { productId: 'prod_1', productName: 'Desk', productSku: 'DESK001', quantity: 5 },
      { productId: 'prod_3', productName: 'Ergonomic Mesh Chair', productSku: 'CHR003', quantity: 4 }
    ],
    notes: 'Electronic City Phase 1, Bangalore',
    createdAt: todayStr,
    operationSubtype: 'Customer Dispatch'
  },
  {
    id: 'op_del_3',
    reference: 'WH/OUT/0003',
    type: 'Delivery',
    fromLocationId: 'loc_wh_stock2',
    fromLocationName: 'WH/Stock2',
    toLocationId: 'customer',
    toLocationName: 'vendor/Customer (Wipro Campus)',
    contact: 'Wipro Limited',
    responsible: 'Aman Shaikh',
    scheduleDate: nextWeekStr,
    status: 'Waiting', // waiting 1
    lines: [{ productId: 'prod_4', productName: 'Steel Storage Cabinet', productSku: 'CAB004', quantity: 2 }],
    notes: 'Sarjapur Main Road, Bangalore',
    createdAt: todayStr,
    operationSubtype: 'Customer Dispatch'
  },
  {
    id: 'op_del_4',
    reference: 'WH/OUT/0004',
    type: 'Delivery',
    fromLocationId: 'loc_wh_stock1',
    fromLocationName: 'WH/Stock1',
    toLocationId: 'customer',
    toLocationName: 'vendor/Customer (HDFC Tower)',
    contact: 'HDFC Realty',
    responsible: 'Sashank',
    scheduleDate: nextWeekStr,
    status: 'Waiting', // waiting 2
    lines: [{ productId: 'prod_2', productName: 'Table', productSku: 'TABL002', quantity: 4 }],
    notes: 'Senapati Bapat Marg, Lower Parel, Mumbai',
    createdAt: todayStr,
    operationSubtype: 'Customer Dispatch'
  },
  {
    id: 'op_del_5',
    reference: 'WH/OUT/0005',
    type: 'Delivery',
    fromLocationId: 'loc_wh_stock1',
    fromLocationName: 'WH/Stock1',
    toLocationId: 'customer',
    toLocationName: 'vendor/Customer (Tata Consultancy Services)',
    contact: 'TCS Banyan Park',
    responsible: 'Varshini S',
    scheduleDate: '2026-09-12',
    status: 'Done',
    lines: [{ productId: 'prod_1', productName: 'Desk', productSku: 'DESK001', quantity: 12 }],
    createdAt: '2026-09-11',
    operationSubtype: 'Customer Dispatch'
  },
  {
    id: 'op_del_6',
    reference: 'WH/OUT/0006',
    type: 'Delivery',
    fromLocationId: 'loc_wh_stock2',
    fromLocationName: 'WH/Stock2',
    toLocationId: 'customer',
    toLocationName: 'vendor/Customer (Reliance Retail)',
    contact: 'Reliance Retail Ltd',
    responsible: 'Aman Shaikh',
    scheduleDate: '2026-09-14',
    status: 'Done',
    lines: [{ productId: 'prod_3', productName: 'Ergonomic Mesh Chair', productSku: 'CHR003', quantity: 8 }],
    createdAt: '2026-09-13',
    operationSubtype: 'Customer Dispatch'
  },

  // 3. Internal Transfers
  {
    id: 'op_int_1',
    reference: 'WH/INT/0001',
    type: 'Transfer',
    fromLocationId: 'loc_wh_stock1',
    fromLocationName: 'WH/Stock1',
    toLocationId: 'loc_wh_stock2',
    toLocationName: 'WH/Stock2',
    contact: 'Internal Logistics',
    responsible: 'Sashank',
    scheduleDate: tomorrowStr,
    status: 'Ready',
    lines: [{ productId: 'prod_1', productName: 'Desk', productSku: 'DESK001', quantity: 8 }],
    createdAt: todayStr,
    operationSubtype: 'Internal Rebalance'
  },
  {
    id: 'op_int_2',
    reference: 'WH/INT/0002',
    type: 'Transfer',
    fromLocationId: 'loc_wh_stock1',
    fromLocationName: 'WH/Stock1',
    toLocationId: 'loc_wh_packing',
    toLocationName: 'WH/Packing',
    contact: 'Packing Team',
    responsible: 'Varshini S',
    scheduleDate: nextWeekStr,
    status: 'Waiting',
    lines: [{ productId: 'prod_2', productName: 'Table', productSku: 'TABL002', quantity: 5 }],
    createdAt: todayStr,
    operationSubtype: 'Packing Staging'
  },

  // 4. Stock Adjustments
  {
    id: 'op_adj_1',
    reference: 'WH/ADJ/0001',
    type: 'Adjustment',
    fromLocationId: 'loc_wh_stock1',
    fromLocationName: 'WH/Stock1',
    toLocationId: 'loc_wh_stock1',
    toLocationName: 'WH/Stock1',
    contact: 'Physical Audit Team',
    responsible: 'Aman Shaikh',
    scheduleDate: '2026-09-20',
    status: 'Done',
    lines: [{ productId: 'prod_1', productName: 'Desk', productSku: 'DESK001', quantity: 2 }],
    adjustmentRecordedQty: 48,
    adjustmentCountedQty: 50,
    adjustmentDifference: 2,
    notes: 'Monthly physical verification audit - found 2 extra assembled units',
    createdAt: '2026-09-20'
  }
];

// Initial Move History Seed matching Image 7
const INITIAL_MOVE_HISTORY: MoveHistoryEntry[] = [
  {
    id: 'move_1',
    reference: 'WH/IN/0001',
    date: '2026-09-24',
    contact: 'Azure Interior',
    fromLocation: 'vendor',
    toLocation: 'WH/Stock1',
    productId: 'prod_1',
    productName: 'Desk',
    productSku: 'DESK001',
    quantity: 6,
    status: 'Ready',
    direction: 'in' // green!
  },
  {
    id: 'move_2',
    reference: 'WH/OUT/0002',
    date: '2026-09-24',
    contact: 'Azure Interior',
    fromLocation: 'WH/Stock1',
    toLocation: 'vendor',
    productId: 'prod_1',
    productName: 'Desk',
    productSku: 'DESK001',
    quantity: 5,
    status: 'Ready',
    direction: 'out' // red!
  },
  {
    id: 'move_3',
    reference: 'WH/OUT/0002',
    date: '2026-09-24',
    contact: 'Azure Interior',
    fromLocation: 'WH/Stock2',
    toLocation: 'vendor',
    productId: 'prod_3',
    productName: 'Ergonomic Mesh Chair',
    productSku: 'CHR003',
    quantity: 4,
    status: 'Ready',
    direction: 'out' // red!
  },
  {
    id: 'move_4',
    reference: 'WH/IN/0005',
    date: '2026-09-15',
    contact: 'Featherlite Products',
    fromLocation: 'vendor',
    toLocation: 'WH/Stock1',
    productId: 'prod_2',
    productName: 'Table',
    productSku: 'TABL002',
    quantity: 20,
    status: 'Done',
    direction: 'in'
  },
  {
    id: 'move_5',
    reference: 'WH/OUT/0005',
    date: '2026-09-12',
    contact: 'TCS Banyan Park',
    fromLocation: 'WH/Stock1',
    toLocation: 'customer',
    productId: 'prod_1',
    productName: 'Desk',
    productSku: 'DESK001',
    quantity: 12,
    status: 'Done',
    direction: 'out'
  },
  {
    id: 'move_6',
    reference: 'WH/INT/0001',
    date: '2026-09-25',
    contact: 'Internal Logistics',
    fromLocation: 'WH/Stock1',
    toLocation: 'WH/Stock2',
    productId: 'prod_1',
    productName: 'Desk',
    productSku: 'DESK001',
    quantity: 8,
    status: 'Ready',
    direction: 'internal'
  }
];

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem('vhat_warehouses');
    return saved ? JSON.parse(saved) : INITIAL_WAREHOUSES;
  });

  const [locations, setLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem('vhat_locations');
    return saved ? JSON.parse(saved) : INITIAL_LOCATIONS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('vhat_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [operations, setOperations] = useState<Operation[]>(() => {
    const saved = localStorage.getItem('vhat_operations');
    return saved ? JSON.parse(saved) : INITIAL_OPERATIONS;
  });

  const [moveHistory, setMoveHistory] = useState<MoveHistoryEntry[]>(() => {
    const saved = localStorage.getItem('vhat_move_history');
    return saved ? JSON.parse(saved) : INITIAL_MOVE_HISTORY;
  });

  // Save to localStorage whenever modified
  useEffect(() => {
    localStorage.setItem('vhat_warehouses', JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem('vhat_locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('vhat_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('vhat_operations', JSON.stringify(operations));
  }, [operations]);

  useEffect(() => {
    localStorage.setItem('vhat_move_history', JSON.stringify(moveHistory));
  }, [moveHistory]);

  // Sync with Firestore in background if available
  useEffect(() => {
    const firestore = db;
    if (!firestore) return;
    const fetchFirestoreData = async () => {
      try {
        const prodSnap = await getDocs(collection(firestore, 'products'));
        if (!prodSnap.empty) {
          const list: Product[] = [];
          prodSnap.forEach((d) => list.push({ ...d.data(), id: d.id } as Product));
          setProducts(list);
        }
      } catch (e) {
        // silently fallback to localStorage
      }
    };
    fetchFirestoreData();
  }, []);

  // PRODUCT ACTIONS
  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newId = `prod_${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      freeToUseQty: productData.freeToUseQty ?? productData.onHandQty
    };
    const updated = [newProduct, ...products];
    setProducts(updated);

    const firestore = db;
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'products', newId), newProduct);
      } catch (e) {
        console.warn('Firestore addProduct fallback:', e);
      }
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProducts(updated);
    const firestore = db;
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'products', id), updates, { merge: true });
      } catch (e) {
        console.warn('Firestore updateProduct fallback:', e);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  // Direct stock update from Stock table (Image 2 note)
  const updateProductStockDirect = async (id: string, newOnHand: number, reason: string = 'Direct Stock Revision') => {
    const target = products.find((p) => p.id === id);
    if (!target) return;

    const diff = newOnHand - target.onHandQty;
    const updated = products.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          onHandQty: newOnHand,
          freeToUseQty: Math.max(0, p.freeToUseQty + diff)
        };
      }
      return p;
    });
    setProducts(updated);

    // Create adjustment operation & move history entry
    const adjCount = operations.filter((o) => o.type === 'Adjustment').length + 1;
    const ref = `WH/ADJ/${String(adjCount).padStart(4, '0')}`;
    const newOp: Operation = {
      id: `op_adj_${Date.now()}`,
      reference: ref,
      type: 'Adjustment',
      fromLocationId: 'loc_wh_stock1',
      fromLocationName: 'WH/Stock1',
      toLocationId: 'loc_wh_stock1',
      toLocationName: 'WH/Stock1',
      contact: 'Stock Audit',
      responsible: 'Inventory Staff',
      scheduleDate: todayStr,
      status: 'Done',
      lines: [{ productId: target.id, productName: target.name, productSku: target.sku, quantity: Math.abs(diff) }],
      adjustmentRecordedQty: target.onHandQty,
      adjustmentCountedQty: newOnHand,
      adjustmentDifference: diff,
      notes: reason,
      createdAt: todayStr
    };
    setOperations((prev) => [newOp, ...prev]);

    const newMove: MoveHistoryEntry = {
      id: `move_${Date.now()}`,
      reference: ref,
      date: todayStr,
      contact: 'Stock Audit',
      fromLocation: diff >= 0 ? 'Adjustment' : 'WH/Stock1',
      toLocation: diff >= 0 ? 'WH/Stock1' : 'Adjustment',
      productId: target.id,
      productName: target.name,
      productSku: target.sku,
      quantity: Math.abs(diff),
      status: 'Done',
      direction: diff >= 0 ? 'in' : 'out'
    };
    setMoveHistory((prev) => [newMove, ...prev]);
  };

  // WAREHOUSE ACTIONS
  const addWarehouse = async (wh: Omit<Warehouse, 'id'>) => {
    const newWh: Warehouse = { ...wh, id: `wh_${Date.now()}` };
    setWarehouses([...warehouses, newWh]);
  };

  const updateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    setWarehouses(warehouses.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  // LOCATION ACTIONS
  const addLocation = async (loc: Omit<Location, 'id'>) => {
    const parentWh = warehouses.find((w) => w.id === loc.warehouseId);
    const newLoc: Location = {
      ...loc,
      id: `loc_${Date.now()}`,
      warehouseCode: parentWh?.shortCode || 'WH'
    };
    setLocations([...locations, newLoc]);
  };

  const updateLocation = async (id: string, updates: Partial<Location>) => {
    setLocations(locations.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  // OPERATION ACTIONS
  const createOperation = async (opData: Omit<Operation, 'id' | 'reference' | 'createdAt'>): Promise<Operation> => {
    let prefix = 'WH/IN';
    if (opData.type === 'Delivery') prefix = 'WH/OUT';
    else if (opData.type === 'Transfer') prefix = 'WH/INT';
    else if (opData.type === 'Adjustment') prefix = 'WH/ADJ';

    const existingOfType = operations.filter((o) => o.type === opData.type);
    const refNumber = existingOfType.length + 1;
    const reference = `${prefix}/${String(refNumber).padStart(4, '0')}`;

    const newOp: Operation = {
      ...opData,
      id: `op_${Date.now()}`,
      reference,
      createdAt: todayStr
    };

    setOperations([newOp, ...operations]);
    return newOp;
  };

  const updateOperation = async (id: string, updates: Partial<Operation>) => {
    setOperations(operations.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  // Validate Operation (Business Rules from Sections 5.1, 5.2, 5.3, 5.4)
  const validateOperation = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const op = operations.find((o) => o.id === id);
    if (!op) return { success: false, error: 'Operation not found' };
    if (op.status === 'Done') return { success: false, error: 'Operation is already validated and Done.' };
    if (op.status === 'Canceled') return { success: false, error: 'Cannot validate a canceled operation.' };

    const newMoves: MoveHistoryEntry[] = [];
    const updatedProducts = [...products];

    if (op.type === 'Receipt') {
      // Stock quantity increases by the line quantity at the destination location
      for (const line of op.lines) {
        const prodIndex = updatedProducts.findIndex((p) => p.id === line.productId);
        if (prodIndex >= 0) {
          const p = updatedProducts[prodIndex];
          const newOnHand = p.onHandQty + line.quantity;
          const newFree = p.freeToUseQty + line.quantity;
          const locBreakdown = { ...(p.locationBreakdown || {}) };
          locBreakdown[op.toLocationId] = (locBreakdown[op.toLocationId] || 0) + line.quantity;

          updatedProducts[prodIndex] = {
            ...p,
            onHandQty: newOnHand,
            freeToUseQty: newFree,
            locationBreakdown: locBreakdown
          };

          // Generate move history row
          newMoves.push({
            id: `move_${Date.now()}_${line.productId}`,
            reference: op.reference,
            date: todayStr,
            contact: op.contact || 'Azure Interior',
            fromLocation: op.fromLocationName || op.fromLocationId || 'vendor',
            toLocation: op.toLocationName || op.toLocationId || 'WH/Stock1',
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            quantity: line.quantity,
            status: 'Done',
            direction: 'in' // Green
          });
        }
      }
    } else if (op.type === 'Delivery') {
      // Stock decreases by the line quantity from source location
      for (const line of op.lines) {
        const prodIndex = updatedProducts.findIndex((p) => p.id === line.productId);
        if (prodIndex >= 0) {
          const p = updatedProducts[prodIndex];
          const newOnHand = Math.max(0, p.onHandQty - line.quantity);
          const newFree = Math.max(0, p.freeToUseQty - line.quantity);
          const locBreakdown = { ...(p.locationBreakdown || {}) };
          if (locBreakdown[op.fromLocationId]) {
            locBreakdown[op.fromLocationId] = Math.max(0, locBreakdown[op.fromLocationId] - line.quantity);
          }

          updatedProducts[prodIndex] = {
            ...p,
            onHandQty: newOnHand,
            freeToUseQty: newFree,
            locationBreakdown: locBreakdown
          };

          newMoves.push({
            id: `move_${Date.now()}_${line.productId}`,
            reference: op.reference,
            date: todayStr,
            contact: op.contact || 'Azure Interior',
            fromLocation: op.fromLocationName || op.fromLocationId || 'WH/Stock1',
            toLocation: op.toLocationName || op.toLocationId || 'customer',
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            quantity: line.quantity,
            status: 'Done',
            direction: 'out' // Red
          });
        }
      }
    } else if (op.type === 'Transfer') {
      // Total stock unchanged; location breakdown updated
      for (const line of op.lines) {
        const prodIndex = updatedProducts.findIndex((p) => p.id === line.productId);
        if (prodIndex >= 0) {
          const p = updatedProducts[prodIndex];
          const locBreakdown = { ...(p.locationBreakdown || {}) };
          locBreakdown[op.fromLocationId] = Math.max(0, (locBreakdown[op.fromLocationId] || 0) - line.quantity);
          locBreakdown[op.toLocationId] = (locBreakdown[op.toLocationId] || 0) + line.quantity;

          updatedProducts[prodIndex] = {
            ...p,
            locationBreakdown: locBreakdown
          };

          newMoves.push({
            id: `move_${Date.now()}_${line.productId}`,
            reference: op.reference,
            date: todayStr,
            contact: op.contact || op.responsible || 'Internal Logistics',
            fromLocation: op.fromLocationName || op.fromLocationId,
            toLocation: op.toLocationName || op.toLocationId,
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            quantity: line.quantity,
            status: 'Done',
            direction: 'internal' // Blue
          });
        }
      }
    } else if (op.type === 'Adjustment') {
      // Reconciles stock to counted quantity
      const line = op.lines[0];
      if (line) {
        const prodIndex = updatedProducts.findIndex((p) => p.id === line.productId);
        if (prodIndex >= 0) {
          const p = updatedProducts[prodIndex];
          const counted = op.adjustmentCountedQty ?? p.onHandQty;
          const diff = counted - p.onHandQty;

          updatedProducts[prodIndex] = {
            ...p,
            onHandQty: counted,
            freeToUseQty: Math.max(0, p.freeToUseQty + diff)
          };

          newMoves.push({
            id: `move_${Date.now()}`,
            reference: op.reference,
            date: todayStr,
            contact: op.contact || 'Stock Audit',
            fromLocation: diff >= 0 ? 'Adjustment' : op.fromLocationName || 'WH/Stock1',
            toLocation: diff >= 0 ? op.fromLocationName || 'WH/Stock1' : 'Adjustment',
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            quantity: Math.abs(diff),
            status: 'Done',
            direction: diff >= 0 ? 'in' : 'out'
          });
        }
      }
    }

    // Update state
    setProducts(updatedProducts);
    setOperations(operations.map((o) => (o.id === id ? { ...o, status: 'Done' } : o)));
    setMoveHistory([...newMoves, ...moveHistory]);

    return { success: true };
  };

  const cancelOperation = async (id: string) => {
    setOperations(operations.map((o) => (o.id === id ? { ...o, status: 'Canceled' } : o)));
  };

  const deleteOperation = async (id: string) => {
    setOperations(operations.filter((o) => o.id !== id));
  };

  const getOperationById = (id: string) => operations.find((o) => o.id === id);

  // Statistics calculation
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
