import assert from 'node:assert/strict';
import { test } from 'node:test';
import { esquemaLogin, esquemaRegistro, rutaInternaSegura } from './esquema';

const valido = {
  razon_social: 'Camping Les Pins SARL', siret: '732 829 320 00074', numero_tva: 'fr 12 345678901', nombre_contacto: 'Camille', apellidos_contacto: 'Durand',
  telefono: '06 12 34 56 78', direccion_facturacion: '12 rue des Lilas', codigo_postal: '84170', ciudad: 'Monteux', pais: 'FR', sector: 'Camping',
  email: ' Camille@Example.FR ', password: 'Motdepasse2026', password_confirmacion: 'Motdepasse2026', condiciones: true, privacidad: true,
};

test('registro válido: normaliza SIRET, TVA y email', () => {
  const r = esquemaRegistro.safeParse(valido);
  assert.equal(r.success, true);
  if (r.success) {
    assert.equal(r.data.siret, '73282932000074');
    assert.equal(r.data.numero_tva, 'FR12345678901');
    assert.equal(r.data.email, 'camille@example.fr');
  }
});

test('el SIRET debe ser válido; la TVA es opcional', () => {
  assert.equal(esquemaRegistro.safeParse({ ...valido, siret: '73282932000075' }).success, false);
  assert.equal(esquemaRegistro.safeParse({ ...valido, numero_tva: '' }).success, true);
  assert.equal(esquemaRegistro.safeParse({ ...valido, numero_tva: '12' }).success, false);
});

test('las casillas legales son obligatorias y vienen sin marcar', () => {
  assert.equal(esquemaRegistro.safeParse({ ...valido, privacidad: false }).success, false);
  assert.equal(esquemaRegistro.safeParse({ ...valido, condiciones: false }).success, false);
});

test('contraseña: longitud, letra y cifra, y confirmación igual', () => {
  assert.equal(esquemaRegistro.safeParse({ ...valido, password: 'corta1', password_confirmacion: 'corta1' }).success, false);
  assert.equal(esquemaRegistro.safeParse({ ...valido, password: 'sololetrasaqui', password_confirmacion: 'sololetrasaqui' }).success, false);
  assert.equal(esquemaRegistro.safeParse({ ...valido, password_confirmacion: 'Otra2026' }).success, false);
});

test('login y rutas internas seguras', () => {
  assert.equal(esquemaLogin.safeParse({ email: 'x', password: '' }).success, false);
  assert.equal(rutaInternaSegura('/compte/panier'), '/compte/panier');
  assert.equal(rutaInternaSegura('//evil.com'), '/compte');
  assert.equal(rutaInternaSegura('https://evil.com'), '/compte');
});
