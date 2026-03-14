export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: 'manager' | 'staff'
  avatar_url: string | null
  created_at: string
}

export type Warehouse = {
  id: string
  name: string
  code: string
  address: string | null
  is_active: boolean
  created_at: string
}

export type Location = {
  id: string
  warehouse_id: string
  name: string
  code: string | null
  created_at: string
}

export type Category = {
  id: string
  name: string
  created_at: string
}

export type Product = {
  id: string
  name: string
  sku: string
  category_id: string | null
  unit_of_measure: string
  reorder_point: number
  reorder_qty: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type StockLevel = {
  id: string
  product_id: string
  location_id: string
  quantity: number
  updated_at: string
}

export type Receipt = {
  id: string
  reference: string
  supplier_name: string
  destination_location_id: string | null
  status: 'draft' | 'waiting' | 'ready' | 'done' | 'canceled'
  scheduled_date: string | null
  validated_at: string | null
  validated_by: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export type ReceiptLine = {
  id: string
  receipt_id: string
  product_id: string | null
  expected_qty: number
  received_qty: number
  created_at: string
}

export type DeliveryOrder = {
  id: string
  reference: string
  customer_name: string
  source_location_id: string | null
  status: 'draft' | 'waiting' | 'ready' | 'done' | 'canceled'
  scheduled_date: string | null
  validated_at: string | null
  validated_by: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export type DeliveryLine = {
  id: string
  delivery_id: string
  product_id: string | null
  requested_qty: number
  delivered_qty: number
  created_at: string
}

export type InternalTransfer = {
  id: string
  reference: string
  source_location_id: string | null
  dest_location_id: string | null
  status: 'draft' | 'waiting' | 'ready' | 'done' | 'canceled'
  scheduled_date: string | null
  validated_at: string | null
  validated_by: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export type TransferLine = {
  id: string
  transfer_id: string
  product_id: string | null
  qty: number
  created_at: string
}

export type StockAdjustment = {
  id: string
  reference: string
  location_id: string | null
  status: 'draft' | 'done' | 'canceled'
  adjusted_at: string | null
  adjusted_by: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export type AdjustmentLine = {
  id: string
  adjustment_id: string
  product_id: string | null
  recorded_qty: number
  counted_qty: number
  difference: number
  created_at: string
}

export type StockLedger = {
  id: string
  product_id: string
  location_id: string
  movement_type: 'receipt' | 'delivery' | 'transfer_in' | 'transfer_out' | 'adjustment'
  reference_id: string
  reference_type: string
  qty_change: number
  qty_after: number
  performed_by: string | null
  created_at: string
}

// Extended types with relations
export type ProductWithCategory = Product & {
  category?: Category | null
}

export type LocationWithWarehouse = Location & {
  warehouse?: Warehouse
}

export type StockLevelWithDetails = StockLevel & {
  product?: Product
  location?: LocationWithWarehouse
}

export type ReceiptWithDetails = Receipt & {
  destination_location?: LocationWithWarehouse
  validated_by_user?: Profile
  created_by_user?: Profile
}

export type ReceiptLineWithProduct = ReceiptLine & {
  product?: Product
}

export type DeliveryOrderWithDetails = DeliveryOrder & {
  source_location?: LocationWithWarehouse
  validated_by_user?: Profile
  created_by_user?: Profile
}

export type DeliveryLineWithProduct = DeliveryLine & {
  product?: Product
}

export type InternalTransferWithDetails = InternalTransfer & {
  source_location?: LocationWithWarehouse
  dest_location?: LocationWithWarehouse
  validated_by_user?: Profile
  created_by_user?: Profile
}

export type TransferLineWithProduct = TransferLine & {
  product?: Product
}

export type StockAdjustmentWithDetails = StockAdjustment & {
  location?: LocationWithWarehouse
  adjusted_by_user?: Profile
  created_by_user?: Profile
}

export type AdjustmentLineWithProduct = AdjustmentLine & {
  product?: Product
}

export type StockLedgerWithDetails = StockLedger & {
  product?: Product
  location?: LocationWithWarehouse
  performed_by_user?: Profile
}
