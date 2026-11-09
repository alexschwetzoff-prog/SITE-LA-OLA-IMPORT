// Datos del formulario corto de la home (aterrizaje): se guardan en el navegador y /proyecto los precarga.

export const CLAVE_ATERRIZAJE = 'marca:aterrizaje';

export interface DatosAterrizaje {
  nombre: string;
  negocio: string;
  contacto: string;
  mensaje: string;
  tramo: string;
}

export function leerAterrizaje(): Partial<DatosAterrizaje> {
  try {
    const crudo = sessionStorage.getItem(CLAVE_ATERRIZAJE);
    return crudo ? (JSON.parse(crudo) as Partial<DatosAterrizaje>) : {};
  } catch {
    return {};
  }
}
