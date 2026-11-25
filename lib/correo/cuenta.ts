import 'server-only';

// Emails del espacio cliente. HOY están SIMULADOS: no envían nada (el SMTP oficial se conecta en otro prompt; los emails
// de confirmación y de recuperación de contraseña los envía Supabase Auth con sus plantillas por defecto).
// Para el siguiente prompt: implementar cada función con lib/correo/transporte.ts y las plantillas de lib/correo/plantillas.ts
// (bienvenida, cuenta validada, cuenta rechazada, pedido recibido). Las acciones ya las llaman en el momento correcto.

export interface ResultadoCorreo {
  enviado: false;
  motivo: 'simulado';
}

const simulado: ResultadoCorreo = { enviado: false, motivo: 'simulado' };

export async function notificarCuentaRegistrada(destino: string): Promise<ResultadoCorreo> {
  void [destino];
  return simulado;
}
export async function notificarCuentaValidada(destino: string): Promise<ResultadoCorreo> {
  void [destino];
  return simulado;
}
export async function notificarCuentaRechazada(destino: string, motivo?: string): Promise<ResultadoCorreo> {
  void [destino, motivo];
  return simulado;
}
export async function notificarPedidoRecibido(destino: string, numeroPedido: string): Promise<ResultadoCorreo> {
  void [destino, numeroPedido];
  return simulado;
}
