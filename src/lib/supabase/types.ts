// Tipos correspondentes ao schema em supabase/migrations/20260803000000_initial_schema.sql

export type SessionStatus = 'open' | 'closed';
export type ItemStatus = 'unpaid' | 'reserved' | 'paid';
export type ChargeType = 'full' | 'equal_split' | 'items';
export type ChargeStatus = 'pending' | 'pending_confirmation' | 'paid' | 'expired';

export interface Restaurant {
  id: string;
  name: string;
  city: string;
  pix_key: string;
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  number: number;
  name: string | null;
  qr_slug: string;
  qr_active: boolean;
  created_at: string;
}

export interface TableSession {
  id: string;
  table_id: string;
  status: SessionStatus;
  session_token: string;
  opened_at: string;
  closed_at: string | null;
}

export interface SessionItem {
  id: string;
  session_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  status: ItemStatus;
  reserved_by_charge_id: string | null;
  created_at: string;
}

export interface PixCharge {
  id: string;
  session_id: string;
  charge_type: ChargeType;
  people_paying: number | null;
  people_total: number | null;
  txid: string;
  amount: number;
  brcode: string;
  status: ChargeStatus;
  created_at: string;
  expires_at: string;
  paid_at: string | null;
}

export interface PixChargeItem {
  pix_charge_id: string;
  session_item_id: string;
}

export interface Staff {
  id: string;
  user_id: string;
  restaurant_id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  restaurant_id: string;
  name: string;
  price: number;
  active: boolean;
  category: string | null;
  created_at: string;
}
