import 'server-only';

// Interfaz de pagos. HOY solo existe un proveedor SIMULADO: no se conecta ningún servicio externo de pago.
// Para el siguiente prompt: implementar `ProveedorPago` con la pasarela elegida (Stripe, Mollie, Monext…), crear la sesión
// de pago desde `crearSesionPago`, y un webhook (route handler) que pase el pedido de 'pendiente_pago' a 'pagado' con
// la service role (solo en ese webhook). Nada más del código necesita cambiar: las acciones solo conocen esta interfaz.

export interface PedidoParaPago {
  id: string;
  numero: string;
  totalTtc: number;
  moneda: 'EUR';
}

export interface SesionPago {
  proveedor: string;
  /** URL a la que enviar al cliente para pagar; null con el proveedor simulado. */
  urlPago: string | null;
  estado: 'simulado' | 'creada';
}

export interface ProveedorPago {
  nombre: string;
  crearSesionPago(pedido: PedidoParaPago): Promise<SesionPago>;
}

const proveedorSimulado: ProveedorPago = {
  nombre: 'simulado',
  async crearSesionPago() {
    return { proveedor: 'simulado', urlPago: null, estado: 'simulado' };
  },
};

export function proveedorDePagos(): ProveedorPago {
  return proveedorSimulado;
}
