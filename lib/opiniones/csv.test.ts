// Pruebas del parser CSV (fase 10). Se ejecutan con `npm test` (node --test, sin dependencias).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsearCsv } from './csv';

test('campos simples, CRLF y última fila sin salto final', () => {
  assert.deepEqual(parsearCsv('a,b,c\r\n1,2,3\r\n4,5,6'), [
    ['a', 'b', 'c'],
    ['1', '2', '3'],
    ['4', '5', '6'],
  ]);
});

test('comillas: comas, saltos de línea y comillas dobladas dentro de un campo', () => {
  const csv = 'empresa,opinion\n"Café, S.L.","Primera línea\nsegunda ""entre comillas"" y fin"\n';
  assert.deepEqual(parsearCsv(csv), [
    ['empresa', 'opinion'],
    ['Café, S.L.', 'Primera línea\nsegunda "entre comillas" y fin'],
  ]);
});

test('BOM al principio y filas vacías o solo de comas se ignoran', () => {
  const csv = '﻿a,b\n\n,\n1,2\n   ,  \n';
  assert.deepEqual(parsearCsv(csv), [
    ['a', 'b'],
    ['1', '2'],
  ]);
});

test('finales de línea \\r sueltos y campos vacíos entre comas', () => {
  assert.deepEqual(parsearCsv('a,,c\r1,,3'), [
    ['a', '', 'c'],
    ['1', '', '3'],
  ]);
});

test('texto vacío', () => {
  assert.deepEqual(parsearCsv(''), []);
  assert.deepEqual(parsearCsv('\n\n'), []);
});
