import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcularCarrito, elegirPrecio, type FilaPrecio } from './calculo';

const filas: FilaPrecio[] = [
  { producto_slug: 'eris', variante: null, cantidad_minima: 6, precio_ht: 1.5 },
  { producto_slug: 'eris', variante: 'Rouge', cantidad_minima: 12, precio_ht: 1.2 },
  { producto_slug: 'tote', variante: null, cantidad_minima: 1, precio_ht: 3 },
  { producto_slug: 'tote', variante: null, cantidad_minima: 50, precio_ht: 2.5 },
];
const l = (id: string, slug: string, variante: string, cantidad: number) => ({ id, producto_slug: slug, variante, talla: '', cantidad });

test('precio de variante antes que el del producto', () => {
  const r = elegirPrecio(filas, 'eris', 'Rouge', 12);
  assert.ok('fila' in r && r.fila.precio_ht === 1.2);
  const o = elegirPrecio(filas, 'eris', 'Bleu', 6);
  assert.ok('fila' in o && o.fila.precio_ht === 1.5);
});

test('lote mínimo: por debajo no hay precio aplicable', () => {
  const r = elegirPrecio(filas, 'eris', 'Rouge', 6);
  assert.deepEqual(r, { error: 'lote-minimo', minimo: 12 });
  assert.deepEqual(elegirPrecio(filas, 'eris', 'Bleu', 3), { error: 'lote-minimo', minimo: 6 });
});

test('sin fila de precio: «prix sur demande»', () => {
  assert.deepEqual(elegirPrecio(filas, 'inconnu', '', 1), { error: 'sin-precio' });
});

test('tramos de cantidad: se aplica el mayor tramo alcanzado', () => {
  const a = elegirPrecio(filas, 'tote', '', 10);
  const b = elegirPrecio(filas, 'tote', '', 60);
  assert.ok('fila' in a && a.fila.precio_ht === 3);
  assert.ok('fila' in b && b.fila.precio_ht === 2.5);
});

test('totales HT, IVA y TTC con redondeo a céntimos', () => {
  const r = calcularCarrito([l('1', 'eris', 'Rouge', 12), l('2', 'tote', '', 10)], filas, 20);
  assert.equal(r.subtotalHt, 44.4); // 12 × 1,20 + 10 × 3,00
  assert.equal(r.importeIva, 8.88);
  assert.equal(r.totalTtc, 53.28);
  assert.equal(r.completo, true);
  // los precios tienen como máximo 2 decimales (numeric(10,2)); el IVA se redondea al céntimo
  const redondeo = calcularCarrito([l('1', 'tote', '', 1)], [{ producto_slug: 'tote', variante: null, cantidad_minima: 1, precio_ht: 1.99 }], 20);
  assert.equal(redondeo.importeIva, 0.4); // 0,398 → 0,40
  assert.equal(redondeo.totalTtc, 2.39);
});

test('un carrito con líneas sin precio o bajo el lote no está completo', () => {
  const r = calcularCarrito([l('1', 'eris', 'Rouge', 12), l('2', 'eris', 'Bleu', 2), l('3', 'inconnu', '', 1)], filas, 20);
  assert.equal(r.completo, false);
  assert.deepEqual(r.lineas.map((x) => x.estado), ['ok', 'lote-minimo', 'sin-precio']);
  assert.equal(r.subtotalHt, 14.4);
  assert.equal(calcularCarrito([], filas, 20).completo, false);
});
