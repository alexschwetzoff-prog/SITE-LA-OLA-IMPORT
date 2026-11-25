// Cálculo del carrito: precios HT por variante y lote mínimo (o tramo), IVA y total TTC. Módulo puro (sin servidor)
// para poder probarlo; el servidor lo usa con los precios leídos con la sesión del usuario y la tabla `configuracion`.
// La función SQL crear_pedido_desde_carrito() aplica la MISMA regla al crear el pedido.

export interface FilaPrecio {
  producto_slug: string;
  variante: string | null; // null = precio de todo el producto
  cantidad_minima: number; // lote mínimo (o tramo)
  precio_ht: number;
}

export interface LineaEntrada {
  id: string;
  producto_slug: string;
  variante: string;
  talla: string;
  cantidad: number;
}

export type EstadoLinea = 'ok' | 'sin-precio' | 'lote-minimo';

export interface LineaCalculada extends LineaEntrada {
  estado: EstadoLinea;
  /** Lote mínimo que falta por alcanzar (solo si estado = 'lote-minimo'). */
  minimo?: number;
  precioUnitarioHt?: number;
  totalHt?: number;
}

export interface ResultadoCarrito {
  lineas: LineaCalculada[];
  subtotalHt: number;
  tasaIva: number;
  importeIva: number;
  totalTtc: number;
  /** true si todas las líneas tienen precio y respetan su lote: solo entonces se puede finalizar el pedido. */
  completo: boolean;
}

const aCentimos = (euros: number) => Math.round(euros * 100);
const deCentimos = (c: number) => c / 100;

/**
 * Elige la fila de precio de una línea: la de su variante si existe (si no, la del producto) con el mayor lote/tramo
 * que no supere la cantidad. Sin fila aplicable: o no hay precio, o la cantidad no llega al lote mínimo.
 */
export function elegirPrecio(filas: FilaPrecio[], slug: string, variante: string, cantidad: number): { fila: FilaPrecio } | { error: 'sin-precio' } | { error: 'lote-minimo'; minimo: number } {
  const delProducto = filas.filter((f) => f.producto_slug === slug);
  const conVariante = delProducto.filter((f) => f.variante !== null && f.variante === variante);
  const candidatas = conVariante.length ? conVariante : delProducto.filter((f) => f.variante === null);
  if (!candidatas.length) return { error: 'sin-precio' };
  const aplicables = candidatas.filter((f) => f.cantidad_minima <= cantidad).sort((a, b) => b.cantidad_minima - a.cantidad_minima);
  if (aplicables.length) return { fila: aplicables[0] };
  return { error: 'lote-minimo', minimo: Math.min(...candidatas.map((f) => f.cantidad_minima)) };
}

/** Lote mínimo de una variante (o del producto): la menor cantidad_minima de sus filas; 1 si no hay precio. */
export function loteMinimo(filas: FilaPrecio[], slug: string, variante: string): number {
  const delProducto = filas.filter((f) => f.producto_slug === slug);
  const conVariante = delProducto.filter((f) => f.variante !== null && f.variante === variante);
  const candidatas = conVariante.length ? conVariante : delProducto.filter((f) => f.variante === null);
  return candidatas.length ? Math.min(...candidatas.map((f) => f.cantidad_minima)) : 1;
}

export function calcularCarrito(lineas: LineaEntrada[], filas: FilaPrecio[], tasaIva: number): ResultadoCarrito {
  let subtotal = 0;
  let completo = lineas.length > 0;
  const calculadas: LineaCalculada[] = lineas.map((l) => {
    const r = elegirPrecio(filas, l.producto_slug, l.variante, l.cantidad);
    if ('error' in r) {
      completo = false;
      return r.error === 'lote-minimo' ? { ...l, estado: 'lote-minimo', minimo: r.minimo } : { ...l, estado: 'sin-precio' };
    }
    const totalC = Math.round(aCentimos(r.fila.precio_ht) * l.cantidad);
    subtotal += totalC;
    return { ...l, estado: 'ok', precioUnitarioHt: r.fila.precio_ht, totalHt: deCentimos(totalC) };
  });
  const ivaC = Math.round((subtotal * tasaIva) / 100);
  return { lineas: calculadas, subtotalHt: deCentimos(subtotal), tasaIva, importeIva: deCentimos(ivaC), totalTtc: deCentimos(subtotal + ivaC), completo };
}

export const formatoEuros = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
