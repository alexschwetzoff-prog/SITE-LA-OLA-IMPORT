// Prueba del transporte Resend de lib/correo/transporte.ts sin enviar nada (fase 9): se sustituye `fetch` por una
// función que captura la petición a la API de Resend y responde como lo haría ella. Comprueba que el remitente, el
// destinatario, el reply-to, el asunto y los adjuntos (con su cid para las imágenes incrustadas) van como toca, y que
// sin contraseña de Gmail un fallo de Resend se propaga (el respaldo por Gmail solo entra si hay contraseña).
// Uso: node --conditions=react-server --no-warnings --import ./scripts/cargador-ts.mjs scripts/probar-resend.mjs
import assert from 'node:assert/strict';

process.env.CORREO_TRANSPORTE = 'resend';
process.env.RESEND_API_KEY = 're_prueba_no_valida';
process.env.GMAIL_CONTRASENA_APP = '';
process.env.CORREO_DESTINO = 'email-pendiente@example.com';
delete process.env.RESEND_REMITENTE;

const peticiones = [];
let respuesta = { estado: 200, cuerpo: { id: 'email_de_prueba' } };
globalThis.fetch = async (url, opciones = {}) => {
  peticiones.push({ url: String(url), opciones });
  return new Response(JSON.stringify(respuesta.cuerpo), { status: respuesta.estado, headers: { 'content-type': 'application/json' } });
};

const { enviarCorreo, remitente, configuracionCorreo } = await import('../lib/correo/transporte.ts');

assert.equal(configuracionCorreo().transporte, 'resend');
assert.deepEqual(remitente('[MARCA]'), { nombre: '[MARCA]', email: 'hola@dominio-pendiente.example' });

const resultado = await enviarCorreo({
  para: { nombre: 'Cliente de prueba', email: 'cliente@example.com' },
  deNombre: '[MARCA]',
  asunto: 'Hemos recibido tu solicitud, Cliente',
  html: '<p>Hola <img src="cid:logo-marca"></p>',
  texto: 'Hola',
  responderA: { nombre: '[MARCA]', email: 'email-pendiente@example.com' },
  adjuntos: [
    { nombre: 'logo-marca.png', tipo: 'image/png', contenido: Buffer.from('png-falso'), cid: 'logo-marca' },
    { nombre: 'archivo.pdf', tipo: 'application/pdf', contenido: Buffer.from('pdf-falso') },
  ],
});
assert.deepEqual(resultado, { id: 'email_de_prueba', transporte: 'resend' });
assert.equal(peticiones.length, 1, 'una sola petición a la API');
const [peticion] = peticiones;
assert.match(peticion.url, /^https:\/\/api\.resend\.com\/emails/);
assert.equal(peticion.opciones.method, 'POST');
const cabeceras = new Headers(peticion.opciones.headers);
assert.equal(cabeceras.get('authorization'), 'Bearer re_prueba_no_valida');
const cuerpo = JSON.parse(peticion.opciones.body);
assert.equal(cuerpo.from, '[MARCA] <hola@dominio-pendiente.example>');
assert.equal(cuerpo.to, 'Cliente de prueba <cliente@example.com>');
assert.equal(cuerpo.reply_to, '[MARCA] <email-pendiente@example.com>');
assert.equal(cuerpo.subject, 'Hemos recibido tu solicitud, Cliente');
assert.equal(cuerpo.html, '<p>Hola <img src="cid:logo-marca"></p>');
assert.equal(cuerpo.text, 'Hola');
assert.equal(cuerpo.attachments.length, 2);
assert.equal(cuerpo.attachments[0].filename, 'logo-marca.png');
assert.equal(cuerpo.attachments[0].content_type, 'image/png');
assert.equal(cuerpo.attachments[0].content_id, 'logo-marca');
assert.equal(Buffer.from(cuerpo.attachments[0].content, 'base64').toString(), 'png-falso', 'el contenido viaja en base64');
assert.equal(cuerpo.attachments[1].content_id, undefined);
console.log('OK  envío por Resend: remitente, destinatario, reply-to, asunto y 2 adjuntos (1 con cid) correctos');

// Resend falla y no hay contraseña de Gmail: el error llega a quien llama (el formulario enseña el aviso con WhatsApp).
respuesta = { estado: 422, cuerpo: { statusCode: 422, name: 'validation_error', message: 'Dominio no verificado' } };
await assert.rejects(
  enviarCorreo({ para: { email: 'cliente@example.com' }, asunto: 'x', html: 'x', texto: 'x' }),
  (e) => /Resend: .*validation_error/.test(e.message) || /Dominio no verificado/.test(e.message),
);
console.log('OK  un fallo de Resend sin contraseña de Gmail se propaga con su mensaje');

// Con contraseña de Gmail, el respaldo intenta el SMTP de Gmail (aquí no hay red: basta con ver que lo intenta).
process.env.GMAIL_CONTRASENA_APP = 'abcd efgh ijkl mnop';
await assert.rejects(
  enviarCorreo({ para: { email: 'cliente@example.com' }, asunto: 'x', html: 'x', texto: 'x' }),
  (e) => !/Resend:/.test(e.message),
);
console.log('OK  con contraseña de Gmail, el fallo de Resend pasa al respaldo por Gmail (aquí sin red)');
console.log('\nRESEND OK');
