import { api } from './client';

export type Variant = { id: number; label: string; stock: number; price_cents: number };
export type Product = {
  id: number; slug: string; name: string; description: string | null; category: string | null;
  price_cents: number; currency: string; image: string | null; is_featured: number;
  variants: Variant[]; in_stock: boolean;
};
export type Address = {
  id: number; full_name: string; phone: string | null; line1: string; line2: string | null;
  city: string; state: string; postal_code: string; country: string; is_default: number;
};
export type NewAddress = { full_name: string; phone?: string; line1: string; line2?: string; city: string; state: string; postal_code: string; is_default?: boolean };
export type OrderItem = { id: number; product_id: number; variant_id: number | null; product_name: string; variant_label: string | null; unit_price_cents: number; quantity: number };
export type Order = {
  id: number; public_code: string; status: string; expires_in_seconds: number | null; subtotal_cents: number; shipping_cents: number; total_cents: number; currency: string;
  paid_at: string | null; created_at: string; tracking_number: string | null;
  ship_full_name: string; ship_phone: string | null; ship_line1: string; ship_line2: string | null;
  ship_city: string; ship_state: string; ship_postal_code: string; ship_country: string;
  items: OrderItem[];
};
export type OrderSummary = { id: number; public_code: string; expires_in_seconds: number | null; status: string; total_cents: number; currency: string; created_at: string; item_count: number | string };
export type AuthMethod = 'fingerprint' | 'face' | 'device_pin';
export type PayInit =
  | { already_paid: true; order: Order }
  | { already_paid?: false; order_id: number; payment_intent_id: string; client_secret: string; publishable_key: string | null; amount_cents: number; currency: string };

export const fetchProducts = () => api<Product[]>('/shop/products');
export const fetchProduct = (slug: string) => api<Product>(`/shop/products/${encodeURIComponent(slug)}`);

export const fetchAddresses = () => api<Address[]>('/shop/addresses', { auth: true });
export const createAddress = (a: NewAddress) => api<{ id: number }>('/shop/addresses', { method: 'POST', body: a, auth: true });
export const updateAddress = (id: number, a: NewAddress) => api<{ ok: true }>(`/shop/addresses/${id}`, { method: 'PUT', body: a, auth: true });
export const setDefaultAddress = (id: number) => api<{ ok: true }>(`/shop/addresses/${id}/default`, { method: 'POST', body: {}, auth: true });
export const deleteAddress = (id: number) => api<{ ok: true }>(`/shop/addresses/${id}`, { method: 'DELETE', auth: true });

export const createOrder = (items: { variant_id: number; quantity: number }[], addressId: number) =>
  api<Order>('/shop/orders', { method: 'POST', body: { items, address_id: addressId }, auth: true });
export const fetchOrders = () => api<OrderSummary[]>('/shop/orders', { auth: true });
export const fetchOrder = (id: number) => api<Order>(`/shop/orders/${id}`, { auth: true });
export const cancelOrder = (id: number) => api<{ ok: true }>(`/shop/orders/${id}/cancel`, { method: 'POST', body: {}, auth: true });

export const payOrder = (id: number, authMethod: AuthMethod) =>
  api<PayInit>(`/shop/orders/${id}/pay`, { method: 'POST', body: { auth_method: authMethod }, auth: true, timeoutMs: 20000 });
export const confirmOrder = (id: number) =>
  api<{ ok: true; order: Order }>(`/shop/orders/${id}/confirm`, { method: 'POST', body: {}, auth: true, timeoutMs: 20000 });
