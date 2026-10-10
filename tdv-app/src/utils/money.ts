// Utilidades de dinero y pedidos. Todo el dinero viaja en centavos (MXN).
// Estas constantes deben coincidir con backend/services/orders.js.
import { colors } from '../theme';

export const SHIPPING_CENTS = 9900;               // $99.00 MXN
export const FREE_SHIPPING_FROM_CENTS = 99900;    // envío gratis desde $999.00
export const MAX_QTY_PER_ITEM = 10;

/** Envío según el subtotal (0 si ya califica para envío gratis o el carrito está vacío). */
export function shippingFor(subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING_CENTS;
}

/** 129900 -> "$1,299.00 MXN" */
export function formatMoney(cents: number | null | undefined): string {
  const n = Number(cents ?? 0) / 100;
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
}

export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'Pago pendiente', color: colors.gold },
  paid:            { label: 'Pagado',         color: colors.green },
  processing:      { label: 'Preparando',     color: colors.cyan },
  shipped:         { label: 'Enviado',        color: colors.blue },
  delivered:       { label: 'Entregado',      color: colors.green },
  cancelled:       { label: 'Cancelado',      color: colors.red },
  refunded:        { label: 'Reembolsado',    color: colors.muted },
};
