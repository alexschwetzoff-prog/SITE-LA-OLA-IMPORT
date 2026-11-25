import assert from 'node:assert/strict';
import { test } from 'node:test';
import { esSiretValido, formatearSiret, normalizarSiret } from './siret';

test('SIRET válidos (Luhn), con o sin espacios', () => {
  assert.equal(esSiretValido('73282932000074'), true);
  assert.equal(esSiretValido('732 829 320 00074'), true);
  assert.equal(esSiretValido('732.829.320.00074'), true);
  assert.equal(esSiretValido('44306184100047'), true);
});

test('SIRET inválidos: longitud, letras y suma de Luhn', () => {
  assert.equal(esSiretValido('73282932000075'), false);
  assert.equal(esSiretValido('7328293200007'), false);
  assert.equal(esSiretValido('732829320000744'), false);
  assert.equal(esSiretValido('7328293200007A'), false);
  assert.equal(esSiretValido(''), false);
  assert.equal(esSiretValido('00000000000001'), false);
});

test('excepción de La Poste (SIREN 356000000)', () => {
  assert.equal(esSiretValido('35600000000001'), true); // suma de cifras 15: múltiplo de 5
  assert.equal(esSiretValido('35600000000002'), false);
});

test('normalizar y formatear', () => {
  assert.equal(normalizarSiret(' 732-829.320 00074 '), '73282932000074');
  assert.equal(formatearSiret('73282932000074'), '732 829 320 00074');
});
