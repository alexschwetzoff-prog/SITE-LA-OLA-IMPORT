// Pruebas de la lectura de opiniones desde el CSV (fase 10): `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_CARACTERES, NOMBRE_ANONIMO, esSi, fechaValida, limpiarTexto, opinionesDesdeCsv } from './opiniones';

// Un CSV como el que publica Google Sheets: cabecera exacta, comillas, tildes, filas vacías del formulario
// (",,NO,NO,"), filas con NO y una con mostrar_nombre NO.
const CSV = [
  '﻿empresa,opinion,mostrar_nombre,publicar,fecha',
  'ALTER MOTION,Trato muy cercano y profesional. Muy recomendable,SI,SI,2026-10-05',
  ',,NO,NO,',
  ',,NO,NO,',
  '"Panadería La Espiga, S.L.","Nos hicieron 40 camisetas con el logo. ""Perfectas"", dijo el equipo.\nRepetiremos.",Sí,si,2026-10-12',
  'Academia Norte,Opinión que no quiere publicarse,SI,NO,2026-10-13',
  'Clínica Dental Sol,Muy buen trato y entrega en plazo.,NO,SI,2026-09-30',
  'Sin fecha SL,Llegó todo bien.,SI,SI,',
  'Fecha rara,Fecha que no existe.,SI,SI,2026-02-30',
  'Vacía,,SI,SI,2026-10-01',
].join('\r\n');

test('solo se publican las filas con publicar = SI y opinión no vacía, en fecha descendente y sin fecha al final', () => {
  const lista = opinionesDesdeCsv(CSV);
  assert.deepEqual(
    lista.map((o) => [o.nombre, o.fecha ?? null]),
    [
      ['Panadería La Espiga, S.L.', '2026-10-12'],
      ['ALTER MOTION', '2026-10-05'],
      [NOMBRE_ANONIMO, '2026-09-30'],
      ['Sin fecha SL', null],
      ['Fecha rara', null],
    ],
  );
  assert.equal(lista[0].texto, 'Nos hicieron 40 camisetas con el logo. "Perfectas", dijo el equipo.\nRepetiremos.');
  assert.equal(lista[2].nombre, NOMBRE_ANONIMO, 'mostrar_nombre NO: nombre anónimo');
  assert.ok(lista.every((o) => !('empresa' in o) && Object.keys(o).every((k) => ['nombre', 'texto', 'fecha'].includes(k))), 'ninguna otra columna sale');
});

test('SI/Sí/si/NO/no sin distinguir mayúsculas ni tildes; lo dudoso es NO', () => {
  for (const v of ['SI', 'Sí', 'si', 'sí', ' Si ', 'SÍ']) assert.equal(esSi(v), true, v);
  for (const v of ['NO', 'no', '', undefined, 'yes', 'S', 'si no', 'sí.']) assert.equal(esSi(v), false, String(v));
});

test('texto plano: caracteres de control fuera, espacios compactados, 500 caracteres con puntos suspensivos', () => {
  assert.equal(limpiarTexto('Hola\u0000 \u0007mundo\t  doble   espacio\u001b', 500), 'Hola mundo doble espacio');
  const largo = 'a'.repeat(600);
  const corto = limpiarTexto(largo, MAX_CARACTERES);
  assert.equal(corto.length, MAX_CARACTERES);
  assert.ok(corto.endsWith('…'));
  assert.equal(limpiarTexto('uno\r\n\r\n\r\n\r\ndos', 500), 'uno\n\ndos');
});

test('fecha opcional yyyy-mm-dd, solo si existe', () => {
  assert.equal(fechaValida('2026-10-05'), '2026-10-05');
  assert.equal(fechaValida(' 2026-10-05 '), '2026-10-05');
  assert.equal(fechaValida('2026-02-30'), undefined);
  assert.equal(fechaValida('05/10/2026'), undefined);
  assert.equal(fechaValida(''), undefined);
  assert.equal(fechaValida(undefined), undefined);
});

test('CSV sin las columnas obligatorias o vacío: ninguna opinión', () => {
  assert.deepEqual(opinionesDesdeCsv(''), []);
  assert.deepEqual(opinionesDesdeCsv('nombre,texto\nA,B'), []);
  assert.deepEqual(opinionesDesdeCsv('empresa,opinion,mostrar_nombre,publicar,fecha\n'), []);
});

test('columnas desconocidas y en otro orden no molestan; cabecera con mayúsculas y espacios', () => {
  const csv = 'Marca temporal, Publicar ,OPINION,Empresa,mostrar_nombre\n2026-10-01 10:00,SI,Genial,Bar Pepe,SI';
  assert.deepEqual(opinionesDesdeCsv(csv), [{ nombre: 'Bar Pepe', texto: 'Genial' }]);
});
