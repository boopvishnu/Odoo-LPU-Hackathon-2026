export type UserRole = 'Inventory Manager' | 'Warehouse Staff' | 'Admin';

export interface User {
  id: string;
  loginId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarLetter?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  shortCode: string;
  address: string;
}

export interface Location {
  id: string;
  name: string;
  shortCode: string;
  warehouseId: string;
  warehouseCode?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitOfMeasure: 'pcs' | 'kg' | 'box' | 'meter' | 'set' | 'unit';
  perUnitCost: number; // in INR
  onHandQty: number;
  freeToUseQty: number;
  minThreshold?: number; // for low stock alerts
  locationBreakdown?: { [locationId: string]: number };
}

export type OperationType = 'Receipt' | 'Delivery' | 'Transfer' | 'Adjustment';
export type OperationStatus = 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled';

export interface OperationLine {
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
}

export interface Operation {
  id: string;
  reference: string; // e.g. WH/IN/0001, WH/OUT/0001, WH/INT/0001, WH/ADJ/0001
  type: OperationType;
  fromLocationId: string; // "vendor", "customer", or locationId
  fromLocationName?: string;
  toLocationId: string; // "vendor", "customer", or locationId
  toLocationName?: string;
  contact: string; // vendor name, customer name, or Azure Interior
  responsible: string;
  scheduleDate: string; // YYYY-MM-DD
  status: OperationStatus;
  lines: OperationLine[];
  operationSubtype?: string; // e.g. Customer Dispatch, Vendor Supply, Standard Transfer
  notes?: string;
  // For adjustments
  adjustmentRecordedQty?: number;
  adjustmentCountedQty?: number;
  adjustmentDifference?: number;
  createdAt: string;
}

export interface MoveHistoryEntry {
  id: string;
  reference: string;
  date: string;
  contact: string;
  fromLocation: string;
  toLocation: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  status: OperationStatus;
  direction: 'in' | 'out' | 'internal';
}
