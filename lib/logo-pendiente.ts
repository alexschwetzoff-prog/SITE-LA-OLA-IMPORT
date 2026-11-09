'use client';

// Traspaso del logo entre la home («Pruébalo con tu logo») y el estudio: se guarda en sessionStorage del navegador
// y el estudio lo recoge al abrirse. Nada se sube a ningún servidor (sección 4 de la spec).

import { MAX_LADO_PX } from './estudio/logo';

export const CLAVE_LOGO_PENDIENTE = 'marca:logo-pendiente';

interface LogoGuardado {
  nombre: string;
  tipo: string;
  dataUrl: string;
}

function leerComoDataUrl(archivo: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(archivo);
  });
}

/** Versión PNG más pequeña del logo, por si el original no cabe en el almacenamiento del navegador. */
function reducir(canvas: HTMLCanvasElement, lado: number): string {
  const escala = Math.min(1, lado / Math.max(canvas.width, canvas.height));
  const salida = document.createElement('canvas');
  salida.width = Math.max(1, Math.round(canvas.width * escala));
  salida.height = Math.max(1, Math.round(canvas.height * escala));
  salida.getContext('2d')?.drawImage(canvas, 0, 0, salida.width, salida.height);
  return salida.toDataURL('image/png');
}

function guardar(datos: LogoGuardado): boolean {
  try {
    sessionStorage.setItem(CLAVE_LOGO_PENDIENTE, JSON.stringify(datos));
    return true;
  } catch {
    return false;
  }
}

/** Guarda el archivo original; si no cabe, una copia PNG reducida. Devuelve false si no hay forma de guardarlo. */
export async function guardarLogoPendiente(archivo: File, canvas?: HTMLCanvasElement | null): Promise<boolean> {
  try {
    const dataUrl = await leerComoDataUrl(archivo);
    if (guardar({ nombre: archivo.name, tipo: archivo.type, dataUrl })) return true;
  } catch {
    // se intenta con la copia reducida
  }
  if (!canvas) return false;
  for (const lado of [MAX_LADO_PX, 1200, 800]) {
    if (guardar({ nombre: archivo.name.replace(/\.[^.]+$/, '') + '.png', tipo: 'image/png', dataUrl: reducir(canvas, lado) })) return true;
  }
  return false;
}

/** Recoge (y borra) el logo pendiente como un File, listo para procesarLogo(). */
export async function tomarLogoPendiente(): Promise<File | null> {
  let datos: LogoGuardado | null = null;
  try {
    const crudo = sessionStorage.getItem(CLAVE_LOGO_PENDIENTE);
    datos = crudo ? (JSON.parse(crudo) as LogoGuardado) : null;
    if (crudo) sessionStorage.removeItem(CLAVE_LOGO_PENDIENTE);
  } catch {
    return null;
  }
  if (!datos?.dataUrl) return null;
  const respuesta = await fetch(datos.dataUrl);
  const blob = await respuesta.blob();
  return new File([blob], datos.nombre || 'logo', { type: datos.tipo || blob.type });
}
